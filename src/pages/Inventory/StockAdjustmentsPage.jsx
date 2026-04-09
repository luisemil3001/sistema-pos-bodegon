import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, History, Save, AlertCircle } from 'lucide-react';
import api from '../../api/api';
import useProducts from '../../hooks/useProducts';

const StockAdjustmentsPage = () => {
  const { products, fetchProducts } = useProducts();
  const [adjustments, setAdjustments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [physicalStock, setPhysicalStock] = useState('');
  const [motivo, setMotivo] = useState('Conteo Mensual');
  const [tipo, setTipo] = useState('AJUSTE_FISICO');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const res = await api.get('/adjustments');
      setAdjustments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!selectedProduct || physicalStock === '') return;

    setSaving(true);
    try {
      await api.post('/adjustments', {
        producto_id: selectedProduct.id,
        stock_nuevo: parseInt(physicalStock),
        tipo,
        motivo
      });
      setMessage({ type: 'success', text: 'Stock ajustado correctamente' });
      setPhysicalStock('');
      setSelectedProduct(null);
      fetchProducts();
      fetchAdjustments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al ajustar stock' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.codigo_barras && p.codigo_barras.includes(searchTerm))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Reconciliación de Inventario</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ajuste el stock real detectado físicamente</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Formulario de Ajuste */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={18} /> Nuevo Ajuste
          </h3>

          {message && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: 'var(--radius)', 
              marginBottom: '1rem',
              backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
              fontSize: '0.9rem'
            }}>
              {message.text}
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
            
            {searchTerm && !selectedProduct && (
              <div style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, 
                backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border)', 
                borderRadius: 'var(--radius)', zIndex: 10, maxHeight: '200px', overflowY: 'auto',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}>
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => { setSelectedProduct(p); setSearchTerm(''); }}
                    style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  >
                    <div style={{ fontWeight: '600' }}>{p.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock Actual: {p.stock} {p.unidad}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontWeight: 'bold' }}>{selectedProduct.nombre}</div>
                <div style={{ fontSize: '0.9rem' }}>Stock esperado por sistema: <strong>{selectedProduct.stock}</strong></div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Stock Físico Real *</label>
                <input 
                  type="number" 
                  value={physicalStock} 
                  onChange={(e) => setPhysicalStock(e.target.value)} 
                  placeholder="Cantidad contada"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Tipo de Ajuste</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ width: '100%' }}>
                    <option value="AJUSTE_FISICO">Inventario Físico</option>
                    <option value="MERMA">Merma/Pérdida</option>
                    <option value="ENTRADA">Entrada Manual</option>
                    <option value="SALIDA">Salida Manual</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Motivo</label>
                  <select value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ width: '100%' }}>
                    <option value="Conteo Mensual">Conteo Mensual</option>
                    <option value="Dañado/Vencido">Dañado/Vencido</option>
                    <option value="Robo/Extravío">Robo/Extravío</option>
                    <option value="Error de Entrada">Error de Entrada</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ flex: 1, backgroundColor: 'var(--primary)', color: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Save size={18} />
                  {saving ? 'Guardando...' : 'Confirmar Ajuste'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedProduct(null)}
                  style={{ backgroundColor: 'transparent', border: '1px solid var(--border)' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!selectedProduct && !searchTerm && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Busca un producto para iniciar el ajuste</p>
            </div>
          )}
        </div>

        {/* Historial */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} /> Historial Reciente
          </h3>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {adjustments.map(a => (
              <div key={a.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{a.producto_nombre}</span>
                  <span style={{ 
                    color: a.cantidad_ajuste < 0 ? 'var(--danger)' : 'var(--success)',
                    fontWeight: 'bold'
                  }}>
                    {a.cantidad_ajuste > 0 ? '+' : ''}{a.cantidad_ajuste}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{a.motivo} • {a.usuario_nombre}</span>
                  <span>{new Date(a.fecha).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentsPage;
