const pool = require('../config/db');

// Obtener todas las estaciones
const getWorkstations = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estaciones_trabajo ORDER BY nombre ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener las estaciones' });
    }
};

// Crear una estación
const createWorkstation = async (req, res) => {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    try {
        const [result] = await pool.query(
            'INSERT INTO estaciones_trabajo (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({ id: result.insertId, message: 'Estación creada con éxito' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya existe una estación con ese nombre' });
        }
        res.status(500).json({ error: 'Error al crear la estación' });
    }
};

// Actualizar una estación
const updateWorkstation = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, activa } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE estaciones_trabajo SET nombre = ?, descripcion = ?, activa = ? WHERE id = ?',
            [nombre, descripcion, activa !== undefined ? activa : true, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Estación no encontrada' });
        res.json({ message: 'Estación actualizada con éxito' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar la estación' });
    }
};

// Eliminar una estación (o desactivarla si tiene registros)
const deleteWorkstation = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar si tiene turnos asociados
        const [cajas] = await pool.query('SELECT id FROM cajas WHERE estacion_id = ? LIMIT 1', [id]);
        if (cajas.length > 0) {
            // Si tiene registros, mejor desactivarla
            await pool.query('UPDATE estaciones_trabajo SET activa = FALSE WHERE id = ?', [id]);
            return res.json({ message: 'La estación tiene historial y ha sido desactivada en lugar de eliminada.' });
        }

        const [result] = await pool.query('DELETE FROM estaciones_trabajo WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Estación no encontrada' });
        res.json({ message: 'Estación eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar la estación' });
    }
};

module.exports = { getWorkstations, createWorkstation, updateWorkstation, deleteWorkstation };
