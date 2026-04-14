const pool = require('./src/config/db');

async function patch() {
    try {
        console.log('Creando tablas de Cotizaciones/Presupuestos...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cotizaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_cotizacion VARCHAR(20) UNIQUE NOT NULL,
                cliente_id INT NULL,
                usuario_id INT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                validez_dias INT DEFAULT 7,
                subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                itbis DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                igtf_monto DECIMAL(15,2) DEFAULT 0.00,
                descuento DECIMAL(15,2) DEFAULT 0.00,
                total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                estado ENUM('pendiente', 'facturada', 'vencida', 'anulada') DEFAULT 'pendiente',
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);
        console.log('Tabla cotizaciones lista.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS cotizacion_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cotizacion_id INT,
                producto_id INT NULL,
                cantidad INT NOT NULL,
                precio_unitario DECIMAL(15,2) NOT NULL,
                aplica_iva BOOLEAN DEFAULT TRUE,
                subtotal DECIMAL(15,2) NOT NULL,
                FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
            )
        `);
        console.log('Tabla cotizacion_items lista.');

        process.exit(0);
    } catch (err) {
        console.error('Error al aplicar el parche:', err.message);
        process.exit(1);
    }
}

patch();
