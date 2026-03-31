const pool = require('../config/db');

// Crear una nueva factura
const createInvoice = async (req, res) => {
  const { cliente_id, items, metodo_pago, descuento_global, ncf_tipo } = req.body;
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

    // 2. Gestionar NCF (opcional, si viene ncf_tipo)
    let ncf_final = null;
    if (ncf_tipo) {
      const [ncfRows] = await connection.query(
        'SELECT * FROM ncf_sequences WHERE tipo = ? AND activo = 1 FOR UPDATE',
        [ncf_tipo]
      );

      if (ncfRows.length === 0) {
        throw new Error(`Secuencia NCF para tipo ${ncf_tipo} no encontrada o inactiva.`);
      }

      const seq = ncfRows[0];
      if (seq.secuencia_actual > seq.secuencia_fin) {
        throw new Error(`Secuencia NCF agotada para el tipo ${seq.nombre}.`);
      }

      // Ejemplo: B + 01 + 00000001
      ncf_final = `${seq.prefijo}${seq.tipo}${String(seq.secuencia_actual).padStart(8, '0')}`;

      // Incrementar secuencia
      await connection.query(
        'UPDATE ncf_sequences SET secuencia_actual = secuencia_actual + 1 WHERE id = ?',
        [seq.id]
      );
    }

    const [empresa] = await connection.query('SELECT itbis_tasa FROM empresas LIMIT 1');
    const tasa_iva = empresa.length > 0 ? parseFloat(empresa[0].itbis_tasa) / 100 : 0.16;

    let totalSubtotal = 0;
    let totalIva = 0;

    // Verificar stock y calcular totales
    const processedItems = [];

    for (const item of items) {
      const [prodRows] = await connection.query('SELECT * FROM productos WHERE id = ?', [item.producto_id]);
      if (prodRows.length === 0) throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      
      const producto = prodRows[0];
      
      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto: ${producto.nombre} (Disponibles: ${producto.stock})`);
      }

      const itemSubtotal = producto.precio_venta * item.cantidad;
      const itemIva = producto.aplica_iva ? (itemSubtotal * tasa_iva) : 0;
      
      totalSubtotal += itemSubtotal;
      totalIva += itemIva;

      processedItems.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unitario: producto.precio_venta,
        subtotal: itemSubtotal,
        iva: itemIva
      });

      // Descontar inventario
      await connection.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, producto.id]);
    }

    const descuentoFinal = descuento_global || 0;
    const granTotal = (totalSubtotal + totalIva) - descuentoFinal;

    // Generar un número de factura (Formato: FAC-YYMMDD-XXXX)
    const fecha = new Date();
    const [lastFactura] = await connection.query('SELECT id FROM facturas ORDER BY id DESC LIMIT 1');
    const nextId = lastFactura.length > 0 ? lastFactura[0].id + 1 : 1;
    const numero_factura = `FAC-${fecha.getFullYear().toString().slice(-2)}${String(fecha.getMonth()+1).padStart(2,'0')}${String(fecha.getDate()).padStart(2,'0')}-${String(nextId).padStart(4,'0')}`;

    // Insertar encabezado de factura (incluyendo caja_id y ncf)
    const [facturaResult] = await connection.query(
      `INSERT INTO facturas 
      (numero_factura, cliente_id, usuario_id, caja_id, ncf, ncf_tipo, subtotal, itbis, descuento, total, metodo_pago) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero_factura, cliente_id || null, usuario_id, caja_id, ncf_final, ncf_tipo || null, totalSubtotal, totalIva, descuentoFinal, granTotal, metodo_pago || 'efectivo']
    );

    const nuevaFacturaId = facturaResult.insertId;

    // Insertar el detalle de la factura
    for (const pItem of processedItems) {
      await connection.query(
        `INSERT INTO factura_items (factura_id, producto_id, cantidad, precio_unitario, subtotal) 
        VALUES (?, ?, ?, ?, ?)`,
        [nuevaFacturaId, pItem.producto_id, pItem.cantidad, pItem.precio_unitario, pItem.subtotal]
      );
    }

    await connection.commit();
    res.status(201).json({ 
      success: true, 
      message: 'Factura generada y stock actualizado exitosamente',
      numero_factura,
      ncf: ncf_final,
      factura_id: nuevaFacturaId
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
      SELECT i.*, p.nombre as producto_nombre, p.codigo_barras
      FROM factura_items i
      JOIN productos p ON i.producto_id = p.id
      WHERE i.factura_id = ?
    `, [id]);

    const facturaCompleta = {
      ...facturas[0],
      items
    };

    res.json(facturaCompleta);
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

    // 1. Obtener la factura y verificar su estado
    const [facturas] = await connection.query('SELECT * FROM facturas WHERE id = ?', [id]);
    if (facturas.length === 0) throw new Error('Factura no encontrada');
    
    const factura = facturas[0];
    if (factura.estado === 'anulada') throw new Error('Esta factura ya ha sido anulada');

    // 2. Obtener los productos vinculados a esta factura
    const [items] = await connection.query('SELECT * FROM factura_items WHERE factura_id = ?', [id]);

    // 3. Reintegrar el stock a los productos
    for (const item of items) {
      await connection.query(
        'UPDATE productos SET stock = stock + ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // 4. Marcar la factura como anulada
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

module.exports = { createInvoice, getInvoices, getInvoiceById, voidInvoice };
