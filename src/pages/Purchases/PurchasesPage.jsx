import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePurchases from '../../hooks/usePurchases';
import PurchaseDetailModal from './PurchaseDetailModal';

const PurchasesPage = () => {
  const { purchases, loading, error, fetchPurchases, fetchPurchaseDetail } = usePurchases();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleViewDetail = async (id) => {
    setIsModalOpen(true);
    setLoadingDetail(true);
    const result = await fetchPurchaseDetail(id);
    if (result.success) {
      setSelectedPurchase(result.data);
    } else {
      alert(result.message);
      setIsModalOpen(false);
    }
    setLoadingDetail(false);
  };

  const filteredPurchases = purchases.filter(p => 
    p.numero_factura_proveedor.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.proveedor_nombre && p.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Historial de Compras</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Consulte las facturas de compra y el ingreso de mercancía</p>
        </div>
        <button 
          onClick={() => navigate('/compras/nueva')}
          style={{ backgroundColor: 'var(--primary)', color: 'var(--bg-main)', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
        >
          <Plus size={18} />
          Ingresar Compra
        </button>
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
            placeholder="Buscar por Nro Factura o Proveedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading && purchases.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando historial...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Factura Proveedor</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Proveedor</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Registrado Por</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron compras.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary)' }}>{p.numero_factura_proveedor}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(p.fecha).toLocaleString()}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        <div>{p.proveedor_nombre || 'Desconocido'}</div>
                        {p.rnc_cedula && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.rnc_cedula}</div>}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{p.registrador_nombre}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', textAlign: 'right', color: 'var(--text-main)' }}>
                        ${parseFloat(p.total).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleViewDetail(p.id)}
                          style={{ padding: '0.4rem', backgroundColor: 'transparent', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: '4px' }}
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PurchaseDetailModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedPurchase(null); }}
        purchase={selectedPurchase}
        loading={loadingDetail}
      />
    </div>
  );
};

export default PurchasesPage;
