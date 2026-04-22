import React from 'react';
import { generateWhatsAppLink } from '../../utils/whatsappHelper';
import { MessageSquare, X } from 'lucide-react';
import { formatCurrency, formatQty } from '../../utils/format';


const ReceiptModal = ({ isOpen, onClose, invoice, settings, loadingDetalle }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const formatNum = formatCurrency;

  const tasa = parseFloat(invoice?.tasa_cambio_usada || settings?.tasa_dolar || 1);
  const toBs = (val) => (parseFloat(val || 0) * tasa);

  const getClienteNombre = () => {
    if (!invoice) return 'Consumidor Final';
    return invoice.cliente_nombre || invoice.cliente?.nombre || 'Consumidor Final';
  };

  const getIdentificacion = () => {
    if (!invoice) return null;
    return invoice.rnc_cedula || invoice.cliente?.rnc_cedula || invoice.cliente_id;
  };

  const getDireccionCliente = () => {
    if (!invoice) return null;
    return invoice.direccion || invoice.cliente_direccion || invoice.cliente?.direccion || null;
  };

  const getIVA = () => {
    if (!invoice) return 0;
    const ivaValue = parseFloat(invoice.itbis) || parseFloat(invoice.iva);
    if (!isNaN(ivaValue) && ivaValue > 0) return ivaValue;
    const sub = parseFloat(invoice.subtotal || 0);
    const tot = parseFloat(invoice.total || 0);
    return tot - sub > 0 ? tot - sub : 0;
  };

  return (
    <div className="no-print-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div id="printable-receipt" style={{
        backgroundColor: 'white', color: 'black', padding: '15px',
        width: '320px', 
        fontFamily: "'Courier New', Courier, monospace",
        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
      }}>
        
        {/* ENCABEZADO DEL NEGOCIO CON DATOS REALES */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: '0', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {settings?.nombre_empresa || 'BODEGON LA PARED'}
          </h2>
          <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
            <strong>RIF:</strong> {settings?.rnc_cedula || 'J-15823362-7'}
          </p>
          <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
            <strong>TELÉFONO:</strong> {settings?.telefono || '04267852360'}
          </p>
          <p style={{ margin: '2px 0', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            {settings?.direccion_fisica || 'CALLE SUCRE - CARIACO'}
          </p>
          <div style={{ borderBottom: '1px dashed #000', margin: '5px 0' }}></div>
        </div>

        {loadingDetalle ? (
          <p style={{ textAlign: 'center' }}>Cargando...</p>
        ) : invoice ? (
          <>
            <div style={{ fontSize: '0.8rem', marginBottom: '10px' }}>
              <div><strong>FAC:</strong> {invoice.numero_factura}</div>
              <div><strong>FECHA:</strong> {new Date(invoice.fecha || Date.now()).toLocaleString()}</div>
              <div style={{ borderBottom: '1px dashed #000', margin: '5px 0' }}></div>
              <div><strong>CLIENTE:</strong> {getClienteNombre()}</div>
              {getIdentificacion() && <div><strong>ID/CED:</strong> {getIdentificacion()}</div>}
              {(invoice.cliente_telefono || invoice.cliente?.telefono) && (
                <div><strong>TEL:</strong> {invoice.cliente_telefono || invoice.cliente?.telefono}</div>
              )}
              {getDireccionCliente() && (
                <div style={{ textTransform: 'uppercase' }}>
                  <strong>DIR:</strong> {getDireccionCliente()}
                </div>
              )}
              <div><strong>PAGO:</strong> {invoice.metodo_pago?.toUpperCase() || 'EFECTIVO'}</div>
              <div style={{ borderBottom: '1px dashed #000', margin: '5px 0' }}></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ textAlign: 'left' }}>CANT</th>
                  <th style={{ textAlign: 'left' }}>ITEM</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={i}>
                    <td>{formatQty(item.cantidad)}</td>
                    <td style={{ padding: '0 2px' }}>{item.producto_nombre || item.nombre}</td>
                    <td style={{ textAlign: 'right' }}>{formatNum(toBs(item.precio_unitario * item.cantidad))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '5px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SUBTOTAL:</span> <span>Bs. {formatNum(toBs(invoice.subtotal))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA ({settings?.itbis_tasa || 16}%):</span> <span>Bs. {formatNum(toBs(getIVA()))}</span>
              </div>
              {invoice?.igtf_monto > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#854d0e', fontWeight: '500' }}>
                  <span>IGTF ({settings?.igtf_tasa || 3}%):</span> <span>Bs. {formatNum(toBs(invoice.igtf_monto))}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '1px' }}>
                <span>TOTAL Bs:</span> <span>Bs. {formatNum(toBs(invoice.total))}</span>
              </div>

              {/* SECCIÓN DE REFERENCIA EN DÓLARES (AHORA COMO NOTA SECUNDARIA) */}
              <div style={{ borderTop: '1px solid #000', marginTop: '8px', paddingTop: '5px' }}>
                <div style={{ fontSize: '0.7rem', color: '#666', textAlign: 'center', marginBottom: '3px' }}>
                  TASA DE CAMBIO: Bs. {formatNum(tasa)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.9rem' }}>
                  <span>REF. USD:</span> 
                  <span>$ {formatNum(parseFloat(invoice.total))}</span>
                </div>
                <div style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '4px', fontStyle: 'italic' }}>
                  Monto expresado en moneda nacional según normativa vigente.
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.7rem' }}>
              <p>*** GRACIAS POR SU COMPRA ***</p>
              {settings?.tipo_impresora === 'fiscal' && (
                <p style={{ marginTop: '5px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                  -- COPIA - ORIGINAL EMITIDA POR IMPRESORA FISCAL --
                </p>
              )}
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'red' }}>Error en comprobante.</p>
        )}

        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '1.5rem' }}>
          <button 
            onClick={handlePrint} 
            style={{ flex: '1 1 120px', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
          >
            IMPRIMIR
          </button>
          
          <button 
            onClick={() => {
              const link = generateWhatsAppLink(invoice, settings);
              if (link) window.open(link, '_blank');
              else alert('Error al generar link de WhatsApp');
            }} 
            style={{ 
              flex: '1 1 200px', 
              padding: '10px', 
              backgroundColor: '#25D366', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer', 
              borderRadius: '4px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <MessageSquare size={18} />
            ENVIAR WHATSAPP
          </button>

          <button 
            onClick={onClose} 
            style={{ flex: '1 1 120px', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
          >
            CERRAR
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt {
            position: absolute; left: 0; top: 0;
            width: 80mm !important; margin: 0; padding: 4mm;
            box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;