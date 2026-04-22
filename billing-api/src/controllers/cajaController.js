const pool = require('../config/db');
const bcvService = require('../services/bcvService');

// Obtener el estado de la caja para el usuario actual
const getEstadoCaja = async (req, res) => {
    const usuarioId = req.user.id;
    try {
        const [rows] = await pool.query(
            `SELECT c.*, e.nombre as estacion_nombre, u.nombre as usuario_nombre 
             FROM cajas c 
             LEFT JOIN estaciones_trabajo e ON c.estacion_id = e.id 
             LEFT JOIN usuarios u ON c.usuario_id = u.id 
             WHERE c.usuario_id = ? AND c.estado = "abierta" 
             ORDER BY c.id DESC LIMIT 1`,
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
    const { monto_apertura, observaciones, estacion_id } = req.body;

    if (monto_apertura === undefined) {
        return res.status(400).json({ error: 'El monto de apertura es obligatorio' });
    }

    try {
        // --- INICIO SINCRONIZACION BCV ---
        let bcvObservacion = '';
        try {
            // Verificar si la sincronización automática está habilitada
            const [empresa] = await pool.query('SELECT auto_sync_bcv FROM empresas WHERE id = 1');
            const autoSync = empresa.length > 0 ? empresa[0].auto_sync_bcv : true;

            if (autoSync) {
                const bcvRate = await bcvService.getBcvRate();
                if (bcvRate) {
                    await pool.query('UPDATE empresas SET tasa_dolar = ? WHERE id = 1', [bcvRate]);
                    bcvObservacion = ` [Sincronización BCV: ${bcvRate}]`;
                    console.log(`Tasa sincronizada en apertura: ${bcvRate}`);
                }
            } else {
                console.log('Sincronización BCV saltada por configuración (Manual).');
            }
        } catch (bcvErr) {
            console.error('Error al sincronizar con BCV en apertura:', bcvErr.message);
        }
        // --- FIN SINCRONIZACION BCV ---

        // Verificar si ya tiene una caja abierta
        const [open] = await pool.query('SELECT id FROM cajas WHERE usuario_id = ? AND estado = "abierta"', [usuarioId]);
        if (open.length > 0) {
            return res.status(400).json({ error: 'Ya tiene una caja abierta para este usuario' });
        }

        const notaFinal = (observaciones || '') + bcvObservacion;

        const [result] = await pool.query(
            'INSERT INTO cajas (usuario_id, monto_apertura, observaciones, estado, estacion_id) VALUES (?, ?, ?, "abierta", ?)',
            [usuarioId, monto_apertura, notaFinal, estacion_id || null]
        );

        res.status(201).json({ 
            id: result.insertId, 
            message: 'Caja abierta exitosamente' + (bcvObservacion ? ' y tasa sincronizada con BCV' : ''),
            tasa_sincronizada: bcvObservacion ? true : false
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al abrir caja' });
    }
};

// Obtener estaciones disponibles
const getEstaciones = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estaciones_trabajo WHERE activa = TRUE');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener estaciones' });
    }
};

// Pre-visualizar arqueo de caja (Sin cerrar)
const getPreviewCierre = async (req, res) => {
    const usuarioId = req.user.id;
    const { monto_cierre } = req.query; // Recibimos el monto contado para comparar

    try {
        const [cajaRows] = await pool.query(
            'SELECT id, monto_apertura FROM cajas WHERE usuario_id = ? AND estado = "abierta" ORDER BY id DESC LIMIT 1',
            [usuarioId]
        );

        if (cajaRows.length === 0) return res.status(404).json({ error: 'No hay caja abierta' });

        const cajaId = cajaRows[0].id;
        const montoApertura = parseFloat(cajaRows[0].monto_apertura);

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
        const montoContado = parseFloat(monto_cierre || 0);
        const diferencia = montoContado - efectivoEsperado;

        res.json({
            apertura: montoApertura,
            ventas_efectivo: totalEfectivo,
            ventas_tarjeta: totalTarjeta,
            efectivo_esperado: efectivoEsperado,
            efectivo_real: montoContado,
            diferencia: diferencia
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al generar pre-arqueo' });
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
        // Encontrar la caja abierta con info de usuario y estación
        const [cajaRows] = await pool.query(
            `SELECT c.id, c.monto_apertura, u.nombre as usuario_nombre, e.nombre as estacion_nombre
             FROM cajas c
             LEFT JOIN usuarios u ON c.usuario_id = u.id
             LEFT JOIN estaciones_trabajo e ON c.estacion_id = e.id
             WHERE c.usuario_id = ? AND c.estado = "abierta" ORDER BY c.id DESC LIMIT 1`,
            [usuarioId]
        );

        if (cajaRows.length === 0) {
            return res.status(404).json({ error: 'No se encontró una caja abierta para este usuario' });
        }

        const cajaId = cajaRows[0].id;
        const montoApertura = parseFloat(cajaRows[0].monto_apertura);
        const cajeroNombre = cajaRows[0].usuario_nombre || 'Cajero';
        const estacionNombre = cajaRows[0].estacion_nombre || 'General';

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
                diferencia: diferencia,
                cajero: cajeroNombre,
                estacion: estacionNombre
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al cerrar caja' });
    }
};

module.exports = { getEstadoCaja, abrirCaja, cerrarCaja, getEstaciones, getPreviewCierre };
