const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    try {
        const [rows] = await connection.query("SHOW TABLES LIKE 'cotizaciones'");
        if (rows.length > 0) {
            console.log('TABLE_EXISTS');
            const [cols] = await connection.query("DESCRIBE cotizaciones");
            console.table(cols);
        } else {
            console.log('TABLE_NOT_FOUND');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}
check();
