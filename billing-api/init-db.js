const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    multipleStatements: true
  });

  try {
    console.log('Cargando esquema de base de datos...');
    const schema = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    
    await connection.query(schema);
    console.log('✅ Base de datos inicializada correctamente.');
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
  } finally {
    await connection.end();
  }
}

initDB();
