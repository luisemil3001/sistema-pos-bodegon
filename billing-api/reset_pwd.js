const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const con = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'facturacion_db'
    });
    
    const hash = await bcrypt.hash('admin123', 10);
    console.log('New hash:', hash);
    
    const [result] = await con.query('UPDATE usuarios SET password = ? WHERE usuario = ?', [hash, 'admin']);
    console.log('Update result:', result);
    
    const [rows] = await con.query('SELECT usuario, password FROM usuarios WHERE usuario = ?', ['admin']);
    console.log('Verified user:', rows[0]);
    
    await con.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
