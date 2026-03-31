const axios = require('axios');
require('dotenv').config();

async function testClose() {
    try {
        // En un entorno real necesitaríamos el token, pero voy a usar una bypass o simplemente ver si el servidor registra el error
        // Pero mejor, voy a crear un script que use el pool directamente para cerrar la caja y ver si explota
        const pool = require('./src/config/db');
        const usuarioId = 1;
        const montoCierre = 1216.40;
        const observaciones = "Cierre manual de prueba";

        // Logic from controller
        const [cajaRows] = await pool.query(
            'SELECT id, monto_apertura FROM cajas WHERE usuario_id = ? AND estado = "abierta" ORDER BY id DESC LIMIT 1',
            [usuarioId]
        );

        if (cajaRows.length === 0) {
            console.log('No hay caja abierta');
            process.exit(0);
        }

        const cajaId = cajaRows[0].id;
        const montoApertura = parseFloat(cajaRows[0].monto_apertura);

        const [salesRows] = await pool.query(
            'SELECT metodo_pago, SUM(total) as total_metodo FROM facturas WHERE caja_id = ? AND estado = "pagada" GROUP BY metodo_pago',
            [cajaId]
        );

        let totalEfectivo = 0;
        let totalTarjeta = 0;
        salesRows.forEach(row => {
            if (row.metodo_pago === 'efectivo') totalEfectivo = parseFloat(row.total_metodo);
            if (row.metodo_pago === 'tarjeta' || row.metodo_pago === 'transferencia') totalTarjeta += parseFloat(row.total_metodo);
        });

        const efectivoEsperado = montoApertura + totalEfectivo;
        const diferencia = montoCierre - efectivoEsperado;

        console.log({ apertura: montoApertura, ventas: totalEfectivo, esperado: efectivoEsperado, cierre: montoCierre, diferencia });

        await pool.query(
            `UPDATE cajas SET 
            fecha_cierre = CURRENT_TIMESTAMP, 
            monto_cierre = ?, 
            total_ventas_efectivo = ?, 
            total_ventas_tarjeta = ?, 
            diferencia = ?, 
            estado = "cerrada" 
            WHERE id = ?`,
            [montoCierre, totalEfectivo, totalTarjeta, diferencia, cajaId]
        );
        console.log('--- Cierre exitoso en la BD ---');
        process.exit(0);

    } catch (err) {
        console.error('ERROR EN CIERRE:', err);
        process.exit(1);
    }
}
testClose();
