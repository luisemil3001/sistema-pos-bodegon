const mysql = require('mysql2/promise');

async function run() {
  try {
    const con = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'facturacion_db'
    });
    
    console.log('Creando tabla estaciones_trabajo...');
    await con.query(`
      CREATE TABLE IF NOT EXISTS estaciones_trabajo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion TEXT,
        activa BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Agregando estacion_id a la tabla cajas...');
    try {
      await con.query(`
        ALTER TABLE cajas 
        ADD COLUMN estacion_id INT AFTER usuario_id,
        ADD CONSTRAINT fk_cajas_estacion FOREIGN KEY (estacion_id) REFERENCES estaciones_trabajo(id)
      `);
    } catch (e) {
      console.log('La columna ya existe o hubo un error esperado.');
    }
    
    console.log('Insertando estaciones por defecto...');
    await con.query("INSERT IGNORE INTO estaciones_trabajo (id, nombre, descripcion) VALUES (1, 'CAJA PRINCIPAL', 'Servidor Central')");
    await con.query("INSERT IGNORE INTO estaciones_trabajo (id, nombre, descripcion) VALUES (2, 'CAJA 2', 'Terminal Adicional')");
    
    console.log('Soporte de estaciones completado.');
    await con.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
