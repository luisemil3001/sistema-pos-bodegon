import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, 
  Banknote, CheckCircle, User, ChevronDown, X, FileDigit, 
  Printer // <--- CORREGIDO: Importación de Printer añadida
} from 'lucide-react';
import usePOS from '../../hooks/usePOS';
import useCaja from '../../hooks/useCaja';
import useNCF from '../../hooks/useNCF';
import ReceiptModal from '../Invoices/ReceiptModal';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

const POSPage = () => {
  const { 
    products, 
    settings, 
    cart, 
    loading, 
    error, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getTotals, 
    processSale 
  } = usePOS();

  const { cajaAbierta } = useCaja();
  const { fetchSequences } = useNCF();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [selectedNCF, setSelectedNCF] = useState('02'); 

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState(null);

  useEffect(() => {
    if (selectedCustomer) {
      if (selectedCustomer.rnc_cedula && selectedCustomer.rnc_cedula.replace(/\D/g, '').length >= 9) {
        setSelectedNCF('01');
      } else {
        setSelectedNCF('02');
      }
    } else {
      setSelectedNCF('02');
    }
  }, [selectedCustomer]);

  useEffect(() => {
    api.get('/customers').then(res => setCustomers(res.data)).catch(console.error);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    const term = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      (c.rnc_cedula && c.rnc_cedula.includes(term))
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      (p.codigo_barras && p.codigo_barras.includes(term))
    );
  }, [products, searchTerm]);

  const totals = getTotals();

  // CORREGIDO: Función de procesamiento blindada con try-catch
  const handleProcess = async (metodo) => {
    try {
      setProcessing(true);
      setSuccessMessage('');
      
      const res = await processSale(metodo, selectedCustomer?.id || null, selectedNCF);
      
      if (res && res.success) {
        setSuccessMessage(`Factura generada: ${res.data.numero_factura}`);
        setLastInvoiceId(res.data.factura_id);
        
        setIsReceiptModalOpen(true);
        setLoadingDetalle(true);

        // Obtenemos los detalles de la factura para el modal
        const detailRes = await api.get(`/invoices/${res.data.factura_id}`);
        setSelectedInvoice(detailRes.data);
        
        // Limpiamos selección de cliente
        setSelectedCustomer(null);
        setCustomerSearch('');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        alert(res?.message || 'Error al procesar la venta');
      }
    } catch (err) {
      console.error("Error crítico en handleProcess:", err);
      alert('Error de conexión o de sistema al procesar la factura.');
    } finally {
      setLoadingDetalle(false);
      setProcessing(false);
    }
  };

  const handleViewReceiptFromHistory = async (id) => {
    setIsReceiptModalOpen(true);
    setLoadingDetalle(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      setSelectedInvoice(res.data);
    } catch (err) {
      alert('Error al obtener detalle de la factura.');
      setIsReceiptModalOpen(false);
    }
    setLoadingDetalle(false);
  };

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>
      {/* Columna Izquierda: Búsqueda y Catálogo */}
      <div style={{ flex: '6', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-sidebar)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar producto por nombre o escanear código de barras..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '3rem', fontSize: '1.1rem', padding: '1rem 1rem 1rem 3rem', backgroundColor: 'var(--bg-main)', border: '2px solid var(--border)' }}
            autoFocus
          />
        </div>

        {error && <div style={{ color: 'var(--danger)', padding: '1rem', border: '1px solid var(--danger)' }}>{error}</div>}
        {successMessage && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={20}/> {successMessage}</div>}

        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', paddingRight: '0.5rem' }}>
          {loading && products.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Cargando inventario...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No se encontraron productos disponibles.</div>
          ) : (
            filteredProducts.map(p => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  transition: 'border-color 0.2s, transform 0.1s',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--text-main)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>${parseFloat(p.precio_venta).toFixed(2)}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock: {p.stock}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Columna Derecha: Carrito de Compras */}
      <div style={{ flex: '4', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sidebar)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', height: '100%' }}>
        
        <div style={{ flexShrink: 0, padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-main)' }}>
          <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', margin: 0 }}><ShoppingCart size={18} /> Pedido</h2>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {lastInvoiceId && (
              <button 
                onClick={() => handleViewReceiptFromHistory(lastInvoiceId)}
                style={{ color: 'var(--primary)', backgroundColor: 'transparent', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem', border: '1px solid var(--primary)', padding: '0.15rem 0.4rem' }}
              >
                <Printer size={12} /> Reimprimir
              </button>
            )}
            {cart.length > 0 && (
              <button onClick={clearCart} style={{ color: 'var(--danger)', backgroundColor: 'transparent', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Trash2 size={14} /> Vaciar</button>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: '1rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-sidebar)', position: 'relative' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <User size={10} style={{ marginRight: '0.2rem' }} /> Cliente
          </div>

          {selectedCustomer ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem' }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.95rem' }}>{selectedCustomer.nombre}</div>
                {selectedCustomer.rnc_cedula && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedCustomer.rnc_cedula}</div>}
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '0.2rem' }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Consumidor Final / Buscar cliente..."
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  style={{ width: '100%', paddingLeft: '2rem', fontSize: '0.85rem', padding: '0.5rem 0.6rem 0.5rem 2rem' }}
                />
              </div>

              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div style={{ position: 'absolute', left: '1rem', right: '1rem', zIndex: 50, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      onMouseDown={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerDropdown(false); }}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    >
                      <div style={{ fontWeight: '500' }}>{c.nombre}</div>
                      {c.rnc_cedula && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.rnc_cedula}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: '1', overflowY: 'auto', padding: '0.75rem', minHeight: 0 }}>
          {cart.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem', 
                  backgroundColor: 'var(--bg-main)', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.1rem' }}>{item.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
                      <span>${parseFloat(item.precio_venta).toFixed(2)} x {item.cantidad}</span>
                      {item.aplica_iva && <span style={{ color: 'var(--primary)', fontWeight: '500' }}>+IVA</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius)' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '0.3rem', backgroundColor: 'transparent', color: 'var(--text-main)' }}><Minus size={14} /></button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem' }}>{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '0.3rem', backgroundColor: 'transparent', color: 'var(--text-main)' }}><Plus size={14} /></button>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>
                        ${(item.precio_venta * item.cantidad * (item.aplica_iva ? (1 + (settings ? parseFloat(settings.itbis_tasa)/100 : 0.16)) : 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0, backgroundColor: 'var(--bg-main)', borderTop: '2px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>IVA ({(settings ? parseFloat(settings.itbis_tasa) : 16)}%)</span>
            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>${totals.iva.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>

          {!cajaAbierta && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '0.5rem', borderRadius: 'var(--radius)', marginTop: '0.5rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.8rem' }}>⚠️ CAJA CERRADA</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button 
              onClick={() => handleProcess('efectivo')}
              disabled={cart.length === 0 || processing || !cajaAbierta}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: cart.length === 0 || processing || !cajaAbierta ? 0.5 : 1 }}
            >
              <Banknote size={18} /> {processing ? '...' : 'Efectivo'}
            </button>
            <button 
              onClick={() => handleProcess('tarjeta')}
              disabled={cart.length === 0 || processing || !cajaAbierta}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: cart.length === 0 || processing || !cajaAbierta ? 0.5 : 1 }}
            >
              <CreditCard size={18} /> {processing ? '...' : 'Tarjeta'}
            </button>
          </div>
        </div>
      </div>

      <ReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        settings={settings}
        loadingDetalle={loadingDetalle}
      />
    </div>
  );
};

export default POSPage;
