const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePassword() {
  const hash = await bcrypt.hash('admin123', 10);
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    const [result] = await connection.execute(
      'UPDATE usuarios SET password = ? WHERE usuario = "admin"',
      [hash]
    );
    console.log('✅ Contraseña actualizada a admin123');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

updatePassword();
