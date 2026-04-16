import { formatCurrency } from './format';

export const generateWhatsAppLink = (invoice, settings) => {
  if (!invoice) return null;

  const getClienteNombre = () => {
    return invoice.cliente_nombre || invoice.cliente?.nombre || 'Cliente';
  };

  const formatNum = formatCurrency;

  const tasa = parseFloat(invoice.tasa_cambio_usada || settings?.tasa_dolar || 1);
  const toBs = (val) => formatNum(parseFloat(val || 0) * tasa);

  const businessName = settings?.nombre_empresa || 'BODEGON LA PARED';
  
  // Construcción del mensaje
  let message = `*${businessName}*\n`;
  message += `¡Hola, *${getClienteNombre()}*! 👋\n\n`;
  
  if (invoice.numero_cotizacion) {
    message += `Te enviamos tu *Cotización #${invoice.numero_cotizacion}*:\n`;
  } else {
    message += `Aquí tienes el resumen de tu *Factura #${invoice.numero_factura}*:\n`;
  }
  
  message += `--------------------------\n`;
  
  // Items
  invoice.items?.forEach(item => {
    const qty = parseFloat(item.cantidad);
    const name = item.producto_nombre || item.nombre || 'Producto';
    const subBs = toBs(item.precio_unitario * item.cantidad);
    message += `• ${qty}x ${name} - *${subBs}*\n`;
  });
  
  message += `--------------------------\n`;
  message += `*TOTAL A PAGAR: Bs. ${toBs(invoice.total)}*\n`;
  message += `_(Ref. USD: $${formatNum(invoice.total)} a tasa Bs. ${formatNum(tasa)})_\n\n`;
  
  message += `Gracias por preferirnos. ✨`;

  // Codificar el mensaje para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Si tenemos el teléfono del cliente, lo incluimos (eliminando caracteres no numéricos)
  const phone = invoice.cliente_telefono || invoice.cliente?.telefono || "";
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Si el teléfono no tiene código de país, asumimos Venezuela (+58) 
  // Opcional: Esto depende de la configuración del usuario
  const finalPhone = cleanPhone.length === 10 || cleanPhone.length === 11 
    ? `58${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`
    : cleanPhone;

  // Usaremos directamente web.whatsapp.com para evitar que el navegador
  // intente ejecutar el protocolo 'whatsapp://' a nivel de Windows, lo cual
  // causa el error de "Aplicación no asociada" si no está instalado el programa en la PC.
  const phoneParam = finalPhone ? `phone=${finalPhone}&` : "";
  return `https://web.whatsapp.com/send?${phoneParam}text=${encodedMessage}`;
};
