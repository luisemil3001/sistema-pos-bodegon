import React, { useState } from 'react';
import api from '../../api/api';
import { formatCurrency } from '../../utils/format';
import { FileX, AlertTriangle, CheckCircle } from 'lucide-react';

const MOTIVOS = [
  'Producto en mal estado',
  'Producto incorrecto entregado',
  'Error en precio',
  'Devolución voluntaria del cliente',
  'Producto dañado en entrega',
  'Otro',
];

const CreditNoteModal = ({ isOpen, onClose, invoice, settings, onSuccess }) => {
  const [motivo, setMotivo] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');
  const [metodoDev, setMetodoDev] = useState('efectivo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !invoice) return null;

  const formatNum = formatCurrency;

  const motivoFinal = motivo === 'Otro' ? motivoCustom : motivo;

  const handleSubmit = async () => {
    if (!motivoFinal.trim()) {
      setError('Debes seleccionar o escribir un motivo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/credit-notes', {
        factura_id: invoice.id,
        motivo: motivoFinal.trim(),
        metodo_devolucion: metodoDev,
      });

      if (res.data.success) {
        // En lugar de cerrar de inmediato, podríamos informar si la impresión falló
        if (res.data.printer_success) {
          onSuccess(res.data);
          onClose();
        } else {
          setError(`La nota se guardó pero FALLÓ LA IMPRESIÓN FISCAL: ${res.data.printer_error}`);
          // Permitimos que el usuario vea el error, luego puede cerrar manualmente o intentar otra cosa
          // Pero marcamos success en el padre para que refresque la lista
          onSuccess(res.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al emitir la Nota de Crédito');
    } finally {
      setLoading(false);
    }
  };

  const isFiscal = settings?.tipo_impresora === 'fiscal';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', width: '520px', maxWidth: '95vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
          borderBottom: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            backgroundColor: 'rgba(239,68,68,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <FileX size={22} color="var(--danger)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Nota de Crédito / Devolución
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Factura de referencia: <strong style={{ color: 'var(--danger)' }}>{invoice.numero_factura}</strong>
            </p>
          </div>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Aviso Fiscal */}
          {isFiscal && (
            <div style={{
              backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 'var(--radius)', padding: '0.75rem 1rem',
              display: 'flex', gap: '0.5rem', alignItems: 'flex-start'
            }}>
              <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#fbbf24' }}>
                Tienes una <strong>Impresora Fiscal</strong> configurada. Al confirmar, el sistema registrará la NC internamente y generará el comprobante. Recuerda emitir también la Nota de Crédito directamente desde tu impresora fiscal para cumplir con el SENIAT.
              </p>
            </div>
          )}

          {/* Resumen Factura */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', padding: '1rem'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>
              Resumen a Devolver
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              <span>Cliente:</span>
              <span style={{ fontWeight: '600' }}>{invoice.cliente_nombre || 'Consumidor Final'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              <span>Subtotal:</span>
              <span>${formatNum(invoice.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              <span>IVA:</span>
              <span>${formatNum(invoice.itbis)}</span>
            </div>
            {parseFloat(invoice.igtf_monto || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem', color: '#fbbf24' }}>
                <span>IGTF:</span>
                <span>${formatNum(invoice.igtf_monto)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', color: 'var(--danger)' }}>
              <span>TOTAL A DEVOLVER:</span>
              <span>${formatNum(invoice.total)}</span>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>
              Motivo de Devolución *
            </label>
            <select
              value={motivo}
              onChange={(e) => { setMotivo(e.target.value); setMotivoCustom(''); }}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', marginBottom: '0.5rem' }}
            >
              <option value="">-- Seleccione un motivo --</option>
              {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {motivo === 'Otro' && (
              <input
                type="text"
                placeholder="Describa el motivo..."
                value={motivoCustom}
                onChange={(e) => setMotivoCustom(e.target.value)}
                style={{ width: '100%' }}
              />
            )}
          </div>

          {/* Método de Devolución */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>
              Método de Reembolso *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'transferencia', label: 'Transferencia' },
                { value: 'tarjeta', label: 'Tarjeta' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMetodoDev(opt.value)}
                  style={{
                    flex: 1, padding: '0.6rem',
                    borderRadius: 'var(--radius)',
                    border: `2px solid ${metodoDev === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: metodoDev === opt.value ? 'rgba(56,189,248,0.1)' : 'transparent',
                    color: metodoDev === opt.value ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: metodoDev === opt.value ? '600' : '400',
                    cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !motivoFinal.trim()}
              style={{
                flex: 2, padding: '0.75rem', backgroundColor: 'var(--danger)', color: 'white',
                border: 'none', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                opacity: loading || !motivoFinal.trim() ? 0.6 : 1
              }}
            >
              <CheckCircle size={18} />
              {loading ? 'Procesando...' : 'Confirmar Nota de Crédito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditNoteModal;
