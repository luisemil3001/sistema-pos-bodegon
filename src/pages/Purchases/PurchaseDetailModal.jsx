import React from 'react';
import { X, Package, ShoppingBag } from 'lucide-react';

const PurchaseDetailModal = ({ isOpen, onClose, purchase, loading }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-main)',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border)'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '1.25rem', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: 'var(--bg-sidebar)' 
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
              Detalle de Compra: {purchase?.numero_factura_proveedor}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Registrado el {purchase ? new Date(purchase.fecha).toLocaleString() : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando detalles...</div>
          ) : purchase ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Información General */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-sidebar)', borderRadius: 'var(--radius)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Proveedor</div>
                  <div style={{ fontWeight: '600' }}>{purchase.proveedor_nombre || 'Desconocido'}</div>
                  <div style={{ fontSize: '0.85rem' }}>{purchase.rnc_cedula || ''}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Método de Pago</div>
                  <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{purchase.metodo_pago}</div>
                  <div style={{ fontSize: '0.85rem' }}>Registrado por: {purchase.registrador_nombre}</div>
                </div>
              </div>

              {/* Tabla de Items */}
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={18} /> Productos Recibidos
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Producto</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Costo Unit.</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px dashed var(--border)' }}>
                        <td style={{ padding: '0.75rem 0' }}>
                          <span style={{ fontWeight: '500' }}>{item.producto_nombre}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.codigo_barras || 'S/N'}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>{item.cantidad}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>${parseFloat(item.costo_unitario).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
             <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>No se pudo cargar la información de la compra.</div>
          )}
        </div>

        {/* Footer con Totales */}
        <div style={{ padding: '1.5rem', borderTop: '2px solid var(--border)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Subtotal: ${parseFloat(purchase?.subtotal || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ITBIS: ${parseFloat(purchase?.itbis || 0).toFixed(2)}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>Total Factura: ${parseFloat(purchase?.total || 0).toFixed(2)}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PurchaseDetailModal;
