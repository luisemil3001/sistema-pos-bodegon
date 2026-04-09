const mysql = require('mysql2/promise');
require('dotenv').config();

async function patch() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('Aplicando parche de vencimientos...');
    await connection.execute(`
      ALTER TABLE productos 
      ADD COLUMN fecha_vencimiento DATE DEFAULT NULL AFTER stock
    `);
    console.log('✅ Columna fecha_vencimiento añadida con éxito.');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('⚠️ La columna ya existe.');
    } else {
      console.error('Error:', err);
    }
  } finally {
    await connection.end();
  }
}

patch();
