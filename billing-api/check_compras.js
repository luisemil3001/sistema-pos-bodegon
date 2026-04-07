const pool = require('./src/config/db');

async function test() {
  const [compras] = await pool.query('SELECT * FROM compras');
  console.log("Compras table content:", compras);
  process.exit(0);
}
test();
