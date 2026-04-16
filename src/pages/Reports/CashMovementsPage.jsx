import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Calendar, Clock } from 'lucide-react';
import useReports from '../../hooks/useReports';
import { formatCurrency } from '../../utils/format';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const CashMovementsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { fetchCashMovements } = useReports();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCashMovements(filters);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const exportToCSV = () => {
    const csv = [
      ['Usuario', 'Estación', 'Fecha Apertura', 'Fecha Cierre', 'Monto Inicial', 'Monto Final', 'Estado', 'Duración (min)'],
      ...data.map(item => [
        item.usuario_nombre,
        item.estacion_nombre,
        item.fecha_apertura,
        item.fecha_cierre || 'Abierta',
        item.monto_inicial,
        item.monto_final || 'N/A',
        item.estado,
        item.duracion_minutos || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos-caja-${filters.startDate}-a-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            <DollarSign size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Movimientos de Caja
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Historial de aperturas y cierres de caja
          </p>
        </div>
        <button
          onClick={exportToCSV}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1.5rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Desde:</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Hasta:</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)'
            }}
          />
        </div>
        <button
          onClick={loadData}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            cursor: 'pointer'
          }}
        >
          Filtrar
        </button>
      </div>

      {error && <AlertMessage type="error" message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
            fontWeight: 'bold',
            color: 'var(--text-main)'
          }}>
            Movimientos ({data.length})
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {data.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                No hay movimientos para el período seleccionado
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-main)' }}>Usuario</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-main)' }}>Estación</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-main)' }}>Apertura</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-main)' }}>Cierre</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>Inicial</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>Final</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-main)' }}>Estado</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-main)' }}>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: index % 2 === 0 ? 'var(--bg-main)' : 'var(--bg-secondary)'
                    }}>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{item.usuario_nombre}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.estacion_nombre}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {formatDateTime(item.fecha_apertura)}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {formatDateTime(item.fecha_cierre)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>
                        Bs. {formatCurrency(item.monto_inicial)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>
                        {item.monto_final ? `Bs. ${formatCurrency(item.monto_final)}` : 'N/A'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: item.estado === 'abierta' ? 'var(--success)' : 'var(--bg-secondary)',
                          color: item.estado === 'abierta' ? 'white' : 'var(--text-main)'
                        }}>
                          {item.estado}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {item.duracion_minutos ? `${item.duracion_minutos} min` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashMovementsPage;