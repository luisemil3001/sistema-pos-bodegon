import { useState, useCallback } from 'react';
import api from '../api/api';

const useAccounting = () => {
  const [data, setData] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLibroVentas = async (fechaInicio, fechaFin) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/contabilidad/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      setData(res.data);
      return res.data;
    } catch (err) {
      setError('Error al cargar libro de ventas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchLibroCompras = async (fechaInicio, fechaFin) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/contabilidad/compras?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      setData(res.data);
      return res.data;
    } catch (err) {
      setError('Error al cargar libro de compras');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchResumenIva = async (fechaInicio, fechaFin) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/contabilidad/iva-resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      setResumen(res.data);
      return res.data;
    } catch (err) {
      setError('Error al cargar resumen de IVA');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setData([]);
    setResumen(null);
    setError(null);
  };

  return {
    data,
    resumen,
    loading,
    error,
    fetchLibroVentas,
    fetchLibroCompras,
    fetchResumenIva,
    clearData
  };
};

export default useAccounting;
