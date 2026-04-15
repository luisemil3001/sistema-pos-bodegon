import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { Search, Loader2, Eye, Printer, FileDigit } from 'lucide-react';
import CotizacionModal from './CotizacionModal';
import useSettings from '../../hooks/useSettings';


const CotizacionesPage = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const { settings, fetchSettings } = useSettings();

  useEffect(() => {
    fetchCotizaciones();
    fetchSettings();
  }, [fetchSettings]);


  const fetchCotizaciones = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cotizaciones');
      setCotizaciones(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    setIsModalOpen(true);
    setLoadingDetalle(true);
    try {
      const res = await api.get(`/cotizaciones/${id}`);
      setSelectedCotizacion(res.data);
    } catch (err) {
      console.error(err);
      alert('Error obteniendo detalle');
      setIsModalOpen(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const filteredCotizaciones = cotizaciones.filter(c => 
    c.numero_cotizacion.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.cliente_nombre && c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileDigit /> Presupuestos / Cotizaciones
        </h1>
      </div>

      <div style={{ backgroundColor: 'var(--bg-sidebar)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por Nro o Cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Número</th>
                <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                <th style={{ padding: '0.75rem 1rem' }}>Cliente</th>
                <th style={{ padding: '0.75rem 1rem' }}>Validez</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /> Cargando...</td></tr>
              ) : filteredCotizaciones.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay cotizaciones registradas.</td></tr>
              ) : (
                filteredCotizaciones.map(cotiza => (
                  <tr key={cotiza.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{cotiza.numero_cotizacion}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{new Date(cotiza.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{cotiza.cliente_nombre || 'Consumidor Final'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{cotiza.validez_dias} días</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(cotiza.total).toFixed(2)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        backgroundColor: cotiza.estado === 'pendiente' ? 'rgba(251, 191, 36, 0.1)' : cotiza.estado === 'facturada' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: cotiza.estado === 'pendiente' ? '#f59e0b' : cotiza.estado === 'facturada' ? '#10b981' : '#ef4444'
                      }}>
                        {cotiza.estado.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleViewDetails(cotiza.id)}
                        style={{ padding: '0.4rem', backgroundColor: 'transparent', color: 'var(--primary)' }}
                        title="Ver Detalles"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CotizacionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cotizacion={selectedCotizacion}
        loadingDetalle={loadingDetalle}
        settings={settings}
        onFacturar={() => {
            // Logica futura para facturar: cargar en POS
        }}
      />

    </div>
  );
};

export default CotizacionesPage;
