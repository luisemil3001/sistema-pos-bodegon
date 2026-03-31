const pool = require('./src/config/db');

async function updateDBNCF() {
    try {
        console.log('Iniciando actualización NCF...');

        // 1. Crear tabla de Secuencias NCF
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ncf_sequences (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(2) NOT NULL, -- 01, 02, 14, 15, etc.
                nombre VARCHAR(100) NOT NULL,
                prefijo VARCHAR(1) DEFAULT 'B', -- B o E
                secuencia_inicio BIGINT NOT NULL,
                secuencia_fin BIGINT NOT NULL,
                secuencia_actual BIGINT NOT NULL,
                activo BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('Tabla "ncf_sequences" creada/verificada.');

        // 2. Agregar columnas NCF a facturas
        const [cols] = await pool.query("SHOW COLUMNS FROM facturas LIKE 'ncf'");
        if (cols.length === 0) {
            await pool.query("ALTER TABLE facturas ADD COLUMN ncf VARCHAR(13), ADD COLUMN ncf_tipo VARCHAR(2)");
            console.log('Columnas "ncf" y "ncf_tipo" agregadas a la tabla "facturas".');
        }

        // 3. Insertar secuencias iniciales (B01, B02) si la tabla está vacía
        const [check] = await pool.query("SELECT id FROM ncf_sequences LIMIT 1");
        if (check.length === 0) {
            await pool.query(`
                INSERT INTO ncf_sequences (tipo, nombre, prefijo, secuencia_inicio, secuencia_fin, secuencia_actual) 
                VALUES 
                ('01', 'CRÉDITO FISCAL', 'B', 1, 99999999, 1),
                ('02', 'CONSUMIDOR FINAL', 'B', 1, 99999999, 1)
            `);
            console.log('Secuencias iniciales NCF insertadas.');
        }

        console.log('Actualización NCF completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error actualizando NCF:', error);
        process.exit(1);
    }
}

updateDBNCF();
