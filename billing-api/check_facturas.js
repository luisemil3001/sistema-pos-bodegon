const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'facturacion_db'
    });
    const [rows] = await connection.query('DESCRIBE facturas');
    console.table(rows);
    await connection.end();
}
check();
