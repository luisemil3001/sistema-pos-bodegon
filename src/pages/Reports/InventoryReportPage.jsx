import React, { useState, useEffect } from 'react';
import { Package, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import useReports from '../../hooks/useReports';
import { formatCurrency } from '../../utils/format';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const InventoryReportPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, low, normal

  const { fetchInventoryReport } = useReports();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInventoryReport();
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

  const filteredData = data.filter(item => {
    if (filter === 'low') return item.estado_stock === 'Bajo';
    if (filter === 'normal') return item.estado_stock === 'Normal';
    return true;
  });

  const exportToCSV = () => {
    const csv = [
      ['Producto', 'Código', 'Categoría', 'Stock', 'Mínimo', 'Precio Venta', 'Valor Inventario', 'Estado'],
      ...filteredData.map(item => [
        item.nombre,
        item.codigo,
        item.categoria_nombre || 'Sin categoría',
        item.stock,
        item.min_stock,
        item.precio_venta,
        item.valor_inventario_usd,
        item.estado_stock
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-inventario-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const lowStockCount = data.filter(item => item.estado_stock === 'Bajo').length;
  const totalValue = data.reduce((sum, item) => sum + (item.valor_inventario_usd || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            <Package size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Reporte de Inventario
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Estado completo del inventario y productos con stock bajo
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

      {/* Estadísticas rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {data.length}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Productos</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {lowStockCount}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Stock Bajo</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            ${formatCurrency(totalValue)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Valor Total</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1.5rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Filtrar por estado:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-main)'
          }}
        >
          <option value="all">Todos los productos</option>
          <option value="low">Solo stock bajo</option>
          <option value="normal">Solo stock normal</option>
        </select>
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
            Productos ({filteredData.length})
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                No hay productos que coincidan con el filtro
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
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-main)' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-main)' }}>Código</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-main)' }}>Categoría</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-main)' }}>Stock</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-main)' }}>Mínimo</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>Precio</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>Valor</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-main)' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: index % 2 === 0 ? 'var(--bg-main)' : 'var(--bg-secondary)'
                    }}>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{item.nombre}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.codigo}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {item.categoria_nombre || 'Sin categoría'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-main)', fontWeight: 'bold' }}>
                        {item.stock}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {item.min_stock}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>
                        ${formatCurrency(item.precio_venta)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>
                        ${formatCurrency(item.valor_inventario_usd)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {item.estado_stock === 'Bajo' ? (
                          <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
                        ) : (
                          <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                        )}
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

export default InventoryReportPage;