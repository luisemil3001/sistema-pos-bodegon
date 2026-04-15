import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import useContingencia from '../hooks/useContingencia';

const ContingenciaIndicator = () => {
  const { connected, pendingSync, loading, syncSales, checkConnection } = useContingencia();

  const handleSync = async () => {
    if (loading) return;
    const res = await syncSales();
    if (res.success) {
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  if (connected && pendingSync === 0) {
    return (
      <div 
        onClick={checkConnection}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.85rem', cursor: 'pointer' }}
        title="Conectado al Servidor Central"
      >
        <Wifi size={16} />
        <span>Servidor Online</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {!connected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem' }}>
          <WifiOff size={16} />
          <span style={{ fontWeight: 'bold' }}>MODO CONTINGENCIA</span>
        </div>
      )}

      {pendingSync > 0 && (
        <button
          onClick={handleSync}
          disabled={loading || !connected}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            backgroundColor: connected ? '#f59e0b' : '#334155',
            color: 'white',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            border: 'none',
            cursor: connected ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {loading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <AlertTriangle size={14} />
          )}
          {pendingSync} Ventas Pendientes {connected ? '(Sincronizar)' : '(Sin Red)'}
        </button>
      )}
    </div>
  );
};

export default ContingenciaIndicator;
