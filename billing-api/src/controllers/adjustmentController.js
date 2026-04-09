const pool = require('../config/db');

const createAdjustment = async (req, res) => {
  const { producto_id, stock_nuevo, tipo, motivo } = req.body;
  const usuario_id = req.user?.id || null;

  if (!producto_id || stock_nuevo === undefined || !tipo || !motivo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener stock actual
    const [prodRows] = await connection.query('SELECT stock FROM productos WHERE id = ? FOR UPDATE', [producto_id]);
    if (prodRows.length === 0) {
      throw new Error('Producto no encontrado');
    }

    const stock_anterior = prodRows[0].stock;
    const cantidad_ajuste = stock_nuevo - stock_anterior;

    // 2. Registrar el ajuste
    await connection.query(
      `INSERT INTO ajustes_stock (producto_id, usuario_id, stock_anterior, stock_nuevo, cantidad_ajuste, tipo, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [producto_id, usuario_id, stock_anterior, stock_nuevo, cantidad_ajuste, tipo, motivo]
    );

    // 3. Actualizar productos
    await connection.query('UPDATE productos SET stock = ? WHERE id = ?', [stock_nuevo, producto_id]);

    await connection.commit();
    res.json({ message: 'Ajuste procesado exitosamente', stock_nuevo });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: err.message || 'Error al procesar el ajuste' });
  } finally {
    connection.release();
  }
};

const getAdjustments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, p.nombre as producto_nombre, u.nombre as usuario_nombre
      FROM ajustes_stock a
      JOIN productos p ON a.producto_id = p.id
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY a.fecha DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial de ajustes' });
  }
};

module.exports = { createAdjustment, getAdjustments };
