const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Listar usuarios
const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nombre, usuario, rol, activo, created_at FROM usuarios');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

// Crear usuario
const createUser = async (req, res) => {
    const { nombre, usuario, password, rol } = req.body;
    if (!nombre || !usuario || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)',
            [nombre, usuario, hashedPassword, rol || 'cajero']
        );

        res.status(201).json({ id: result.insertId, message: 'Usuario creado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

// Actualizar usuario
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { nombre, usuario, password, rol, activo } = req.body;

    try {
        let query = 'UPDATE usuarios SET nombre = ?, usuario = ?, rol = ?, activo = ?';
        let params = [nombre, usuario, rol, activo];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await pool.query(query, params);
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // En lugar de borrar, podrías desactivarlo. Pero por ahora borrar si no tiene facturas
        const [facturas] = await pool.query('SELECT id FROM facturas WHERE usuario_id = ? LIMIT 1', [id]);
        if (facturas.length > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el usuario porque ya tiene ventas registradas. Mejor desactívelo.' });
        }

        await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
