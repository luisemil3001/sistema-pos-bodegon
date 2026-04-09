const pool = require('../config/db');

// Obtener todos los productos (con info de categoría)
const getProducts = async (req, res) => {
  try {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      ORDER BY p.nombre ASC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener un solo producto
const getProductById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
};

// Crear producto
const createProduct = async (req, res) => {
  const { codigo_barras, nombre, descripcion, categoria_id, proveedor_id, precio_costo, precio_venta, stock, min_stock, unidad, aplica_iva, fecha_vencimiento } = req.body;
  
  if (!nombre || !precio_venta) {
    return res.status(400).json({ error: 'El nombre y precio de venta son obligatorios' });
  }

  try {
    // Verificar si el código de barras ya existe (y no está vacío)
    if (codigo_barras) {
      const [existing] = await pool.query('SELECT id FROM productos WHERE codigo_barras = ?', [codigo_barras]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'El código de barras ya existe' });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO productos 
      (codigo_barras, nombre, descripcion, categoria_id, proveedor_id, precio_costo, precio_venta, stock, fecha_vencimiento, min_stock, unidad, aplica_iva) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo_barras || null, nombre, descripcion || null, categoria_id || null, proveedor_id || null, precio_costo || 0, precio_venta, stock || 0, fecha_vencimiento || null, min_stock || 5, unidad || 'unid', aplica_iva !== undefined ? aplica_iva : true]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Producto creado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  const { codigo_barras, nombre, descripcion, categoria_id, proveedor_id, precio_costo, precio_venta, stock, min_stock, unidad, aplica_iva, fecha_vencimiento } = req.body;
  
  if (!nombre || !precio_venta) {
    return res.status(400).json({ error: 'El nombre y precio de venta son obligatorios' });
  }

  try {
    // Si envían código de barras, validar que no le pertenezca a OTRO producto
    if (codigo_barras) {
      const [existing] = await pool.query('SELECT id FROM productos WHERE codigo_barras = ? AND id != ?', [codigo_barras, req.params.id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'El código de barras ya pertenece a otro producto' });
      }
    }

    const [result] = await pool.query(
      `UPDATE productos SET 
      codigo_barras = ?, nombre = ?, descripcion = ?, categoria_id = ?, proveedor_id = ?, 
      precio_costo = ?, precio_venta = ?, stock = ?, fecha_vencimiento = ?, min_stock = ?, unidad = ?, aplica_iva = ? 
      WHERE id = ?`,
      [codigo_barras || null, nombre, descripcion || null, categoria_id || null, proveedor_id || null, precio_costo || 0, precio_venta, stock || 0, fecha_vencimiento || null, min_stock || 5, unidad || 'unid', aplica_iva !== undefined ? aplica_iva : true, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    
    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

// Eliminar producto
const deleteProduct = async (req, res) => {
  try {
    // Primero, verificar que el producto no esté en una factura
    const [facturas] = await pool.query('SELECT id FROM factura_items WHERE producto_id = ? LIMIT 1', [req.params.id]);
    if (facturas.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el producto porque ya tiene ventas asociadas' });
    }

    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
