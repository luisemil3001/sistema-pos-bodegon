const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'facturacion_db'
    });
    const [rows] = await connection.query('SELECT * FROM cajas WHERE estado = "abierta"');
    console.table(rows);
    
    if (rows.length > 0) {
        const [sales] = await connection.query(
            'SELECT metodo_pago, SUM(total) as total_metodo FROM facturas WHERE caja_id = ? AND estado = "pagada" GROUP BY metodo_pago',
            [rows[0].id]
        );
        console.log('--- Ventas de esta caja ---');
        console.table(sales);
    }
    
    await connection.end();
}
check();
