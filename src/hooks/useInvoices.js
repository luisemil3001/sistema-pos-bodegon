import { useState, useCallback } from 'react';
import api from '../api/api';

const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el historial de facturas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoiceDetalle = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al cargar detalle' };
    }
  };

  const voidInvoice = async (id) => {
    try {
      const res = await api.put(`/invoices/${id}/void`);
      fetchInvoices(); // Recargar lista
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al anular factura' };
    }
  };

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    fetchInvoiceDetalle,
    voidInvoice
  };
};

export default useInvoices;
