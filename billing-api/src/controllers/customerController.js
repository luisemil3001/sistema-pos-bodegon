const pool = require('../config/db');

// Obtener todos los clientes
const getCustomers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes ORDER BY nombre ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

// Crear un cliente
const createCustomer = async (req, res) => {
  const { nombre, rnc_cedula, telefono, email, direccion } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
  }

  try {
    if (rnc_cedula) {
      const [existing] = await pool.query('SELECT id FROM clientes WHERE rnc_cedula = ?', [rnc_cedula]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'El RNC o Cédula ya está registrado' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, rnc_cedula, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)',
      [nombre, rnc_cedula || null, telefono || null, email || null, direccion || null]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Cliente creado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el cliente' });
  }
};

// Actualizar un cliente
const updateCustomer = async (req, res) => {
  const { nombre, rnc_cedula, telefono, email, direccion } = req.body;
  const { id } = req.params;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
  }

  try {
    if (rnc_cedula) {
      const [existing] = await pool.query('SELECT id FROM clientes WHERE rnc_cedula = ? AND id != ?', [rnc_cedula, id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'El RNC o Cédula ya pertenece a otro cliente' });
      }
    }

    const [result] = await pool.query(
      'UPDATE clientes SET nombre = ?, rnc_cedula = ?, telefono = ?, email = ?, direccion = ? WHERE id = ?',
      [nombre, rnc_cedula || null, telefono || null, email || null, direccion || null, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    
    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
};

// Eliminar un cliente
const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si tiene facturas asociadas
    const [facturas] = await pool.query('SELECT id FROM facturas WHERE cliente_id = ? LIMIT 1', [id]);
    if (facturas.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene facturas asociadas' });
    }

    const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
};

module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer };
