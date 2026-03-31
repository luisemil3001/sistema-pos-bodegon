const pool = require('./src/config/db');

async function patch() {
    try {
        console.log('Iniciando parche de base de datos...');
        
        // 1. Verificar si la columna existe antes de añadirla
        const [columns] = await pool.query('SHOW COLUMNS FROM empresas LIKE "tipo_impresora"');
        if (columns.length === 0) {
            await pool.query(`
                ALTER TABLE empresas 
                ADD COLUMN tipo_impresora ENUM('pos', 'fiscal') DEFAULT 'pos'
            `);
            console.log('Columna tipo_impresora añadida correctamente a tabla empresas.');
        } else {
            console.log('La columna tipo_impresora ya existe.');
        }

        // 2. Asegurar que existe al menos una configuración
        const [rows] = await pool.query('SELECT * FROM empresas LIMIT 1');
        if (rows.length === 0) {
            await pool.query(`
                INSERT INTO empresas (nombre, itbis_tasa, tipo_impresora) 
                VALUES ('Mi Negocio', 16.00, 'pos')
            `);
            console.log('Configuración inicial creada.');
        }

        console.log('Parche completado exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error al aplicar el parche:', err.message);
        process.exit(1);
    }
}

patch();
