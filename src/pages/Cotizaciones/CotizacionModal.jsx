import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Printer, Loader2, Play, MessageSquare, Trash2 } from 'lucide-react';
import api from '../../api/api';
import { generateWhatsAppLink } from '../../utils/whatsappHelper';
import { formatCurrency, formatQty } from '../../utils/format';


import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const CotizacionModal = ({ isOpen, onClose, cotizacion, loadingDetalle, settings }) => {
  const navigate = useNavigate();
  const tasa = parseFloat(settings?.tasa_dolar || 1);
  const toBs = (val) => (parseFloat(val) * tasa);
  const formatNum = formatCurrency;

  if (!isOpen) return null;

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };
   
  const handleFacturar = () => {
    // Almacenar temporalmente los datos en localStorage para que el POS los absorba
    localStorage.setItem('pos_cotizacion_import', JSON.stringify({
      id: cotizacion.id,
      cliente_id: cotizacion.cliente_id,
      cliente_nombre: cotizacion.cliente_nombre,
      items: cotizacion.items
    }));
    navigate('/pos');
  };

  const handleVoid = async () => {
    if (!window.confirm('¿Está seguro de que desea ANULAR este presupuesto? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/cotizaciones/${cotizacion.id}`);
      alert('Presupuesto anulado correctamente');
      onClose();
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al anular presupuesto');
    }
  };

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
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Detalle de Cotización</h2>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto' }} id="cotizacion-print-area">
          {loadingDetalle || !cotizacion ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : (
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.9rem', color: '#000', backgroundColor: '#fff', padding: '2rem', border: '1px solid #eee', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.5rem' }}>PRESUPUESTO</h1>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}># {cotizacion.numero_cotizacion}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0 }}>SISTEMA POS BODEGÓN</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Documento no válido como factura fiscal</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cliente</div>
                  <div style={{ fontWeight: 'bold' }}>{cotizacion.cliente_nombre || 'CONSUMIDOR FINAL'}</div>
                  {cotizacion.rnc_cedula && <div style={{ fontSize: '0.85rem' }}>RNC/CI: {cotizacion.rnc_cedula}</div>}
                  {(cotizacion.cliente_telefono || cotizacion.telefono) && (
                    <div style={{ fontSize: '0.85rem' }}>TEL: {cotizacion.cliente_telefono || cotizacion.telefono}</div>
                  )}
                  {cotizacion.direccion && <div style={{ fontSize: '0.85rem', color: '#666' }}>{cotizacion.direccion}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Detalles de Emisión</div>
                  <div style={{ fontWeight: 'bold' }}>Fecha: {new Date(cotizacion.fecha).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.85rem' }}>Validez: {cotizacion.validez_dias} días</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>Atendido por: {cotizacion.cajero_nombre}</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#f3f4f6' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Descripción del Producto</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Cant.</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Precio</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.items?.map((it, idx) => (
                    <tr key={it.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{it.producto_nombre}</td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>{formatQty(it.cantidad)}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem' }}>
                        <div>Bs. {formatNum(toBs(it.precio_unitario))}</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>$ {formatNum(it.precio_unitario)}</div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '500' }}>
                        <div>Bs. {formatNum(toBs(it.subtotal))}</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>$ {formatNum(it.subtotal)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '280px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                    <span style={{ color: '#666' }}>Subtotal:</span>
                    <span>Bs. {formatNum(toBs(cotizacion.subtotal || 0))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                    <span style={{ color: '#666' }}>IVA ({settings?.itbis_tasa || 16}%):</span>
                    <span>Bs. {formatNum(toBs(cotizacion.itbis || 0))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderTop: '2px solid var(--primary)', marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
                    <span>TOTAL Bs:</span>
                    <span>Bs. {formatNum(toBs(cotizacion.total || 0))}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #ddd', marginTop: '5px', paddingTop: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <span style={{ color: '#666' }}>REF. USD:</span>
                      <span>$ {formatNum(cotizacion.total || 0)}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', textAlign: 'right', color: '#888', fontStyle: 'italic' }}>
                      Tasa: Bs. {formatNum(tasa)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1rem', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                * Este documento es un presupuesto informativo y no representa un compromiso de reserva de inventario hasta que se procese el pago.<br/>
                Válido por {cotizacion.validez_dias} días contados a partir de la fecha de emisión.
              </div>
            </div>
          )}
        </div>

        <div className="no-print" style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          {cotizacion && cotizacion.estado === 'pendiente' && (
            <>
              <button 
                onClick={handleVoid}
                style={{ padding: '0.5em 1em', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', fontWeight: 'bold', marginRight: 'auto' }}
              >
                <Trash2 size={18} /> Anular
              </button>
              <button 
                onClick={handleFacturar}
                style={{ padding: '0.5em 1em', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}
              >
                <Play size={18} /> Facturar
              </button>
            </>
          )}
          <button 
            onClick={() => {
              const link = generateWhatsAppLink(cotizacion, settings);
              if (link) window.open(link, '_blank');
              else alert('Error al generar link de WhatsApp');
            }}
            style={{ 
              padding: '0.5em 1em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: '#25D366', 
              color: 'white', 
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer'
            }}
            disabled={!cotizacion || loadingDetalle}
          >
            <MessageSquare size={18} /> WhatsApp
          </button>
          <button 
            onClick={handlePrint}
            style={{ padding: '0.5em 1em', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
            disabled={!cotizacion || loadingDetalle}
          >
            <Printer size={18} /> Imprimir
          </button>

        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cotizacion-print-area, #cotizacion-print-area * { visibility: visible; }
          #cotizacion-print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0; padding: 10mm; background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CotizacionModal;
