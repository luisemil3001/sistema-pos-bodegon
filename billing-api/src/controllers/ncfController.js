const pool = require('../config/db');

// Listar todas las secuencias
const getSequences = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ncf_sequences');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener secuencias NCF' });
    }
};

// Crear o actualizar secuencia
const saveSequence = async (req, res) => {
    const { id, tipo, nombre, prefijo, secuencia_inicio, secuencia_fin, secuencia_actual, activo } = req.body;
    try {
        if (id) {
            await pool.query(
                'UPDATE ncf_sequences SET tipo=?, nombre=?, prefijo=?, secuencia_inicio=?, secuencia_fin=?, secuencia_actual=?, activo=? WHERE id=?',
                [tipo, nombre, prefijo, secuencia_inicio, secuencia_fin, secuencia_actual, activo, id]
            );
            res.json({ message: 'Secuencia actualizada' });
        } else {
            const [result] = await pool.query(
                'INSERT INTO ncf_sequences (tipo, nombre, prefijo, secuencia_inicio, secuencia_fin, secuencia_actual, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [tipo, nombre, prefijo, secuencia_inicio, secuencia_fin, secuencia_actual, activo]
            );
            res.status(201).json({ id: result.insertId, message: 'Secuencia creada' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar secuencia NCF' });
    }
};

module.exports = { getSequences, saveSequence };
