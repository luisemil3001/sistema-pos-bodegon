const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ? AND activo = 1', [usuario]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado or inactivo' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

const getMe = async (req, res) => {
    res.json(req.user);
};

module.exports = { login, getMe };
