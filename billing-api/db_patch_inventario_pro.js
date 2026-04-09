const mysql = require('mysql2/promise');
require('dotenv').config();

async function patch() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('Aplicando parches de Inventario Pro...');

    // 1. Añadir proveedor_id a productos
    try {
      await connection.execute(`
        ALTER TABLE productos 
        ADD COLUMN proveedor_id INT NULL AFTER categoria_id,
        ADD CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
      `);
      console.log('✅ Columna proveedor_id añadida con éxito.');
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') console.log('⚠️ proveedor_id ya existe.');
      else throw err;
    }

    // 2. Crear tabla de ajustes_stock
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ajustes_stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        producto_id INT NOT NULL,
        usuario_id INT DEFAULT NULL,
        stock_anterior INT NOT NULL,
        stock_nuevo INT NOT NULL,
        cantidad_ajuste INT NOT NULL,
        tipo ENUM('ENTRADA', 'SALIDA', 'MERMA', 'AJUSTE_FISICO') NOT NULL,
        motivo VARCHAR(255) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    console.log('✅ Tabla ajustes_stock creada/verificada.');

  } catch (err) {
    console.error('❌ Error en el parche:', err);
  } finally {
    await connection.end();
  }
}

patch();
