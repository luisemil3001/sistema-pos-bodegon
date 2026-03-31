const pool = require('./src/config/db');

async function patch() {
  try {
    await pool.query("ALTER TABLE empresas ADD COLUMN tipo_impresora VARCHAR(50) DEFAULT 'termica'");
    console.log("Column added");
  } catch (err) {
    console.log("Error:", err.message);
  } finally {
    process.exit(0);
  }
}
patch();
