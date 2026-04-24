const mysql = require('mysql2/promise');

async function run() {
  try {
    const con = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'facturacion_db'
    });
    
    console.log('Reparando tabla cajas...');
    
    try {
      await con.query("ALTER TABLE cajas ADD COLUMN observaciones TEXT AFTER estado");
      console.log('Columna observaciones añadida.');
    } catch (e) {
      console.log('Nota: observaciones ya existe o no se pudo añadir.');
    }
    
    try {
      await con.query("ALTER TABLE cajas ADD COLUMN diferencia DECIMAL(15,2) DEFAULT 0 AFTER total_ventas_tarjeta");
      console.log('Columna diferencia añadida.');
    } catch (e) {
      console.log('Nota: diferencia ya existe o no se pudo añadir.');
    }
    
    console.log('Tabla cajas reparada exitosamente.');
    await con.end();
    process.exit(0);
  } catch (err) {
    console.error('Error crítico:', err);
    process.exit(1);
  }
}

run();
