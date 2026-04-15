import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, 
  Banknote, CheckCircle, User, ChevronDown, X, FileDigit, 
  Printer // <--- CORREGIDO: Importación de Printer añadida
} from 'lucide-react';
import usePOS from '../../hooks/usePOS';
import useCaja from '../../hooks/useCaja';
import ReceiptModal from '../Invoices/ReceiptModal';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

const POSPage = () => {
  const { 
    products, 
    settings, 
    cart, 
    loading, 
    isPrinting,
    error, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getTotals, 
    processSale,
    saveCotizacion,
    loadCotizacion,
    discardCotizacion,
    cotizacionId
  } = usePOS();

  const { cajaAbierta } = useCaja();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState(null);

  // Estado para el modal de nuevo cliente rápido
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ rnc_cedula: '', nombre: '', telefono: '', direccion: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  
  const customerIdInputRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // ALT + N para Nuevo Cliente
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isCustomerModalOpen) {
      setTimeout(() => {
        customerIdInputRef.current?.focus();
      }, 100);
    }
  }, [isCustomerModalOpen]);

  useEffect(() => {
    api.get('/customers').then(res => setCustomers(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const importData = localStorage.getItem('pos_cotizacion_import');
    if (importData) {
      try {
        const parsed = JSON.parse(importData);
        loadCotizacion(parsed.items, parsed.id);
        if (parsed.cliente_id) {
          setSelectedCustomer({ id: parsed.cliente_id, nombre: parsed.cliente_nombre });
        }
        localStorage.removeItem('pos_cotizacion_import');
      } catch (err) {
        console.error('Error importando cotización', err);
      }
    }
  }, []); // Solo al montar

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
      
      const res = await processSale(metodo, selectedCustomer?.id || null);
      
      if (res && res.success) {
        if (res.offline) {
          setSuccessMessage(`📴 MODO CONTINGENCIA: Venta guardada localmente (${res.numero_factura}). Se sincronizarará al volver la red.`);
        } else if (res.printer_success) {
          setSuccessMessage(`✅ Factura generada e impresa: ${res.data.numero_factura}`);
        } else {
          setSuccessMessage(`⚠️ Factura generada (${res.data.numero_factura}) pero FALLÓ LA IMPRESIÓN: ${res.printer_error}`);
        }

        
        setLastInvoiceId(res.data.factura_id);
        setIsReceiptModalOpen(true);
        setLoadingDetalle(true);

        const detailRes = await api.get(`/invoices/${res.data.factura_id}`);
        setSelectedInvoice(detailRes.data);
        
        setSelectedCustomer(null);
        setCustomerSearch('');
        // El success message se queda más tiempo si hubo error de impresión
        setTimeout(() => setSuccessMessage(''), res.printer_success ? 5000 : 10000);
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

  const handleSaveCotizacion = async () => {
    setProcessing(true);
    setSuccessMessage('');
    const res = await saveCotizacion(selectedCustomer?.id || null);
    
    if (res && res.success) {
      setSuccessMessage(`✅ Cotización generada con éxito: ${res.data.numero_cotizacion}`);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      alert(res?.message || 'Error al guardar la cotización');
    }
    setProcessing(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.nombre || newCustomer.nombre.trim().length < 3) {
      alert("El nombre del cliente es obligatorio y debe tener al menos 3 caracteres.");
      return;
    }
    setSavingCustomer(true);
    try {
      const res = await api.post('/customers', {
        ...newCustomer,
        nombre: newCustomer.nombre.trim().toUpperCase(),
        rnc_cedula: newCustomer.rnc_cedula ? newCustomer.rnc_cedula.trim().toUpperCase() : null
      });
      const createdCustomer = { id: res.data.id, ...newCustomer, nombre: newCustomer.nombre.trim().toUpperCase() };
      setCustomers(prev => [...prev, createdCustomer]);
      setSelectedCustomer(createdCustomer);
      setCustomerSearch('');
      setIsCustomerModalOpen(false);
      setNewCustomer({ rnc_cedula: '', nombre: '', telefono: '', direccion: '' });
      setSuccessMessage('✅ Cliente registrado y seleccionado automáticamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Error al guardar el cliente (Es posible que la cédula ya exista)');
    } finally {
      setSavingCustomer(false);
    }
  };

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [pendingWeightProduct, setPendingWeightProduct] = useState(null);
  const [manualWeight, setManualWeight] = useState('');

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

  const parseScaleBarcode = (code) => {
    // Patrón estándar: 20 (2) + Producto (5) + Peso en gramos (5) + Check (1)
    if (code.length === 13 && code.startsWith('20')) {
      const productIdCode = code.substring(2, 7);
      const weightGrams = parseInt(code.substring(7, 12));
      const weightKg = weightGrams / 1000;
      return { productIdCode, weightKg };
    }
    return null;
  };

  const handleBarcodeScan = (code) => {
    const scaleData = parseScaleBarcode(code);
    if (scaleData) {
      // Buscar por código interno (los 5 dígitos)
      const product = products.find(p => p.codigo_barras === scaleData.productIdCode || p.id.toString() === parseInt(scaleData.productIdCode).toString());
      if (product) {
        addToCart({ ...product, cantidad: scaleData.weightKg });
        setSearchTerm('');
        return true;
      }
    }

    const product = products.find(p => p.codigo_barras === code);
    if (product) {
      if (product.es_pesable) {
        setPendingWeightProduct(product);
        setIsWeightModalOpen(true);
      } else {
        addToCart(product);
      }
      setSearchTerm('');
      return true;
    }
    return false;
  };

  const addProductWithWeight = () => {
    const weight = parseFloat(manualWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Ingrese un peso válido');
      return;
    }
    addToCart({ ...pendingWeightProduct, cantidad: weight });
    setIsWeightModalOpen(false);
    setPendingWeightProduct(null);
    setManualWeight('');
    setSearchTerm('');
  };

  const handleProductClick = (p) => {
    if (p.es_pesable) {
      setPendingWeightProduct(p);
      setIsWeightModalOpen(true);
    } else {
      addToCart(p);
    }
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm) {
                const found = handleBarcodeScan(searchTerm);
                if (!found && filteredProducts.length === 1) {
                   handleProductClick(filteredProducts[0]);
                   setSearchTerm('');
                }
              }
            }}
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
                onClick={() => handleProductClick(p)}
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
          <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', margin: 0 }}>
            <ShoppingCart size={18} /> Pedido
            {cotizacionId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{fontSize: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', marginLeft: '0.5rem'}}>F-COT</span>
                <button onClick={discardCotizacion} style={{ backgroundColor: 'transparent', color: 'var(--danger)', padding: '0.2rem', border: '1px solid var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Cancelar importación">
                   <X size={10} />
                </button>
              </div>
            )}
          </h2>
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

              {showCustomerDropdown && (
                <div style={{ position: 'absolute', left: '1rem', right: '1rem', zIndex: 50, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', maxHeight: '250px', overflowY: 'auto' }}>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <div
                        key={c.id}
                        onMouseDown={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerDropdown(false); }}
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      >
                        <div style={{ fontWeight: '500' }}>{c.nombre}</div>
                        {c.rnc_cedula && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.rnc_cedula}</div>}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No se encontraron resultados
                    </div>
                  )}

                   {/* Siempre mostrar opción de crear si hay algo escrito o no hay resultados */}
                  {(customerSearch.length > 2 || filteredCustomers.length === 0) && (
                    <div 
                      onMouseDown={(e) => { 
                        e.preventDefault(); 
                        setNewCustomer({ ...newCustomer, rnc_cedula: customerSearch, nombre: '' });
                        setIsCustomerModalOpen(true); 
                        setShowCustomerDropdown(false);
                      }}
                      style={{ 
                        padding: '1rem', 
                        cursor: 'pointer', 
                        backgroundColor: 'rgba(56, 189, 248, 0.1)', 
                        color: 'var(--primary)', 
                        fontWeight: 'bold', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        borderTop: '2px dashed var(--border)',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} /> Registrar como nuevo cliente
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal' }}>
                        Atajo: ALT + N
                      </div>
                    </div>
                  )}
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
                      <span>${parseFloat(item.precio_venta).toFixed(2)} x {item.es_pesable ? item.cantidad.toFixed(3) : item.cantidad} {item.es_pesable ? 'kg' : 'unid'}</span>
                      {item.aplica_iva && <span style={{ color: 'var(--primary)', fontWeight: '500' }}>+IVA</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius)' }}>
                      <button onClick={() => updateQuantity(item.id, item.es_pesable ? -0.1 : -1)} style={{ padding: '0.3rem', backgroundColor: 'transparent', color: 'var(--text-main)' }}><Minus size={14} /></button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem' }}>{item.es_pesable ? item.cantidad.toFixed(3) : item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.id, item.es_pesable ? 0.1 : 1)} style={{ padding: '0.3rem', backgroundColor: 'transparent', color: 'var(--text-main)' }}><Plus size={14} /></button>
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
              style={{ flex: 1, padding: '0.75rem', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: cart.length === 0 || processing || !cajaAbierta ? 0.5 : 1 }}
            >
              <Banknote size={18} /> {processing ? '...' : 'Efectivo'}
            </button>
            <button 
              onClick={() => handleProcess('tarjeta')}
              disabled={cart.length === 0 || processing || !cajaAbierta}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: cart.length === 0 || processing || !cajaAbierta ? 0.5 : 1 }}
            >
              <CreditCard size={18} /> {processing ? '...' : 'Tarjeta'}
            </button>
            <button 
              onClick={() => handleProcess('divisas')}
              disabled={cart.length === 0 || processing || !cajaAbierta}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: '#fbbf24', color: '#1f2937', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: cart.length === 0 || processing || !cajaAbierta ? 0.5 : 1 }}
            >
              <Banknote size={18} /> {processing ? '...' : 'Dólar (+IGTF)'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button 
              onClick={handleSaveCotizacion}
              disabled={cart.length === 0 || processing}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: cart.length === 0 || processing ? 0.5 : 1, transition: 'all 0.2s', ...(!cart.length || processing ? {} : { cursor: 'pointer' }) }}
              onMouseOver={(e) => { if (cart.length > 0 && !processing) { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; } }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
            >
              <FileDigit size={18} /> Guardar Presupuesto / Cotización
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

      {/* Modal para ingresar peso manualmente */}
      {isWeightModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '350px', border: '2px solid var(--primary)', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>{pendingWeightProduct?.nombre}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Ingrese el peso en Kilogramos (Kg)</p>
            <input 
              type="number" 
              step="0.001" 
              autoFocus 
              value={manualWeight}
              onChange={(e) => setManualWeight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProductWithWeight()}
              style={{ fontSize: '2rem', textAlign: 'center', width: '100%', marginBottom: '1.5rem', padding: '0.5rem' }}
              placeholder="0.000"
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => { setIsWeightModalOpen(false); setManualWeight(''); }} style={{ flex: 1, padding: '1rem', background: 'transparent', color: 'white', border: '1px solid var(--border)' }}>Cancelar</button>
              <button onClick={addProductWithWeight} style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Registro Rápido de Cliente */}
      {isCustomerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '400px', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} /> Registrar Cliente Express
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Cédula / RIF</label>
                <input 
                  type="text" 
                  ref={customerIdInputRef}
                  value={newCustomer.rnc_cedula} 
                  placeholder="V-00000000"
                  onChange={e => setNewCustomer({...newCustomer, rnc_cedula: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Nombre / Razón Social <span style={{color: 'var(--danger)'}}>*</span></label>
                <input 
                  type="text" 
                  value={newCustomer.nombre} 
                  placeholder="Nombre Completo"
                  onChange={e => setNewCustomer({...newCustomer, nombre: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Teléfono (WhatsApp)</label>
                <input 
                  type="text" 
                  placeholder="Ej: 04141234567"
                  value={newCustomer.telefono} 
                  onChange={e => setNewCustomer({...newCustomer, telefono: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-input)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Dirección</label>
                <input 
                  type="text" 
                  value={newCustomer.direccion} 
                  onChange={e => setNewCustomer({...newCustomer, direccion: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-input)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setIsCustomerModalOpen(false)}
                style={{ flex: 1, padding: '0.75rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateCustomer}
                disabled={!newCustomer.nombre || savingCustomer}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: 'var(--radius)', opacity: (!newCustomer.nombre || savingCustomer) ? 0.5 : 1 }}
              >
                {savingCustomer ? 'Guardando...' : 'Guardar y Seleccionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPrinting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            textAlign: 'center'
          }}>
            <Printer size={48} className="animate-pulse" style={{ color: 'var(--primary)' }} />
            <h2 style={{ margin: 0 }}>Imprimiendo Ticket...</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Por favor, espere a que la impresora fiscal termine.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
