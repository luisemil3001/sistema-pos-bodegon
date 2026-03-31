const pool = require('../config/db');

// Obtener todos los proveedores
const getProveedores = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM proveedores ORDER BY nombre ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

// Crear un proveedor
const createProveedor = async (req, res) => {
  const { nombre, rnc_cedula, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const [result] = await pool.query(
      'INSERT INTO proveedores (nombre, rnc_cedula, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)',
      [nombre, rnc_cedula || null, telefono || null, email || null, direccion || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Proveedor creado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El RNC o documento ya está registrado' });
    console.error(err);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

// Actualizar un proveedor
const updateProveedor = async (req, res) => {
  const { id } = req.params;
  const { nombre, rnc_cedula, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const [result] = await pool.query(
      'UPDATE proveedores SET nombre = ?, rnc_cedula = ?, telefono = ?, email = ?, direccion = ? WHERE id = ?',
      [nombre, rnc_cedula || null, telefono || null, email || null, direccion || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor actualizado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El RNC o documento ya está registrado' });
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

// Eliminar un proveedor
const deleteProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM proveedores WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(400).json({ error: 'No se puede eliminar el proveedor porque tiene compras asociadas' });
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};

module.exports = { getProveedores, createProveedor, updateProveedor, deleteProveedor };
