import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Download, FileText, FileDown, PieChart } from 'lucide-react';
import useAccounting from '../../hooks/useAccounting';
import * as XLSX from 'xlsx';

const AccountingPage = () => {
  const { data, resumen, loading, error, fetchLibroVentas, fetchLibroCompras, fetchResumenIva, clearData } = useAccounting();
  
  const [activeTab, setActiveTab] = useState('ventas'); // ventas | compras | iva
  
  // Rango de fechas por defecto: primer día del mes actual hasta el día actual
  const getFirstDayOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };
  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [fechaInicio, setFechaInicio] = useState(getFirstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(getToday());

  useEffect(() => {
    handleSearch();
  }, [activeTab, fechaInicio, fechaFin]);

  const handleSearch = () => {
    if (activeTab === 'ventas') fetchLibroVentas(fechaInicio, fechaFin);
    else if (activeTab === 'compras') fetchLibroCompras(fechaInicio, fechaFin);
    else if (activeTab === 'iva') fetchResumenIva(fechaInicio, fechaFin);
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) return alert('No hay datos para exportar');
    
    // Preparar datos según el tipo de libro
    let exportData = [];
    if (activeTab === 'ventas') {
      exportData = data.map(v => ({
        'Fecha': new Date(v.fecha).toLocaleDateString(),
        'Nro Factura': v.numero_factura,
        'Razón Social / Cliente': v.cliente_nombre || 'Consumidor Final',
        'RNC / Cédula': v.rnc_cedula || '',
        'Base Imponible': parseFloat(v.base_imponible).toFixed(2),
        'IVA': parseFloat(v.iva_retenido).toFixed(2),
        'Total': parseFloat(v.total).toFixed(2),
        'Estado': v.estado
      }));
    } else if (activeTab === 'compras') {
      exportData = data.map(c => ({
        'Fecha': new Date(c.fecha).toLocaleDateString(),
        'Nro Factura Proveedor': c.numero_factura_proveedor,
        'Proveedor': c.proveedor_nombre || 'Desconocido',
        'RNC Proveedor': c.rnc_cedula || '',
        'Base Imponible': parseFloat(c.base_imponible).toFixed(2),
        'IVA Soportado': parseFloat(c.iva_soportado).toFixed(2),
        'Total': parseFloat(c.total).toFixed(2)
      }));
    }
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Libro_${activeTab}`);
    XLSX.writeFile(wb, `Libro_${activeTab}_${fechaInicio}_al_${fechaFin}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Header Container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Libros Contables e Impuestos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Genere reportes fiscales para su contador o autoridad tributaria</p>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem', borderRight: '1px solid var(--border)' }}>
            <Calendar size={18} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Desde:</span>
            <input 
              type="date" 
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              max={fechaFin}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '0.2rem', outline: 'none', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hasta:</span>
            <input 
              type="date" 
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '0.2rem', outline: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('ventas')}
          style={{ padding: '0.75rem 1.5rem', borderBottom: activeTab === 'ventas' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'ventas' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'ventas' ? '600' : '400', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={18}/> Libro de Ventas
        </button>
        <button 
          onClick={() => setActiveTab('compras')}
          style={{ padding: '0.75rem 1.5rem', borderBottom: activeTab === 'compras' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'compras' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'compras' ? '600' : '400', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileDown size={18}/> Libro de Compras
        </button>
        <button 
          onClick={() => setActiveTab('iva')}
          style={{ padding: '0.75rem 1.5rem', borderBottom: activeTab === 'iva' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'iva' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'iva' ? '600' : '400', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PieChart size={18}/> Resumen IVA
        </button>
      </div>

      {error && <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)' }}>{error}</div>}

      {/* Content Area */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Actions bar for tabular data */}
        {(activeTab === 'ventas' || activeTab === 'compras') && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
            <button 
              onClick={exportToExcel}
              disabled={loading || data.length === 0}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (loading || data.length === 0) ? 0.5 : 1 }}
            >
              <Download size={18} />
              Exportar a Excel
            </button>
          </div>
        )}

        {/* Tab Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos contables...</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            
            {activeTab === 'ventas' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Factura Nº</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>RNC / Cédula</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Base Imp.</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>IVA</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No hay ventas registradas en este período</td></tr>
                  ) : (
                    data.map((v, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>{new Date(v.fecha).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem' }}>{v.numero_factura}</td>
                        <td style={{ padding: '1rem' }}>{v.cliente_nombre || 'Consumidor Final'}</td>
                        <td style={{ padding: '1rem' }}>{v.rnc_cedula || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>${parseFloat(v.base_imponible).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary)' }}>${parseFloat(v.iva_retenido).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(v.total).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'compras' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Factura Prov.</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Proveedor</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>RNC</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Base Imp.</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>IVA Soportado</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No hay compras registradas en este período</td></tr>
                  ) : (
                    data.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>{new Date(c.fecha).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem' }}>{c.numero_factura_proveedor}</td>
                        <td style={{ padding: '1rem' }}>{c.proveedor_nombre}</td>
                        <td style={{ padding: '1rem' }}>{c.rnc_cedula || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>${parseFloat(c.base_imponible).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--info)' }}>${parseFloat(c.iva_soportado).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(c.total).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'iva' && resumen && (
              <div style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Posición de IVA Mensual</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '800px' }}>
                  
                  <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>IVA Retenido (Ventas)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>${parseFloat(resumen.debito_fiscal).toFixed(2)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Base Ventas: ${parseFloat(resumen.total_ventas_base).toFixed(2)}</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>IVA Soportado (Compras)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info)' }}>${parseFloat(resumen.credito_fiscal).toFixed(2)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Base Compras: ${parseFloat(resumen.total_compras_base).toFixed(2)}</div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>Cuota Tributaria Neta</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {resumen.cuota_tributaria > 0 
                          ? 'Monto a pagar a la autoridad tributaria por las operaciones del mes.' 
                          : 'Crédito fiscal a favor para el mes siguiente.'}
                      </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: resumen.cuota_tributaria > 0 ? 'var(--danger)' : '#10b981' }}>
                      ${Math.abs(resumen.cuota_tributaria).toFixed(2)}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingPage;
