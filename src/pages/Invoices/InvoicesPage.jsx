import React, { useState, useEffect } from 'react';
import { Search, Printer, Receipt, XCircle } from 'lucide-react';
import useInvoices from '../../hooks/useInvoices';
import ReceiptModal from './ReceiptModal';
import api from '../../api/api';

const InvoicesPage = () => {
  const { invoices, loading, error, fetchInvoices, fetchInvoiceDetalle, voidInvoice } = useInvoices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchInvoices();
    // Obtener la configuración general para que el recibo sepa qué encabezado imprimir
    api.get('/settings').then(res => setSettings(res.data)).catch(console.error);
  }, [fetchInvoices]);

  const handleViewReceipt = async (id) => {
    setIsModalOpen(true);
    setLoadingDetalle(true);
    const result = await fetchInvoiceDetalle(id);
    if (result.success) {
      setSelectedInvoice(result.data);
    } else {
      alert(result.message);
      setIsModalOpen(false);
    }
    setLoadingDetalle(false);
  };

  const handleVoidInvoice = async (id, numero) => {
    if (window.confirm(`¿Está seguro que desea ANULAR la factura ${numero}? Esta acción reintegrará los productos al inventario y no se puede deshacer.`)) {
      const result = await voidInvoice(id);
      if (result.success) {
        alert('Factura anulada correctamente');
      } else {
        alert(result.message);
      }
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (inv.cliente_nombre && inv.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Historial de Facturas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Consulte y reimprima facturas emitidas</p>
        </div>
      </div>

      {/* Filters & Errors */}
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por Número de Factura o Nombre de Cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading && invoices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando historial...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Factura Nº</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Cliente</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Cajero</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Método</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron facturas.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: inv.estado === 'anulada' ? 'rgba(239, 68, 68, 0.05)' : 'transparent', opacity: inv.estado === 'anulada' ? 0.7 : 1 }}>
                      <td style={{ padding: '1rem', fontWeight: '600', color: inv.estado === 'anulada' ? 'var(--text-muted)' : 'var(--primary)', textDecoration: inv.estado === 'anulada' ? 'line-through' : 'none' }}>
                        {inv.numero_factura}
                        {inv.estado === 'anulada' && <span style={{ marginLeft: '0.5rem', color: 'var(--danger)', fontSize: '0.65rem', border: '1px solid var(--danger)', padding: '1px 4px', borderRadius: '4px' }}>ANULADA</span>}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(inv.fecha).toLocaleString()}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        <div>{inv.cliente_nombre || 'Consumidor Final'}</div>
                        {inv.rnc_cedula && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.rnc_cedula}</div>}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{inv.cajero_nombre}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        <span style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '1rem',
                          textTransform: 'capitalize'
                        }}>
                          {inv.metodo_pago}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', textAlign: 'right', color: 'var(--text-main)' }}>
                        ${parseFloat(inv.total).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleViewReceipt(inv.id)}
                            style={{ padding: '0.4rem 1rem', backgroundColor: 'var(--primary)', color: 'var(--bg-main)', border: 'none', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                            title="Ver e Imprimir"
                          >
                            <Printer size={16} /> Imprimir
                          </button>
                          
                          {inv.estado !== 'anulada' && (
                            <button 
                              onClick={() => handleVoidInvoice(inv.id, inv.numero_factura)}
                              style={{ padding: '0.4rem 0.8rem', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                              title="Anular Factura"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReceiptModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        settings={settings}
        loadingDetalle={loadingDetalle}
      />
    </div>
  );
};

export default InvoicesPage;
