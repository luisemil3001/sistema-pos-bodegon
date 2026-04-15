const pool = require('../config/db');

// Obtener todas las compras
const getCompras = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, p.nombre as proveedor_nombre, p.rnc_cedula, u.nombre as registrador_nombre
      FROM compras c
      LEFT JOIN proveedores p ON c.proveedor_id = p.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.fecha DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

// Registrar una nueva compra
const createCompra = async (req, res) => {
  const { numero_factura_proveedor, proveedor_id, items, metodo_pago } = req.body;
  const usuario_id = req.user.id;

  if (!numero_factura_proveedor) return res.status(400).json({ error: 'El número de factura del proveedor es requerido' });
  if (!items || items.length === 0) return res.status(400).json({ error: 'La compra debe tener al menos un producto' });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let totalSubtotal = 0;
    let totalIva = 0;
    const processedItems = [];

    // Calcular totales y procesar items
    for (const item of items) {
      if (!item.producto_id || !item.cantidad || !item.costo_unitario) {
        throw new Error('Datos de producto incompletos en la compra');
      }

      // El costo puede traer IVA o ser base, asumiremos que costo_unitario es base para simplificar
      const [prodRows] = await connection.query('SELECT aplica_iva FROM productos WHERE id = ?', [item.producto_id]);
      if (prodRows.length === 0) throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      
      const aplica_iva = prodRows[0].aplica_iva;
      const itemSubtotal = item.costo_unitario * item.cantidad;
      
      // Obtener porcentaje de IVA de la configuración
      const [empresaRows] = await connection.query('SELECT itbis_tasa FROM empresas LIMIT 1');
      const tasa_iva = empresaRows.length > 0 ? parseFloat(empresaRows[0].itbis_tasa) / 100 : 0.16;

      const itemIva = aplica_iva ? (itemSubtotal * tasa_iva) : 0;
      
      totalSubtotal += itemSubtotal;
      totalIva += itemIva;

      processedItems.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
        subtotal: itemSubtotal
      });

      // ¡AUMENTAR STOCK DEL PRODUCTO E ACTUALIZAR PRECIO DE COSTO!
      await connection.query(
        'UPDATE productos SET stock = stock + ?, precio_costo = ? WHERE id = ?', 
        [item.cantidad, item.costo_unitario, item.producto_id]
      );
    }

    const granTotal = totalSubtotal + totalIva;

    // Insertar encabezado de compra
    const [empSettings] = await connection.query('SELECT tasa_dolar FROM empresas LIMIT 1');
    const tasa_compra = empSettings.length > 0 ? parseFloat(empSettings[0].tasa_dolar) : 36.45;

    const [compraResult] = await connection.query(
      `INSERT INTO compras 
      (numero_factura_proveedor, proveedor_id, usuario_id, subtotal, itbis, total, metodo_pago, tasa_cambio) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero_factura_proveedor, proveedor_id || null, usuario_id, totalSubtotal, totalIva, granTotal, metodo_pago || 'efectivo', tasa_compra]
    );

    const nuevaCompraId = compraResult.insertId;

    // Insertar el detalle de la compra
    for (const pItem of processedItems) {
      await connection.query(
        `INSERT INTO compra_items (compra_id, producto_id, cantidad, costo_unitario, subtotal) 
        VALUES (?, ?, ?, ?, ?)`,
        [nuevaCompraId, pItem.producto_id, pItem.cantidad, pItem.costo_unitario, pItem.subtotal]
      );
    }

    await connection.commit();
    res.status(201).json({ 
      success: true, 
      message: 'Compra registrada y stock actualizado exitosamente',
      compra_id: nuevaCompraId
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || 'Error al registrar la compra' });
  } finally {
    connection.release();
  }
};

// Obtener detalle de una compra específica
const getCompraById = async (req, res) => {
  const { id } = req.params;
  try {
    const [compras] = await pool.query(`
      SELECT c.*, p.nombre as proveedor_nombre, p.rnc_cedula, p.direccion, u.nombre as registrador_nombre
      FROM compras c
      LEFT JOIN proveedores p ON c.proveedor_id = p.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (compras.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });

    const [items] = await pool.query(`
      SELECT i.*, pr.nombre as producto_nombre, pr.codigo_barras
      FROM compra_items i
      JOIN productos pr ON i.producto_id = pr.id
      WHERE i.compra_id = ?
    `, [id]);

    const compraCompleta = {
      ...compras[0],
      items
    };

    res.json(compraCompleta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el detalle de la compra' });
  }
};

module.exports = { getCompras, createCompra, getCompraById };
