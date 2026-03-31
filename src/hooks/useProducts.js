import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  }, []);

  const addProduct = async (productData) => {
    try {
      await api.post('/products', productData);
      await fetchProducts();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al crear producto' };
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      await api.put(`/products/${id}`, productData);
      await fetchProducts();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al actualizar producto' };
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      await fetchProducts();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al eliminar producto' };
    }
  };

  return {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    addProduct,
    updateProduct,
    deleteProduct
  };
};

export default useProducts;
