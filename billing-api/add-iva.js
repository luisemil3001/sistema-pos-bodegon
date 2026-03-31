const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    await connection.query('ALTER TABLE productos ADD COLUMN aplica_iva BOOLEAN DEFAULT TRUE AFTER precio_venta;');
    console.log('✅ Columna aplica_iva agregada a la tabla productos');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ La columna aplica_iva ya existe en la tabla productos');
    } else {
      console.error('❌ Error alterando la tabla:', err.message);
    }
  } finally {
    await connection.end();
  }
}

updateSchema();
