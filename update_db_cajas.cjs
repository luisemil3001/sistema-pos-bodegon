const pool = require('./billing-api/src/config/db');

async function updateDB() {
    try {
        console.log('Iniciando actualizaciones de base de datos...');

        // 1. Crear tabla de Cajas (Turnos)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cajas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                monto_apertura DECIMAL(10,2) NOT NULL,
                fecha_cierre TIMESTAMP NULL,
                monto_cierre DECIMAL(10,2) NULL,
                total_ventas_efectivo DECIMAL(10,2) DEFAULT 0,
                total_ventas_tarjeta DECIMAL(10,2) DEFAULT 0,
                diferencia DECIMAL(10,2) DEFAULT 0,
                observaciones TEXT,
                estado ENUM('abierta', 'cerrada') DEFAULT 'abierta',
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        `);
        console.log('Tabla "cajas" creada/verificada.');

        // 2. Agregar columna caja_id a facturas para rastrear a qué turno pertenece cada venta
        const [cols] = await pool.query("SHOW COLUMNS FROM facturas LIKE 'caja_id'");
        if (cols.length === 0) {
            await pool.query("ALTER TABLE facturas ADD COLUMN caja_id INT, ADD FOREIGN KEY (caja_id) REFERENCES cajas(id)");
            console.log('Columna "caja_id" agregada a la tabla "facturas".');
        }

        console.log('Actualización de base de datos completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error actualizando la base de datos:', error);
        process.exit(1);
    }
}

updateDB();
