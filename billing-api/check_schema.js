const mysql = require('mysql2/promise');
const config = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'facturacion_db'
};

async function checkSchema() {
    const connection = await mysql.createConnection(config);
    try {
        const [pRows] = await connection.query('DESCRIBE productos');
        console.log('--- PRODUCTOS ---');
        console.table(pRows);

        const [iRows] = await connection.query('DESCRIBE factura_items');
        console.log('--- FACTURA_ITEMS ---');
        console.table(iRows);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}
checkSchema();
