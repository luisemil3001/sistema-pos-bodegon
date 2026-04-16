import React, { useState, useEffect } from 'react';
import { Bell, Search, Calendar, Clock } from 'lucide-react';
import ContingenciaIndicator from '../ContingenciaIndicator';
import ThemeSelector from '../ThemeSelector';
import useTheme from '../../hooks/useTheme';
import api from '../../api/api';
import { formatCurrency } from '../../utils/format';


const Header = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [settings, setSettings] = useState(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [newRate, setNewRate] = useState('');
  const { currentTheme, changeTheme } = useTheme();

  useEffect(() => {
    fetchSettings();
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
      setNewRate(res.data.tasa_dolar);
    } catch (err) {
      console.error('Error fetching settings in header', err);
    }
  };

  const handleUpdateRate = async () => {
    try {
      if (!newRate || isNaN(newRate)) return alert('Ingrese una tasa válida');
      await api.put('/settings', { 
        ...settings, 
        tasa_dolar: parseFloat(newRate) 
      });
      setIsRateModalOpen(false);
      fetchSettings();
      // Recargar la página o emitir evento para que otros componentes se enteren
      window.location.reload(); 
    } catch (err) {
      alert('Error al actualizar la tasa');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar productos..."
            style={{ width: '250px', paddingLeft: '2.5rem', height: '38px', fontSize: '0.9rem' }}
          />
        </div>
        
        {settings && (
            <button 
                onClick={() => setIsRateModalOpen(true)}
                style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                color: 'var(--success)', 
                padding: '0.5rem 1rem',
                border: '1px solid var(--success)',
                fontWeight: 'bold',
                fontSize: '0.95rem'
                }}
            >
                💵 Tasa: Bs. {formatCurrency(settings.tasa_dolar)}
            </button>
        )}

        <ContingenciaIndicator />
      </div>

      {isRateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '300px', border: '1px solid var(--primary)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Actualizar Tasa del Día</h3>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tasa actual en Bolívares (Bs.)</label>
            <input 
              type="number" 
              step="0.01"
              value={newRate}
              onChange={e => setNewRate(e.target.value)}
              style={{ width: '100%', fontSize: '1.5rem', textAlign: 'center', margin: '0.5rem 0 1.5rem 0' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setIsRateModalOpen(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>Cancelar</button>
              <button onClick={handleUpdateRate} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}


      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} />
            <span style={{ textTransform: 'capitalize' }}>{formatDate(dateTime)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '600' }}>
            <Clock size={16} />
            <span>{formatTime(dateTime)}</span>
          </div>
        </div>

        <ThemeSelector currentTheme={currentTheme} onThemeChange={changeTheme} />

        <button style={{ 
          position: 'relative', 
          backgroundColor: 'var(--bg-input)', 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--text-main)'
        }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--danger)',
            borderRadius: '50%',
            border: '2px solid var(--bg-sidebar)'
          }}></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
