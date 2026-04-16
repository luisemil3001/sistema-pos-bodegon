import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';

const useReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
    fetchShifts: async (filters) => {
      const res = await api.get('/reports/audit/shifts', { params: filters });
      return res.data;
    },
    fetchAdjustments: async () => {
      const res = await api.get('/reports/audit/adjustments');
      return res.data;
    },
    fetchSalesByProduct: async (filters) => {
      const res = await api.get('/reports/sales-by-product', { params: filters });
      return res.data;
    },
    fetchTopCustomers: async (filters) => {
      const res = await api.get('/reports/top-customers', { params: filters });
      return res.data;
    },
    fetchInventoryReport: async () => {
      const res = await api.get('/reports/inventory');
      return res.data;
    },
    fetchCashMovements: async (filters) => {
      const res = await api.get('/reports/cash-movements', { params: filters });
      return res.data;
    }
  };
};

export default useReports;
