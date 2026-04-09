import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ShoppingBag, Plus, Minus, Trash2, ArrowLeft, CheckCircle, Barcode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePurchases from '../../hooks/usePurchases';
import useSuppliers from '../../hooks/useSuppliers';
import api from '../../api/api';

const NewPurchasePage = () => {
  const navigate = useNavigate();
  const { createPurchase } = usePurchases();
  const { suppliers, fetchSuppliers } = useSuppliers();
  
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const barcodeInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    numero_factura_proveedor: '',
    proveedor_id: '',
    metodo_pago: 'efectivo'
  });

  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSuppliers();
    api.get('/products').then(res => setProducts(res.data)).catch(console.error);
    // Enfocar el input de código de barras al cargar
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  }, [fetchSuppliers]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      (p.codigo_barras && p.codigo_barras.includes(term))
    );
  }, [products, searchTerm]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...prev, { ...product, cantidad: 1, costo_unitario: product.precio_costo || 0 }];
      }
    });
    setBarcodeSearch('');
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeSearch) return;

    const product = products.find(p => p.codigo_barras === barcodeSearch);
    if (product) {
      addToCart(product);
    } else {
      alert('Producto no encontrado con ese código de barras');
      setBarcodeSearch('');
    }
  };

  const updateCartItem = (id, field, value) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        let val = field === 'cantidad' ? parseInt(value) || 0 : parseFloat(value) || 0;
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getTotal = () => {
    let subtotal = 0;
    cart.forEach(item => {
      subtotal += (item.costo_unitario * item.cantidad);
    });
    return subtotal;
  };

  const handleProcess = async (e) => {
    if (e) e.preventDefault();
    if (!formData.numero_factura_proveedor) return alert('Ingrese el número de factura del proveedor');
    if (cart.length === 0) return alert('Agregue productos a la compra');
    
    setProcessing(true);
    setSuccessMessage('');
    
    const payload = {
      numero_factura_proveedor: formData.numero_factura_proveedor,
      proveedor_id: formData.proveedor_id || null,
      metodo_pago: formData.metodo_pago,
      items: cart.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario
      }))
    };

    const res = await createPurchase(payload);
    
    if (res.success) {
      setSuccessMessage('¡Compra registrada correctamente! El stock y precios de costo han sido actualizados.');
      setCart([]);
      setFormData({ numero_factura_proveedor: '', proveedor_id: '', metodo_pago: 'efectivo' });
      setTimeout(() => navigate('/compras'), 2500);
    } else {
      alert(res.message);
    }
    setProcessing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/compras')} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Ingreso de Mercancía</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Registre facturas para sumar stock e informar nuevos costos</p>
        </div>
      </div>

      {successMessage && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><CheckCircle size={20}/> {successMessage}</div>}

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        
        {/* Columna Izquierda: Datos y Carrito */}
        <div style={{ flex: '5', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-sidebar)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Nro Factura Proveedor *</label>
                <input 
                  type="text" 
                  value={formData.numero_factura_proveedor}
                  onChange={e => setFormData(prev => ({ ...prev, numero_factura_proveedor: e.target.value }))}
                  style={{ width: '100%' }}
                  placeholder="Ej: FAC-12345"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Proveedor</label>
                <select 
                  value={formData.proveedor_id}
                  onChange={e => setFormData(prev => ({ ...prev, proveedor_id: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                >
                  <option value="">Seleccione proveedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Búsqueda por Barras</label>
                <form onSubmit={handleBarcodeSubmit} style={{ position: 'relative' }}>
                  <Barcode size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  <input 
                    ref={barcodeInputRef}
                    type="text" 
                    placeholder="Escanear..."
                    value={barcodeSearch}
                    onChange={e => setBarcodeSearch(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.5rem', borderColor: 'var(--primary)' }}
                  />
                </form>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingBag size={17} /> Mercancía Recibida</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Items: {cart.length}</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {cart.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <Barcode size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Escanee códigos de barras o seleccione productos del catálogo.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ paddingBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Producto</th>
                      <th style={{ paddingBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', width: '90px' }}>Cantidad</th>
                      <th style={{ paddingBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', width: '120px' }}>Costo Nuevo</th>
                      <th style={{ paddingBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ paddingBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px dashed var(--border)' }}>
                        <td style={{ padding: '0.8rem 0' }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Costo Anterior: ${parseFloat(item.precio_costo || 0).toFixed(2)}</div>
                        </td>
                        <td style={{ padding: '0.8rem 0' }}>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.cantidad} 
                            onChange={(e) => updateCartItem(item.id, 'cantidad', e.target.value)}
                            style={{ width: '70px', padding: '0.4rem' }}
                          />
                        </td>
                        <td style={{ padding: '0.8rem 0' }}>
                          <input 
                            type="number" 
                            min="0"
                            step="0.01" 
                            value={item.costo_unitario} 
                            onChange={(e) => updateCartItem(item.id, 'costo_unitario', e.target.value)}
                            style={{ width: '100px', padding: '0.4rem', border: item.costo_unitario > (item.precio_costo || 0) ? '1px solid var(--danger)' : '1px solid var(--border)' }}
                          />
                        </td>
                        <td style={{ padding: '0.8rem 0', textAlign: 'right', fontWeight: 'bold' }}>
                          ${(item.cantidad * item.costo_unitario).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.8rem 0', textAlign: 'center' }}>
                          <button onClick={() => removeFromCart(item.id)} style={{ padding: '0.2rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total Factura: <span style={{ color: 'var(--primary)' }}>${getTotal().toFixed(2)}</span></div>
              <button 
                onClick={handleProcess}
                disabled={cart.length === 0 || processing}
                style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--primary)', color: 'var(--bg-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: cart.length === 0 || processing ? 0.5 : 1, borderRadius: 'var(--radius)' }}
              >
                {processing ? 'Procesando...' : 'Confirmar Ingreso'}
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Catálogo */}
        <div style={{ flex: '3', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-sidebar)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar producto manual..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
            {filteredProducts.map(p => (
              <div 
                key={p.id} 
                onClick={() => addToCart(p)}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateX(5px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>{p.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stock: {p.stock} | {p.codigo_barras || 'S/N'}</div>
                </div>
                <div style={{ color: 'var(--primary)' }}>
                  <Plus size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchasePage;
