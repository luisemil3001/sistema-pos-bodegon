import { useState, useCallback } from 'react';
import api from '../api/api';
import useErrorHandler from './useErrorHandler';

const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const { error, isLoading, handleError, clearError, wrapAsync } = useErrorHandler();

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await wrapAsync(() => api.get('/invoices'));
      setInvoices(res.data);
    } catch (err) {
      // Error ya manejado por wrapAsync
    }
  }, [wrapAsync]);

  const fetchInvoiceDetalle = async (id) => {
    try {
      const data = await wrapAsync(() => api.get(`/invoices/${id}`));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: error || 'Error al cargar detalle' };
    }
  };

  const voidInvoice = async (id) => {
    try {
      const res = await wrapAsync(() => api.put(`/invoices/${id}/void`));
      fetchInvoices(); // Recargar lista
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: error || 'Error al anular factura' };
    }
  };

  return {
    invoices,
    loading: isLoading,
    error,
    fetchInvoices,
    fetchInvoiceDetalle,
    voidInvoice,
    clearError
  };
};

export default useInvoices;
