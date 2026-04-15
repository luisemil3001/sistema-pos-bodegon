import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

/**
 * Hook para monitorear el estado de la conexión a la base de datos central (LAN/Web)
 * y gestionar la sincronización de ventas offline.
 */
const useContingencia = () => {
  const [status, setStatus] = useState({
    connected: true,
    pendingSync: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const checkConnection = useCallback(async () => {
    try {
      const res = await api.get('/contingencia/status');
      setStatus({
        connected: res.data.connected,
        pendingSync: res.data.pending_sync || 0
      });
      setLastCheck(new Date());
    } catch (err) {
      // Si la API misma no responde, estamos en modo contingencia total
      setStatus(prev => ({ ...prev, connected: false }));
    }
  }, []);

  const syncSales = async () => {
    setLoading(true);
    try {
      const res = await api.post('/contingencia/sync');
      await checkConnection();
      return { success: true, message: res.data.message };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.error || 'Error al intentar sincronizar. Verifique la conexión.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Polling cada 30 segundos
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    ...status,
    loading,
    lastCheck,
    checkConnection,
    syncSales
  };
};

export default useContingencia;
