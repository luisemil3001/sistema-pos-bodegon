import React from 'react';

const ReceiptModal = ({ isOpen, onClose, invoice, settings, loadingDetalle }) => {
  if (!isOpen) return null;

  const handlePrint = () => { window.print(); };

  const formatNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? "0.00" : n.toFixed(2);
  };

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
                    <td>{item.cantidad}</td>
                    <td style={{ padding: '0 2px' }}>{item.producto_nombre || item.nombre}</td>
                    <td style={{ textAlign: 'right' }}>${formatNum(item.precio_unitario * item.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '5px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SUBTOTAL:</span> <span>${formatNum(invoice.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA (16%):</span> <span>${formatNum(getIVA())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem' }}>
                <span>TOTAL:</span> <span>${formatNum(invoice.total)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.7rem' }}>
              <p>*** GRACIAS POR SU COMPRA ***</p>
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'red' }}>Error en comprobante.</p>
        )}

        <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
          <button onClick={handlePrint} style={{ flex: 1, padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>IMPRIMIR</button>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>CERRAR</button>
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