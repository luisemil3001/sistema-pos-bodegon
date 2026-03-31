import { useState, useCallback } from 'react';
import api from '../api/api';

const usePurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/compras');
      setPurchases(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar historial de compras');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPurchaseDetail = async (id) => {
    try {
      const res = await api.get(`/compras/${id}`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al cargar detalle' };
    }
  }

  const createPurchase = async (purchaseData) => {
    try {
      const res = await api.post('/compras', purchaseData);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al registrar la compra' };
    }
  };

  return {
    purchases,
    loading,
    error,
    fetchPurchases,
    fetchPurchaseDetail,
    createPurchase
  };
};

export default usePurchases;
