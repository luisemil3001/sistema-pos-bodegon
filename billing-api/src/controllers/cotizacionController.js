const pool = require('../config/db');

// Crear una nueva cotización
const createCotizacion = async (req, res) => {
  const { cliente_id, items, validez_dias = 7 } = req.body;
  const usuario_id = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'La cotización debe tener al menos un producto' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener configuración de la empresa para tasas de impuestos
    const [empresaRows] = await connection.query('SELECT * FROM empresas LIMIT 1');
    const empresa = empresaRows[0] || {};
    const tasa_iva = parseFloat(empresa.itbis_tasa || 16) / 100;
    const tasa_igtf = parseFloat(empresa.igtf_tasa || 3) / 100;

    let totalSubtotal = 0;
    let totalIva = 0;
    const processedItems = [];

    // 2. Calcular totales sin afectar stock
    for (const item of items) {
      const [prodRows] = await connection.query('SELECT * FROM productos WHERE id = ?', [item.producto_id]);
      if (prodRows.length === 0) throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      
      const producto = prodRows[0];
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
    }

    // Nota: Las cotizaciones pueden incluir o no el IGTF, para simplificar lo agregaremos
    // si el cliente pide que se simule el pago en divisas, pero por defecto lo podemos dejar en 0 en la cotiz.
    // Vamos a agregar IGTF si se le especifica algo en el frontend o lo dejamos en 0.
    const descuentoFinal = 0; // Se podría implementar luego
    const baseIGTF = totalSubtotal + totalIva - descuentoFinal;
    const igtf_monto = 0; // Opcional en cotizaciones. Podría calcularse a la hora de facturar.

    const granTotal = parseFloat((baseIGTF + igtf_monto).toFixed(2));

    // 3. Generar número de cotización (COT-YYMMDD-XXXX)
    const fecha = new Date();
    const [lastCot] = await connection.query('SELECT id FROM cotizaciones ORDER BY id DESC LIMIT 1');
    const nextId = lastCot.length > 0 ? lastCot[0].id + 1 : 1;
    const numero_cotizacion = `COT-${fecha.getFullYear().toString().slice(-2)}${String(fecha.getMonth()+1).padStart(2,'0')}${String(fecha.getDate()).padStart(2,'0')}-${String(nextId).padStart(4,'0')}`;

    const tasa_cambio_usada = parseFloat(empresa.tasa_dolar || 1);

    // 4. Insertar encabezado
    const [cotResult] = await connection.query(
      `INSERT INTO cotizaciones 
      (numero_cotizacion, cliente_id, usuario_id, validez_dias, subtotal, itbis, igtf_monto, descuento, total, tasa_cambio_usada) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero_cotizacion, cliente_id || null, usuario_id, validez_dias, totalSubtotal, totalIva, igtf_monto, descuentoFinal, granTotal, tasa_cambio_usada]
    );

    const nuevaCotId = cotResult.insertId;

    // 5. Insertar detalle
    for (const pItem of processedItems) {
      await connection.query(
        `INSERT INTO cotizacion_items (cotizacion_id, producto_id, cantidad, precio_unitario, aplica_iva, subtotal) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [nuevaCotId, pItem.producto_id, pItem.cantidad, pItem.precio_unitario, pItem.aplica_iva, pItem.subtotal]
      );
    }

    await connection.commit();

    res.status(201).json({ 
      success: true, 
      message: 'Cotización guardada exitosamente', 
      numero_cotizacion,
      cotizacion_id: nuevaCotId
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || 'Error al procesar la cotización' });
  } finally {
    connection.release();
  }
};

// Obtener listado de cotizaciones
const getCotizaciones = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, cl.nombre as cliente_nombre, cl.rnc_cedula, cl.telefono as cliente_telefono, u.nombre as cajero_nombre
      FROM cotizaciones c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.fecha DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
};

// Obtener detalle de cotización
const getCotizacionById = async (req, res) => {
  const { id } = req.params;
  try {
    const [cot] = await pool.query(`
      SELECT c.*, cl.nombre as cliente_nombre, cl.rnc_cedula, cl.direccion, cl.telefono as cliente_telefono, u.nombre as cajero_nombre
      FROM cotizaciones c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
    `, [id]);

    if(cot.length === 0) return res.status(404).json({ error: 'Cotización no encontrada' });

    const [items] = await pool.query(`
      SELECT i.*, p.nombre as producto_nombre, p.codigo_barras, p.aplica_iva
      FROM cotizacion_items i
      LEFT JOIN productos p ON i.producto_id = p.id
      WHERE i.cotizacion_id = ?
    `, [id]);

    res.json({ ...cot[0], items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el detalle de la cotización' });
  }
};

// Anular una cotización
const voidCotizacion = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE cotizaciones SET estado = "anulada" WHERE id = ? AND estado = "pendiente"', [id]);
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'La cotización no existe o ya no está en estado pendiente' });
    }
    res.json({ success: true, message: 'Cotización anulada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al anular la cotización' });
  }
};

module.exports = { createCotizacion, getCotizaciones, getCotizacionById, voidCotizacion };
