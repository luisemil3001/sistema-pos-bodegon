const pool = require('./src/config/db');

async function patch() {
    try {
        console.log('Ampliando valores de metodo_pago en facturas...');
        
        await pool.query(`
            ALTER TABLE facturas 
            MODIFY COLUMN metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'credito', 'divisas', 'dolares', 'mixto') DEFAULT 'efectivo'
        `);
        
        console.log('Parche completado exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error al aplicar el parche:', err.message);
        process.exit(1);
    }
}

patch();
