const pool = require('./src/config/db');

async function createTables() {
  try {
    console.log("Creando tabla proveedores...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proveedores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          rnc_cedula VARCHAR(20) UNIQUE,
          telefono VARCHAR(20),
          email VARCHAR(100),
          direccion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creando tabla compras...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compras (
          id INT AUTO_INCREMENT PRIMARY KEY,
          numero_factura_proveedor VARCHAR(50) NOT NULL,
          proveedor_id INT,
          usuario_id INT,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          subtotal DECIMAL(10,2) NOT NULL,
          itbis DECIMAL(10,2) NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'credito') DEFAULT 'efectivo',
          FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

    console.log("Creando tabla compra_items...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compra_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          compra_id INT,
          producto_id INT,
          cantidad INT NOT NULL,
          costo_unitario DECIMAL(10,2) NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          FOREIGN KEY (compra_id) REFERENCES compras(id),
          FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);

    console.log("Tablas creadas exitosamente.");
  } catch (err) {
    console.log("Error creando tablas:", err.message);
  } finally {
    process.exit(0);
  }
}

createTables();
