import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomer = async (customerData) => {
    try {
      await api.post('/customers', customerData);
      await fetchCustomers();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al crear cliente' };
    }
  };

  const updateCustomer = async (id, customerData) => {
    try {
      await api.put(`/customers/${id}`, customerData);
      await fetchCustomers();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al actualizar cliente' };
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      await fetchCustomers();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al eliminar cliente' };
    }
  };

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  };
};

export default useCustomers;
