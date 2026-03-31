const mysql = require('mysql2/promise');
require('dotenv').config();

async function patchDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'pos_db'
  });

  try {
    console.log('Adding tipo_impresora column to empresas table...');
    await connection.query("ALTER TABLE empresas ADD COLUMN tipo_impresora VARCHAR(50) DEFAULT 'termica'");
    console.log('Column added successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists, skipping.');
    } else {
      console.error('Error:', err.message);
    }
  } finally {
    await connection.end();
  }
}

patchDB();
