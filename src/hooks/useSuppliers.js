import { useState, useCallback } from 'react';
import api from '../api/api';

const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/proveedores');
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = async (supplierData) => {
    try {
      const res = await api.post('/proveedores', supplierData);
      await fetchSuppliers();
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al crear proveedor' };
    }
  };

  const updateSupplier = async (id, supplierData) => {
    try {
      const res = await api.put(`/proveedores/${id}`, supplierData);
      await fetchSuppliers();
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al actualizar proveedor' };
    }
  };

  const deleteSupplier = async (id) => {
    try {
      const res = await api.delete(`/proveedores/${id}`);
      await fetchSuppliers();
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al eliminar proveedor' };
    }
  };

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
};

export default useSuppliers;
