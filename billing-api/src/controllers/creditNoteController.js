const pool = require('../config/db');
const { generarPayloadNotaCredito } = require('../services/printerService');

// Crear una Nota de Crédito (devolución total con reembolso)
const createCreditNote = async (req, res) => {
  const { factura_id, motivo, metodo_devolucion } = req.body;
  const usuario_id = req.user.id;

  if (!factura_id) return res.status(400).json({ error: 'Se requiere el ID de la factura' });
  if (!motivo || motivo.trim() === '') return res.status(400).json({ error: 'El motivo es obligatorio' });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verificar factura original
    const [facturas] = await connection.query(`
      SELECT f.*, c.nombre as cliente_nombre, c.rnc_cedula
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE f.id = ?
    `, [factura_id]);

    if (facturas.length === 0) throw new Error('Factura no encontrada');
    const factura = facturas[0];

    if (factura.estado === 'anulada') throw new Error('Esta factura ya fue anulada o tiene una nota de crédito');
    if (factura.tiene_nota_credito) throw new Error('Esta factura ya tiene una Nota de Crédito emitida');

    // 2. Obtener ítems de la factura
    const [items] = await connection.query(`
      SELECT fi.*, p.nombre as producto_nombre, p.aplica_iva
      FROM factura_items fi
      JOIN productos p ON fi.producto_id = p.id
      WHERE fi.factura_id = ?
    `, [factura_id]);

    // 3. Generar número de nota de crédito (NC-YYMMDD-XXXX)
    const fecha = new Date();
    const [lastNC] = await connection.query('SELECT id FROM notas_credito ORDER BY id DESC LIMIT 1');
    const nextId = lastNC.length > 0 ? lastNC[0].id + 1 : 1;
    const numero_nota = `NC-${fecha.getFullYear().toString().slice(-2)}${String(fecha.getMonth()+1).padStart(2,'0')}${String(fecha.getDate()).padStart(2,'0')}-${String(nextId).padStart(4,'0')}`;

    // 4. Crear la nota de crédito
    const [ncResult] = await connection.query(
      `INSERT INTO notas_credito 
      (numero_nota, factura_id, usuario_id, motivo, tipo, subtotal, iva, igtf_monto, total, metodo_devolucion) 
      VALUES (?, ?, ?, ?, 'total', ?, ?, ?, ?, ?)`,
      [
        numero_nota, factura_id, usuario_id, motivo.trim(),
        factura.subtotal, factura.itbis,
        factura.igtf_monto || 0, factura.total,
        metodo_devolucion || 'efectivo'
      ]
    );

    const notaId = ncResult.insertId;

    // 5. Insertar ítems de la nota de crédito y revertir stock
    for (const item of items) {
      await connection.query(
        `INSERT INTO notas_credito_items (nota_id, producto_id, cantidad, precio_unitario, subtotal) 
        VALUES (?, ?, ?, ?, ?)`,
        [notaId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
      );

      // Reintegrar stock
      await connection.query(
        'UPDATE productos SET stock = stock + ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // 6. Actualizar la factura original
    await connection.query(
      'UPDATE facturas SET estado = "anulada", tiene_nota_credito = TRUE WHERE id = ?',
      [factura_id]
    );

    await connection.commit();

    // 7. Generar payload de impresión para la NC
    const [empresaRows] = await pool.query('SELECT * FROM empresas LIMIT 1');
    const empresa = empresaRows[0] || {};

    const notaParaImprimir = {
      numero_nota,
      numero_factura_ref: factura.numero_factura,
      fecha: new Date().toISOString(),
      motivo,
      metodo_devolucion: metodo_devolucion || 'efectivo',
      cliente_nombre: factura.cliente_nombre || 'Consumidor Final',
      rnc_cedula: factura.rnc_cedula,
      subtotal: parseFloat(factura.subtotal || 0),
      iva: parseFloat(factura.itbis || 0),
      igtf_monto: parseFloat(factura.igtf_monto || 0),
      total: parseFloat(factura.total || 0),
      items: items.map(i => ({
        producto_nombre: i.producto_nombre,
        cantidad: i.cantidad,
        precio_unitario: parseFloat(i.precio_unitario),
        subtotal: parseFloat(i.subtotal),
        aplica_iva: i.aplica_iva,
      }))
    };

    const payloadImpresion = generarPayloadNotaCredito(notaParaImprimir, empresa);

    res.status(201).json({
      success: true,
      message: `Nota de Crédito ${numero_nota} emitida correctamente`,
      numero_nota,
      nota_id: notaId,
      impresion: payloadImpresion
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || 'Error al emitir la Nota de Crédito' });
  } finally {
    connection.release();
  }
};

// Listar historial de notas de crédito
const getCreditNotes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT nc.*, 
        f.numero_factura as factura_numero,
        u.nombre as cajero_nombre,
        c.nombre as cliente_nombre
      FROM notas_credito nc
      JOIN facturas f ON nc.factura_id = f.id
      LEFT JOIN usuarios u ON nc.usuario_id = u.id
      LEFT JOIN clientes c ON f.cliente_id = c.id
      ORDER BY nc.fecha DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener notas de crédito' });
  }
};

// Obtener detalle de una NC para reimpresión
const getCreditNoteById = async (req, res) => {
  const { id } = req.params;
  try {
    const [notas] = await pool.query(`
      SELECT nc.*, 
        f.numero_factura as factura_numero,
        u.nombre as cajero_nombre,
        c.nombre as cliente_nombre, c.rnc_cedula
      FROM notas_credito nc
      JOIN facturas f ON nc.factura_id = f.id
      LEFT JOIN usuarios u ON nc.usuario_id = u.id
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE nc.id = ?
    `, [id]);

    if (notas.length === 0) return res.status(404).json({ error: 'Nota de Crédito no encontrada' });

    const [items] = await pool.query(`
      SELECT nci.*, p.nombre as producto_nombre
      FROM notas_credito_items nci
      JOIN productos p ON nci.producto_id = p.id
      WHERE nci.nota_id = ?
    `, [id]);

    res.json({ ...notas[0], items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la nota de crédito' });
  }
};

module.exports = { createCreditNote, getCreditNotes, getCreditNoteById };
