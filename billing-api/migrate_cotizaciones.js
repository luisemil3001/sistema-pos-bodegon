const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('Iniciando migración de cotizaciones...');
    // Verificamos si la columna ya existe primero
    const [columns] = await pool.query("SHOW COLUMNS FROM cotizaciones LIKE 'tasa_cambio_usada'");
    
    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE cotizaciones 
        ADD COLUMN tasa_cambio_usada DECIMAL(10,4) DEFAULT 1.0000 
        AFTER total
      `);
      console.log('Columna tasa_cambio_usada añadida.');
    } else {
      console.log('La columna ya existe.');
    }
    
    console.log('Migración completada exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error en migración:', err);
    process.exit(1);
  }
}

migrate();
