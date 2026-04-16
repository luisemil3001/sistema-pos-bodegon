import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';
import useErrorHandler from './useErrorHandler';

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const { error, isLoading, handleError, clearError, wrapAsync } = useErrorHandler();

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await wrapAsync(() => api.get('/customers'));
      setCustomers(res.data);
    } catch (err) {
      // Error ya manejado por wrapAsync
    }
  }, [wrapAsync]);

  const addCustomer = async (customerData) => {
    try {
      await wrapAsync(() => api.post('/customers', customerData));
      await fetchCustomers();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al crear cliente' };
    }
  };

  const updateCustomer = async (id, customerData) => {
    try {
      await wrapAsync(() => api.put(`/customers/${id}`, customerData));
      await fetchCustomers();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al actualizar cliente' };
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await wrapAsync(() => api.delete(`/customers/${id}`));
      await fetchCustomers();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al eliminar cliente' };
    }
  };

  return {
    customers,
    loading: isLoading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    clearError
  };
};

export default useCustomers;
