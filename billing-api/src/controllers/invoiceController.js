const pool = require('../config/db');
const { generarPayloadImpresion, enviarAImpresoraFiscal } = require('../services/printerService');

// Crear una nueva factura
const createInvoice = async (req, res) => {
  const { cliente_id, items, metodo_pago, descuento_global } = req.body;
  const usuario_id = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'La factura debe tener al menos un producto' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verificar si el usuario tiene una caja abierta
    const [cajaRows] = await connection.query(
      'SELECT id FROM cajas WHERE usuario_id = ? AND estado = "abierta" ORDER BY id DESC LIMIT 1',
      [usuario_id]
    );

    if (cajaRows.length === 0) {
      throw new Error('Debe abrir la caja (iniciar turno) antes de realizar ventas.');
    }
    const caja_id = cajaRows[0].id;

    // 2. Obtener configuración de la empresa
    const [empresaRows] = await connection.query('SELECT * FROM empresas LIMIT 1');
    const empresa = empresaRows[0] || {};
    const tasa_iva = parseFloat(empresa.itbis_tasa || 16) / 100;
    const tasa_igtf = parseFloat(empresa.igtf_tasa || 3) / 100;

    let totalSubtotal = 0;
    let totalIva = 0;
    const processedItems = [];

    // 3. Verificar stock y calcular totales
    for (const item of items) {
      const [prodRows] = await connection.query('SELECT * FROM productos WHERE id = ?', [item.producto_id]);
      if (prodRows.length === 0) throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      
      const producto = prodRows[0];
      
      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para: ${producto.nombre} (Disponibles: ${producto.stock})`);
      }

      const itemSubtotal = producto.precio_venta * item.cantidad;
      const itemIva = producto.aplica_iva ? (itemSubtotal * tasa_iva) : 0;
      
      totalSubtotal += itemSubtotal;
      totalIva += itemIva;

      processedItems.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unitario: producto.precio_venta,
        aplica_iva: producto.aplica_iva,
        subtotal: itemSubtotal,
        iva: itemIva
      });

      await connection.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, producto.id]);
    }

    const descuentoFinal = descuento_global || 0;

    // 4. Calcular IGTF si el pago es en divisas o dólares
    const metodos_divisas = ['divisas', 'dolares', 'dólares', 'usd', 'eur'];
    const aplicaIGTF = metodos_divisas.includes((metodo_pago || '').toLowerCase());
    const baseIGTF = totalSubtotal + totalIva - descuentoFinal;
    const igtf_monto = aplicaIGTF ? parseFloat((baseIGTF * tasa_igtf).toFixed(2)) : 0;

    const granTotal = parseFloat((baseIGTF + igtf_monto).toFixed(2));

    // 5. Generar número de factura (FAC-YYMMDD-XXXX)
    const fecha = new Date();
    const [lastFactura] = await connection.query('SELECT id FROM facturas ORDER BY id DESC LIMIT 1');
    const nextId = lastFactura.length > 0 ? lastFactura[0].id + 1 : 1;
    const numero_factura = `FAC-${fecha.getFullYear().toString().slice(-2)}${String(fecha.getMonth()+1).padStart(2,'0')}${String(fecha.getDate()).padStart(2,'0')}-${String(nextId).padStart(4,'0')}`;

    // 6. Insertar encabezado de factura
    const [facturaResult] = await connection.query(
      `INSERT INTO facturas 
      (numero_factura, cliente_id, usuario_id, caja_id, subtotal, itbis, descuento, igtf_monto, total, metodo_pago) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero_factura, cliente_id || null, usuario_id, caja_id, totalSubtotal, totalIva, descuentoFinal, igtf_monto, granTotal, metodo_pago || 'efectivo']
    );

    const nuevaFacturaId = facturaResult.insertId;

    // 7. Insertar detalle de la factura
    for (const pItem of processedItems) {
      await connection.query(
        `INSERT INTO factura_items (factura_id, producto_id, cantidad, precio_unitario, subtotal) 
        VALUES (?, ?, ?, ?, ?)`,
        [nuevaFacturaId, pItem.producto_id, pItem.cantidad, pItem.precio_unitario, pItem.subtotal]
      );
    }

    await connection.commit();

    // 8. Generar payload de impresión (sin bloquear la respuesta)
    const facturaParaImprimir = {
      numero_factura,
      fecha: new Date().toISOString(),
      metodo_pago,
      subtotal: totalSubtotal,
      itbis: totalIva,
      iva: totalIva,
      igtf_monto,
      total: granTotal,
      items: processedItems.map(pi => ({
        ...pi,
        producto_nombre: (items.find(i => i.producto_id === pi.producto_id) || {}).nombre || `Producto #${pi.producto_id}`
      }))
    };

    const payloadImpresion = generarPayloadImpresion(facturaParaImprimir, {
      ...empresa,
      nombre: empresa.nombre,
      rnc: empresa.rnc,
    });

    // Enviar a la impresora en segundo plano (no bloquea)
    enviarAImpresoraFiscal(payloadImpresion).catch(console.error);

    res.status(201).json({ 
      success: true, 
      message: 'Factura generada exitosamente',
      numero_factura,
      factura_id: nuevaFacturaId,
      igtf_aplicado: aplicaIGTF,
      igtf_monto,
      impresion: payloadImpresion
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || 'Error al procesar la factura' });
  } finally {
    connection.release();
  }
};

// Obtener historial de facturas
const getInvoices = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, c.nombre as cliente_nombre, c.rnc_cedula, u.nombre as cajero_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      LEFT JOIN usuarios u ON f.usuario_id = u.id
      ORDER BY f.fecha DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
};

// Obtener detalle de una factura específica
const getInvoiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const [facturas] = await pool.query(`
      SELECT f.*, c.nombre as cliente_nombre, c.rnc_cedula, c.direccion, u.nombre as cajero_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      LEFT JOIN usuarios u ON f.usuario_id = u.id
      WHERE f.id = ?
    `, [id]);

    if (facturas.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

    const [items] = await pool.query(`
      SELECT i.*, p.nombre as producto_nombre, p.codigo_barras, p.aplica_iva
      FROM factura_items i
      JOIN productos p ON i.producto_id = p.id
      WHERE i.factura_id = ?
    `, [id]);

    res.json({ ...facturas[0], items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el detalle de la factura' });
  }
};

// Anular una factura (revertir stock)
const voidInvoice = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [facturas] = await connection.query('SELECT * FROM facturas WHERE id = ?', [id]);
    if (facturas.length === 0) throw new Error('Factura no encontrada');
    
    const factura = facturas[0];
    if (factura.estado === 'anulada') throw new Error('Esta factura ya ha sido anulada');

    const [items] = await connection.query('SELECT * FROM factura_items WHERE factura_id = ?', [id]);

    for (const item of items) {
      await connection.query(
        'UPDATE productos SET stock = stock + ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    await connection.query('UPDATE facturas SET estado = "anulada" WHERE id = ?', [id]);

    await connection.commit();
    res.json({ success: true, message: 'Factura anulada y stock reintegrado correctamente' });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || 'Error al anular la factura' });
  } finally {
    connection.release();
  }
};

// Generar Payload para Copia No Fiscal
const reprintInvoice = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [facturas] = await pool.query(`
      SELECT f.*, c.nombre as cliente_nombre, c.rnc_cedula, c.direccion, u.nombre as cajero_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      LEFT JOIN usuarios u ON f.usuario_id = u.id
      WHERE f.id = ?
    `, [id]);

    if (facturas.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

    const [items] = await pool.query(`
      SELECT i.*, p.nombre as producto_nombre, p.codigo_barras, p.aplica_iva
      FROM factura_items i
      JOIN productos p ON i.producto_id = p.id
      WHERE i.factura_id = ?
    `, [id]);

    const facturaCompleta = { ...facturas[0], items };

    const [empresaRows] = await pool.query('SELECT * FROM empresas LIMIT 1');
    const empresa = empresaRows[0] || {};

    const payloadImpresion = generarPayloadImpresion(facturaCompleta, empresa, { esCopia: true });

    // Enviar a la impresora en segundo plano (para que escupa la copia)
    enviarAImpresoraFiscal(payloadImpresion).catch(console.error);

    res.json({ success: true, impresion: payloadImpresion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar la copia no fiscal' });
  }
};

module.exports = { createInvoice, getInvoices, getInvoiceById, voidInvoice, reprintInvoice };

