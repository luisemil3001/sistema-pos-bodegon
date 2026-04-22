import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Package } from 'lucide-react';
import useReports from '../../hooks/useReports';
import { exportCSV, exportXLSX, exportPDF } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/format';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import { ReportButton, ReportCard, ReportFilters, ReportPageShell, ReportTable } from '../../components/ReportLayout';

const SalesByProductPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { fetchSalesByProduct } = useReports();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSalesByProduct(filters);
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
    const headers = ['Producto', 'Código', 'Cantidad Vendida', 'Total USD', 'Total Bs'];
    const rows = data.map(item => [
      item.nombre,
      item.codigo,
      item.cantidad_vendida,
      item.total_venta_usd,
      item.total_venta_bs
    ]);

    exportCSV(`ventas-por-producto-${filters.startDate}-a-${filters.endDate}.csv`, headers, rows, {
      totals: {
        label: 'Total',
        labelIndex: 0,
        values: [
          { index: 2, value: data.reduce((sum, item) => sum + (parseFloat(item.cantidad_vendida) || 0), 0) },
          { index: 3, value: data.reduce((sum, item) => sum + (parseFloat(item.total_venta_usd) || 0), 0) },
          { index: 4, value: data.reduce((sum, item) => sum + (parseFloat(item.total_venta_bs) || 0), 0) }
        ]
      }
    });
  };

  const exportToXLSX = async () => {
    const headers = ['Producto', 'Código', 'Cantidad Vendida', 'Total USD', 'Total Bs'];
    const rows = data.map(item => [
      item.nombre,
      item.codigo,
      item.cantidad_vendida,
      item.total_venta_usd,
      item.total_venta_bs
    ]);

    await exportXLSX(`ventas-por-producto-${filters.startDate}-a-${filters.endDate}.xlsx`, 'Ventas por Producto', headers, rows, {
      totals: {
        label: 'Total',
        labelIndex: 0,
        values: [
          { index: 2, value: data.reduce((sum, item) => sum + (parseFloat(item.cantidad_vendida) || 0), 0) },
          { index: 3, value: data.reduce((sum, item) => sum + (parseFloat(item.total_venta_usd) || 0), 0) },
          { index: 4, value: data.reduce((sum, item) => sum + (parseFloat(item.total_venta_bs) || 0), 0) }
        ]
      }
    });
  };

  const exportToPDF = () => {
    const headers = ['Producto', 'Código', 'Cantidad Vendida', 'Total USD', 'Total Bs'];
    const rows = data.map(item => [
      item.nombre,
      item.codigo,
      item.cantidad_vendida,
      item.total_venta_usd,
      item.total_venta_bs
    ]);

    exportPDF(`ventas-por-producto-${filters.startDate}-a-${filters.endDate}.pdf`, 'Ventas por Producto', headers, rows, {
      totals: {
        label: 'Total',
        labelIndex: 0,
        values: [
          { index: 2, value: data.reduce((sum, item) => sum + (parseFloat(item.cantidad_vendida) || 0), 0) },
          { index: 3, value: data.reduce((sum, item) => sum + (parseFloat(item.total_venta_usd) || 0), 0) },
          { index: 4, value: data.reduce((sum, item) => sum + (parseFloat(item.total_venta_bs) || 0), 0) }
        ]
      }
    });
  };

  return (
    <ReportPageShell
      title="Ventas por Producto"
      subtitle="Análisis de productos más vendidos por período"
      icon={BarChart3}
      actions={[
        <ReportButton key="csv" onClick={exportToCSV} style={{ backgroundColor: 'var(--primary)' }}>
          <Download size={16} />
          CSV
        </ReportButton>,
        <ReportButton key="xlsx" onClick={exportToXLSX} style={{ backgroundColor: 'var(--success)' }}>
          <Download size={16} />
          Excel
        </ReportButton>,
        <ReportButton key="pdf" onClick={exportToPDF} style={{ backgroundColor: 'var(--warning)' }}>
          <Download size={16} />
          PDF
        </ReportButton>
      ]}
    >
      <ReportFilters>
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
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius)',
            cursor: 'pointer'
          }}
        >
          Filtrar
        </button>
      </ReportFilters>

      {error && <AlertMessage type="error" message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ReportCard>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
            fontWeight: 'bold',
            color: 'var(--text-main)'
          }}>
            Resultados ({data.length} productos)
          </div>
          <ReportTable>
            {data.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                No hay datos para el período seleccionado
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
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>Total USD</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>Total Bs</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: index % 2 === 0 ? 'var(--bg-main)' : 'var(--bg-secondary)'
                    }}>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{item.nombre}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.codigo}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)', fontWeight: 'bold' }}>
                        {item.cantidad_vendida}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>
                        ${formatCurrency(item.total_venta_usd)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>
                        Bs. {formatCurrency(item.total_venta_bs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportTable>
        </ReportCard>
      )}
    </ReportPageShell>
  );
};

export default SalesByProductPage;