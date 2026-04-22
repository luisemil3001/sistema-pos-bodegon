import React, { useState, useEffect } from 'react';
import { Users, Download, Calendar, Search, FileText } from 'lucide-react';
import useReports from '../../hooks/useReports';
import { exportCSV, exportXLSX, exportPDF } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/format';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import { ReportButton, ReportCard, ReportFilters, ReportPageShell, ReportTable } from '../../components/ReportLayout';

const CustomerPurchasesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clienteId, setClienteId] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  const { fetchCustomerPurchases } = useReports();

  const loadData = async () => {
    if (!clienteId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchCustomerPurchases(clienteId, filters);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const exportToCSV = () => {
    if (!data || !data.compras) return;

    const headers = ['Factura', 'Fecha', 'Total USD', 'Total Bs', 'Tasa', 'Método Pago'];
    const rows = data.compras.map(item => [
      item.numero_factura,
      new Date(item.fecha).toLocaleDateString('es-ES'),
      formatCurrency(item.total),
      formatCurrency(item.total_bs),
      formatCurrency(item.tasa_cambio_usada),
      item.metodo_pago
    ]);

    exportCSV(`compras_cliente_${data.cliente.nombre}.csv`, headers, rows, {
      totals: {
        label: 'Total',
        labelIndex: 0,
        values: [
          { index: 2, value: data.compras.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0) },
          { index: 3, value: data.compras.reduce((sum, item) => sum + (parseFloat(item.total_bs) || 0), 0) }
        ]
      }
    });
  };

  const exportToXLSX = async () => {
    if (!data || !data.compras) return;

    const headers = ['Factura', 'Fecha', 'Total USD', 'Total Bs', 'Tasa', 'Método Pago'];
    const rows = data.compras.map(item => [
      item.numero_factura,
      new Date(item.fecha).toLocaleDateString('es-ES'),
      formatCurrency(item.total),
      formatCurrency(item.total_bs),
      formatCurrency(item.tasa_cambio_usada),
      item.metodo_pago
    ]);

    await exportXLSX(`compras_cliente_${data.cliente.nombre}.xlsx`, 'Compras Cliente', headers, rows, {
      totals: {
        label: 'Total',
        labelIndex: 0,
        values: [
          { index: 2, value: data.compras.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0) },
          { index: 3, value: data.compras.reduce((sum, item) => sum + (parseFloat(item.total_bs) || 0), 0) }
        ]
      }
    });
  };

  const exportToPDF = () => {
    if (!data || !data.compras) return;

    const headers = ['Factura', 'Fecha', 'Total USD', 'Total Bs', 'Tasa', 'Método Pago'];
    const rows = data.compras.map(item => [
      item.numero_factura,
      new Date(item.fecha).toLocaleDateString('es-ES'),
      formatCurrency(item.total),
      formatCurrency(item.total_bs),
      formatCurrency(item.tasa_cambio_usada),
      item.metodo_pago
    ]);

    exportPDF(`compras_cliente_${data.cliente.nombre}.pdf`, `Compras de ${data.cliente.nombre}`, headers, rows, {
      totals: {
        label: 'Total',
        labelIndex: 0,
        values: [
          { index: 2, value: data.compras.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0) },
          { index: 3, value: data.compras.reduce((sum, item) => sum + (parseFloat(item.total_bs) || 0), 0) }
        ]
      }
    });
  };

  return (
    <ReportPageShell
      title="Compras por Cliente"
      subtitle="Consulta detallada de todas las compras realizadas por un cliente específico"
      icon={Users}
      actions={data ? [
        <ReportButton key="csv" onClick={exportToCSV} style={{ backgroundColor: 'var(--success)' }}>
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
      ] : null}
    >
      <ReportCard>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>
              Cliente (ID, RNC o nombre) *
            </label>
            <input
              type="text"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              placeholder="Ingrese ID, RNC o nombre"
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>
              Fecha Inicio
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>
              Fecha Fin
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Search size={16} />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </ReportCard>
      {data && (
        <>
          {/* Resumen del cliente */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
                {data.cliente.nombre}
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={exportToCSV}
                  style={{
                    backgroundColor: 'var(--success)',
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
                  CSV
                </button>
                <button
                  onClick={exportToXLSX}
                  style={{
                    backgroundColor: 'var(--success)',
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
                  Excel
                </button>
                <button
                  onClick={exportToPDF}
                  style={{
                    backgroundColor: 'var(--warning)',
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
                  PDF
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{data.total_compras}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total de Compras</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  ${formatCurrency(data.compras.reduce((sum, item) => sum + parseFloat(item.total), 0))}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total USD</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                  Bs. {formatCurrency(data.compras.reduce((sum, item) => sum + parseFloat(item.total_bs), 0))}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Bs</div>
              </div>
            </div>
          </div>

          {/* Tabla de compras */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Historial de Compras</h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Factura</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Fecha</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Total USD</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Total Bs</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Tasa</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compras.map((compra, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{compra.numero_factura}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                        {new Date(compra.fecha).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>
                        ${formatCurrency(compra.total)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>
                        Bs. {formatCurrency(compra.total_bs)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {formatCurrency(compra.tasa_cambio_usada)}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                        {compra.metodo_pago}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.compras.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No se encontraron compras para este cliente en el período seleccionado.
              </div>
            )}
          </div>
        </>
      )}

      {loading && <LoadingSpinner />}
    </ReportPageShell>
  );
};

export default CustomerPurchasesPage;