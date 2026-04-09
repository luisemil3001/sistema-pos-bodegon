const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('Iniciando migración: Añadiendo margen_vencimiento a empresas...');
    
    // 1. Verificar si la columna ya existe
    const [columns] = await pool.query("SHOW COLUMNS FROM empresas LIKE 'margen_vencimiento'");
    
    if (columns.length === 0) {
      console.log('Añadiendo columna margen_vencimiento...');
      await pool.query(`
        ALTER TABLE empresas 
        ADD COLUMN margen_vencimiento INT DEFAULT 30
      `);
    } else {
      console.log('La columna margen_vencimiento ya existe.');
    }
    
    // 2. Asegurar que el registro 1 tenga el valor por defecto si es nulo
    await pool.query(`
      UPDATE empresas SET margen_vencimiento = 30 WHERE id = 1 AND margen_vencimiento IS NULL
    `);

    console.log('Migración completada exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante la migración:', err);
    process.exit(1);
  }
}

migrate();
