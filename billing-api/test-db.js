const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:\\mi-primer-react\\billing-api\\.env' });

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        console.log('Connected');
        await connection.end();
    } catch (e) {
        console.error(e);
    }
}
test();
