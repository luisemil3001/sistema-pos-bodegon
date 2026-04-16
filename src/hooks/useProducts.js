import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import useErrorHandler from './useErrorHandler';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const { error, isLoading, handleError, clearError, wrapAsync } = useErrorHandler();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await wrapAsync(() => api.get('/products'));
      setProducts(res.data);
    } catch (err) {
      // Error ya manejado por wrapAsync
    }
  }, [wrapAsync]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      handleError(err, 'Error al cargar categorías');
    }
  }, [handleError]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      handleError(err, 'Error al cargar proveedores');
    }
  }, [handleError]);

  const addProduct = async (productData) => {
    try {
      await wrapAsync(() => api.post('/products', productData));
      await fetchProducts();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al crear producto' };
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      await wrapAsync(() => api.put(`/products/${id}`, productData));
      await fetchProducts();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al actualizar producto' };
    }
  };

  const deleteProduct = async (id) => {
    try {
      await wrapAsync(() => api.delete(`/products/${id}`));
      await fetchProducts();
      return { success: true };
    } catch (err) {
      return { success: false, message: error || 'Error al eliminar producto' };
    }
  };

  return {
    products,
    categories,
    suppliers,
    loading: isLoading,
    error,
    fetchProducts,
    fetchCategories,
    fetchSuppliers,
    addProduct,
    updateProduct,
    deleteProduct,
    clearError
  };
};

export default useProducts;
