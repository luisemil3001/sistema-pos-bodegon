const pool = require('./src/config/db');

async function patch() {
    try {
        console.log('Iniciando parche de localización Venezuela...');
        
        // 1. Columnas para tabla empresas
        const [empColumns] = await pool.query('SHOW COLUMNS FROM empresas');
        const colNames = empColumns.map(c => c.Field);

        if (!colNames.includes('marca_fiscal')) {
            await pool.query("ALTER TABLE empresas ADD COLUMN marca_fiscal ENUM('tfhka', 'epson', 'bematech', 'generica') DEFAULT 'generica'");
            console.log('Columna marca_fiscal añadida a empresas.');
        }

        if (!colNames.includes('puerto_impresora')) {
            await pool.query("ALTER TABLE empresas ADD COLUMN puerto_impresora VARCHAR(20) DEFAULT 'COM1'");
            console.log('Columna puerto_impresora añadida a empresas.');
        }

        if (!colNames.includes('igtf_tasa')) {
            await pool.query("ALTER TABLE empresas ADD COLUMN igtf_tasa DECIMAL(5,2) DEFAULT 3.00");
            console.log('Columna igtf_tasa añadida a empresas.');
        }

        // 2. Columnas para tabla facturas
        const [facColumns] = await pool.query('SHOW COLUMNS FROM facturas');
        const facColNames = facColumns.map(c => c.Field);

        if (!facColNames.includes('igtf_monto')) {
            await pool.query("ALTER TABLE facturas ADD COLUMN igtf_monto DECIMAL(15,2) DEFAULT 0.00 AFTER total");
            console.log('Columna igtf_monto añadida a facturas.');
        }

        console.log('Parche Venezuela completado exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error al aplicar el parche:', err.message);
        process.exit(1);
    }
}

patch();
