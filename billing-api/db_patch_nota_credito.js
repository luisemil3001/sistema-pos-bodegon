const pool = require('./src/config/db');

async function patch() {
    try {
        console.log('Creando tablas de Nota de Crédito...');

        // 1. Tabla notas_credito
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notas_credito (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_nota VARCHAR(25) UNIQUE NOT NULL,
                factura_id INT NOT NULL,
                usuario_id INT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                motivo TEXT,
                tipo ENUM('total', 'parcial') DEFAULT 'total',
                subtotal DECIMAL(15,2) DEFAULT 0,
                iva DECIMAL(15,2) DEFAULT 0,
                igtf_monto DECIMAL(15,2) DEFAULT 0,
                total DECIMAL(15,2) NOT NULL,
                metodo_devolucion ENUM('efectivo', 'transferencia', 'tarjeta') DEFAULT 'efectivo',
                estado ENUM('activa', 'anulada') DEFAULT 'activa',
                FOREIGN KEY (factura_id) REFERENCES facturas(id),
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        `);
        console.log('Tabla notas_credito creada.');

        // 2. Tabla notas_credito_items
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notas_credito_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nota_id INT NOT NULL,
                producto_id INT NOT NULL,
                cantidad INT NOT NULL,
                precio_unitario DECIMAL(15,2) NOT NULL,
                subtotal DECIMAL(15,2) NOT NULL,
                FOREIGN KEY (nota_id) REFERENCES notas_credito(id),
                FOREIGN KEY (producto_id) REFERENCES productos(id)
            )
        `);
        console.log('Tabla notas_credito_items creada.');

        // 3. Columna tiene_nota_credito en facturas
        const [cols] = await pool.query('SHOW COLUMNS FROM facturas LIKE "tiene_nota_credito"');
        if (cols.length === 0) {
            await pool.query('ALTER TABLE facturas ADD COLUMN tiene_nota_credito BOOLEAN DEFAULT FALSE');
            console.log('Columna tiene_nota_credito añadida a facturas.');
        }

        console.log('Parche Nota de Crédito completado.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

patch();
