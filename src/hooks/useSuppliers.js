import { useState, useCallback } from 'react';
import api from '../api/api';
import useErrorHandler from './useErrorHandler';

const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const { error, isLoading, handleError, clearError, wrapAsync } = useErrorHandler();

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await wrapAsync(() => api.get('/proveedores'));
      setSuppliers(res.data);
    } catch (err) {
      // Error ya manejado por wrapAsync
    }
  }, [wrapAsync]);

  const createSupplier = async (supplierData) => {
    try {
      await wrapAsync(() => api.post('/proveedores', supplierData));
      await fetchSuppliers();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al crear proveedor' };
    }
  };

  const updateSupplier = async (id, supplierData) => {
    try {
      await wrapAsync(() => api.put(`/proveedores/${id}`, supplierData));
      await fetchSuppliers();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al actualizar proveedor' };
    }
  };

  const deleteSupplier = async (id) => {
    try {
      await wrapAsync(() => api.delete(`/proveedores/${id}`));
      await fetchSuppliers();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al eliminar proveedor' };
    }
  };

  return {
    suppliers,
    loading: isLoading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    clearError
  };
};

export default useSuppliers;
