const pool = require('./src/config/db');

async function patch() {
    try {
        console.log('Iniciando parche bimonetario ($/Bs)...');
        
        // 1. Columnas para tabla empresas (Tasa actual)
        const [empColumns] = await pool.query('SHOW COLUMNS FROM empresas');
        const colNames = empColumns.map(c => c.Field);

        if (!colNames.includes('tasa_dolar')) {
            await pool.query("ALTER TABLE empresas ADD COLUMN tasa_dolar DECIMAL(15,4) DEFAULT 36.45");
            console.log('Columna tasa_dolar añadida a empresas.');
        }

        // 2. Columnas para tabla facturas (Tasa histórica)
        const [facColumns] = await pool.query('SHOW COLUMNS FROM facturas');
        const facColNames = facColumns.map(c => c.Field);

        if (!facColNames.includes('tasa_cambio_usada')) {
            await pool.query("ALTER TABLE facturas ADD COLUMN tasa_cambio_usada DECIMAL(15,4) DEFAULT 1.00");
            console.log('Columna tasa_cambio_usada añadida a facturas.');
        }

        console.log('Parche bimonetario completado exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error al aplicar el parche:', err.message);
        process.exit(1);
    }
}

patch();
