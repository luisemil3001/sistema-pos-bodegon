import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';

const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (formData) => {
    try {
      const res = await api.put('/settings', formData);
      setSettings(prev => ({ ...prev, ...formData }));
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Error al guardar la configuración' };
    }
  };

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings
  };
};

export default useSettings;
