const mysql = require('mysql2/promise');

async function run() {
  try {
    const con = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'facturacion_db'
    });
    
    await con.query(`
      INSERT IGNORE INTO empresas 
      (id, nombre, rnc, direccion, telefono, email, itbis_tasa, igtf_tasa, moneda, tasa_dolar, auto_sync_bcv) 
      VALUES 
      (1, 'BODEGON LA PARED', 'J-00000000', 'BODEGON LA PARED', '0000-0000000', 'admin@bodegon.com', 16.00, 3.00, 'VES', 36.50, 1)
    `);
    
    console.log('Default company settings inserted successfully.');
    await con.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
