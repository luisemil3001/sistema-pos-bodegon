const pool = require('../config/db');

// Obtener el estado de la caja para el usuario actual
const getEstadoCaja = async (req, res) => {
    const usuarioId = req.user.id;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM cajas WHERE usuario_id = ? AND estado = "abierta" ORDER BY id DESC LIMIT 1',
            [usuarioId]
        );
        res.json(rows.length > 0 ? rows[0] : null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener estado de caja' });
    }
};

// Abrir caja (Inicio de turno)
const abrirCaja = async (req, res) => {
    const usuarioId = req.user.id;
    const { monto_apertura, observaciones } = req.body;

    if (monto_apertura === undefined) {
        return res.status(400).json({ error: 'El monto de apertura es obligatorio' });
    }

    try {
        // Verificar si ya tiene una caja abierta
        const [open] = await pool.query('SELECT id FROM cajas WHERE usuario_id = ? AND estado = "abierta"', [usuarioId]);
        if (open.length > 0) {
            return res.status(400).json({ error: 'Ya tiene una caja abierta para este usuario' });
        }

        const [result] = await pool.query(
            'INSERT INTO cajas (usuario_id, monto_apertura, observaciones, estado) VALUES (?, ?, ?, "abierta")',
            [usuarioId, monto_apertura, observaciones]
        );

        res.status(201).json({ id: result.insertId, message: 'Caja abierta exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al abrir caja' });
    }
};

// Cerrar caja (Arqueo de caja)
const cerrarCaja = async (req, res) => {
    const usuarioId = req.user.id;
    const { monto_cierre, observaciones } = req.body;

    if (monto_cierre === undefined) {
        return res.status(400).json({ error: 'El monto de cierre real es obligatorio' });
    }

    try {
        // Encontrar la caja abierta
        const [cajaRows] = await pool.query(
            'SELECT id, monto_apertura FROM cajas WHERE usuario_id = ? AND estado = "abierta" ORDER BY id DESC LIMIT 1',
            [usuarioId]
        );

        if (cajaRows.length === 0) {
            return res.status(404).json({ error: 'No se encontró una caja abierta para este usuario' });
        }

        const cajaId = cajaRows[0].id;
        const montoApertura = parseFloat(cajaRows[0].monto_apertura);

        // Calcular ventas realizadas en este turno
        const [salesRows] = await pool.query(
            'SELECT metodo_pago, SUM(total) as total_metodo FROM facturas WHERE caja_id = ? AND estado = "pagada" GROUP BY metodo_pago',
            [cajaId]
        );

        let totalEfectivo = 0;
        let totalTarjeta = 0;

        salesRows.forEach(row => {
            const sumValue = parseFloat(row.total_metodo || 0);
            if (row.metodo_pago === 'efectivo') totalEfectivo = sumValue;
            if (row.metodo_pago === 'tarjeta' || row.metodo_pago === 'transferencia') totalTarjeta += sumValue;
        });

        const efectivoEsperado = montoApertura + totalEfectivo;
        const diferencia = monto_cierre - efectivoEsperado;

        await pool.query(
            `UPDATE cajas SET 
            fecha_cierre = CURRENT_TIMESTAMP, 
            monto_cierre = ?, 
            total_ventas_efectivo = ?, 
            total_ventas_tarjeta = ?, 
            diferencia = ?, 
            observaciones = CONCAT(COALESCE(observaciones, ''), ' | CIERRE: ', COALESCE(?, '')), 
            estado = 'cerrada' 
            WHERE id = ?`,
            [monto_cierre, totalEfectivo, totalTarjeta, diferencia, observaciones || '', cajaId]
        );

        res.json({
            message: 'Caja cerrada exitosamente',
            resumen: {
                apertura: montoApertura,
                ventas_efectivo: totalEfectivo,
                ventas_tarjeta: totalTarjeta,
                efectivo_esperado: efectivoEsperado,
                efectivo_real: monto_cierre,
                diferencia: diferencia
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al cerrar caja' });
    }
};

module.exports = { getEstadoCaja, abrirCaja, cerrarCaja };
