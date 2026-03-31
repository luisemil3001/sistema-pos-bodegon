const pool = require('../config/db');

// Obtener todas las categorías
const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

module.exports = { getCategories };
