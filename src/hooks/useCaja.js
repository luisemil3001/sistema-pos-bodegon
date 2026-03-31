import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';

const useCaja = () => {
    const [cajaAbierta, setCajaAbierta] = useState(null); // null if closed, object if open
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const checkCajaEstado = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/caja/estado');
            setCajaAbierta(res.data);
        } catch (err) {
            setError('Error al verificar estado de caja');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkCajaEstado();
    }, [checkCajaEstado]);

    const abrirCaja = async (monto, observaciones) => {
        try {
            await api.post('/caja/abrir', { monto_apertura: monto, observaciones });
            checkCajaEstado();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al abrir caja' };
        }
    };

    const cerrarCaja = async (montoCierre, observaciones) => {
        try {
            const res = await api.post('/caja/cerrar', { monto_cierre: montoCierre, observaciones });
            setCajaAbierta(null);
            return { success: true, resumen: res.data.resumen };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al cerrar caja' };
        }
    };

    return { cajaAbierta, loading, error, checkCajaEstado, abrirCaja, cerrarCaja };
};

export default useCaja;
