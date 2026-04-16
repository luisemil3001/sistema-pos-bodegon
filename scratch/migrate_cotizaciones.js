const pool = require('./billing-api/src/config/db');

async function migrate() {
  try {
    console.log('Iniciando migración de cotizaciones...');
    await pool.query(`
      ALTER TABLE cotizaciones 
      ADD COLUMN IF NOT EXISTS tasa_cambio_usada DECIMAL(10,4) DEFAULT 1.0000 
      AFTER total
    `);
    console.log('Migración completada exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error en migración:', err);
    process.exit(1);
  }
}

migrate();
