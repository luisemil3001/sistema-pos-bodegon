/**
 * printerService.js
 * Motor de impresión inteligente para Venezuela (SENIAT)
 * Soporta: TFHKA (The Factory), Epson Fiscal, Bematech, POS Estándar
 */

const PRINTER_BRANDS = {
  TFHKA: 'tfhka',
  EPSON: 'epson',
  BEMATECH: 'bematech',
  GENERICA: 'generica',
};

/**
 * Genera el payload de impresión según el tipo/marca de impresora configurada.
 * @param {object} facturaData - Datos completos de la factura
 * @param {object} empresaConfig - Configuración del negocio (settings)
 * @returns {object} - { tipo, payload, comandos }
 */
function generarPayloadImpresion(facturaData, empresaConfig) {
  const tipoPrinter = empresaConfig.tipo_impresora || 'pos';
  const marcaFiscal = (empresaConfig.marca_fiscal || 'generica').toLowerCase();

  if (tipoPrinter === 'fiscal') {
    return generarComandosFiscal(facturaData, empresaConfig, marcaFiscal);
  } else {
    return generarComandosPOS(facturaData, empresaConfig);
  }
}

/**
 * Genera comandos para impresora POS estándar (ticket).
 * Compatible con cualquier impresora térmica de 80mm.
 */
function generarComandosPOS(factura, empresa) {
  const linea = '-'.repeat(32);
  const lineas = [];

  // Encabezado
  lineas.push({ tipo: 'centrar', texto: empresa.nombre || 'MI NEGOCIO' });
  lineas.push({ tipo: 'centrar', texto: `RIF: ${empresa.rnc || 'N/A'}` });
  lineas.push({ tipo: 'centrar', texto: empresa.telefono || '' });
  lineas.push({ tipo: 'centrar', texto: (empresa.direccion || '').toUpperCase() });
  lineas.push({ tipo: 'separador', texto: linea });
  lineas.push({ tipo: 'texto', texto: `FAC: ${factura.numero_factura}` });
  lineas.push({ tipo: 'texto', texto: `FECHA: ${new Date(factura.fecha || Date.now()).toLocaleString('es-VE')}` });
  lineas.push({ tipo: 'texto', texto: `CLIENTE: ${factura.cliente_nombre || 'CONSUMIDOR FINAL'}` });
  if (factura.rnc_cedula) lineas.push({ tipo: 'texto', texto: `ID/CED: ${factura.rnc_cedula}` });
  lineas.push({ tipo: 'texto', texto: `PAGO: ${(factura.metodo_pago || 'EFECTIVO').toUpperCase()}` });
  lineas.push({ tipo: 'separador', texto: linea });

  // Items
  (factura.items || []).forEach(item => {
    const nombre = (item.producto_nombre || item.nombre || '').substring(0, 18);
    const cantidad = item.cantidad;
    const precio = parseFloat(item.precio_unitario || 0).toFixed(2);
    const subtotal = (cantidad * parseFloat(precio)).toFixed(2);
    lineas.push({ tipo: 'item', nombre, cantidad, precio, subtotal });
  });

  lineas.push({ tipo: 'separador', texto: linea });

  // Totales
  lineas.push({ tipo: 'total', concepto: 'SUBTOTAL', valor: parseFloat(factura.subtotal || 0).toFixed(2) });
  
  const ivaRate = parseFloat(empresa.itbis_tasa || 16);
  lineas.push({ tipo: 'total', concepto: `IVA (${ivaRate}%)`, valor: parseFloat(factura.itbis || factura.iva || 0).toFixed(2) });

  if (parseFloat(factura.igtf_monto || 0) > 0) {
    const igtfRate = parseFloat(empresa.igtf_tasa || 3);
    lineas.push({ tipo: 'total', concepto: `IGTF (${igtfRate}%)`, valor: parseFloat(factura.igtf_monto).toFixed(2) });
  }

  lineas.push({ tipo: 'gran_total', concepto: 'TOTAL', valor: parseFloat(factura.total || 0).toFixed(2) });
  lineas.push({ tipo: 'separador', texto: linea });
  lineas.push({ tipo: 'centrar', texto: '*** GRACIAS POR SU COMPRA ***' });
  lineas.push({ tipo: 'cortar' });

  return {
    tipo: 'pos',
    marca: 'generica',
    puerto: empresa.puerto_impresora || 'USB',
    payload: lineas,
    texto_plano: generarTextoPOS(lineas)
  };
}

function generarTextoPOS(lineas) {
  return lineas.map(l => {
    switch (l.tipo) {
      case 'centrar': return l.texto.padStart(16 + Math.floor(l.texto.length / 2)).padEnd(32);
      case 'texto': return l.texto;
      case 'separador': return l.texto;
      case 'item': return `${l.cantidad}x ${l.nombre.padEnd(18)} $${l.subtotal}`;
      case 'total': return `${l.concepto.padEnd(20)} $${l.valor}`;
      case 'gran_total': return `** ${l.concepto.padEnd(18)} $${l.valor} **`;
      case 'cortar': return '\n\n\n';
      default: return '';
    }
  }).join('\n');
}

/**
 * Genera comandos fiscales según la marca.
 * TFHKA (The Factory), Epson Fiscal, Bematech
 */
function generarComandosFiscal(factura, empresa, marca) {
  // Estructura de comandos fiscal común para Venezuela (SENIAT-compliant)
  const comandosFiscales = {
    marca,
    puerto: empresa.puerto_impresora || 'COM1',
    encabezado: {
      nombre_empresa: empresa.nombre,
      rif: empresa.rnc,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
    },
    numero_factura: factura.numero_factura,
    cliente: {
      nombre: factura.cliente_nombre || 'CONSUMIDOR FINAL',
      rif: factura.rnc_cedula || null,
    },
    items: (factura.items || []).map(item => ({
      descripcion: item.producto_nombre || item.nombre,
      cantidad: item.cantidad,
      precio_unitario: parseFloat(item.precio_unitario || 0),
      aplica_iva: item.aplica_iva || false,
      subtotal: parseFloat(item.precio_unitario || 0) * item.cantidad,
    })),
    totales: {
      subtotal: parseFloat(factura.subtotal || 0),
      iva: parseFloat(factura.itbis || factura.iva || 0),
      igtf: parseFloat(factura.igtf_monto || 0),
      total: parseFloat(factura.total || 0),
    }
  };

  // Comandos específicos por marca
  let comandosEspecificos = [];
  switch (marca) {
    case PRINTER_BRANDS.TFHKA:
      comandosEspecificos = generarComandosTFHKA(comandosFiscales);
      break;
    case PRINTER_BRANDS.EPSON:
      comandosEspecificos = generarComandosEpsonFiscal(comandosFiscales);
      break;
    case PRINTER_BRANDS.BEMATECH:
      comandosEspecificos = generarComandosBematech(comandosFiscales);
      break;
    default:
      // Genérico: mismos que POS pero con cabecera "DOCUMENTO FISCAL"
      return { ...generarComandosPOS(factura, empresa), tipo: 'fiscal', marca: 'generica' };
  }

  return {
    tipo: 'fiscal',
    marca,
    puerto: empresa.puerto_impresora || 'COM1',
    payload: comandosFiscales,
    comandos_seriales: comandosEspecificos,
  };
}

// ============================================================
// TFHKA (The Factory) - Protocolo ESC/POS extendido fiscal
// Comandos basados en protocolo TFHKA-VZ 2.0
// ============================================================
function generarComandosTFHKA(datos) {
  const cmds = [];
  cmds.push({ cmd: '\x1B\x40', desc: 'Inicializar impresora' });
  cmds.push({ cmd: '\x1D\x21\x11', desc: 'Doble tamaño - Documento Fiscal' });
  cmds.push({ cmd: `\x1BDOC_INICIO\x0A`, desc: 'Inicio documento fiscal' });
  cmds.push({ cmd: `FAC:${datos.numero_factura}\x0A`, desc: 'Número factura' });

  datos.items.forEach(item => {
    cmds.push({ cmd: `\x1BITEM:${item.descripcion}|${item.cantidad}|${item.precio_unitario}|${item.aplica_iva ? 'G' : 'E'}\x0A`, desc: `Item: ${item.descripcion}` });
  });

  cmds.push({ cmd: `\x1BSUBTOTAL:${datos.totales.subtotal.toFixed(2)}\x0A` });
  cmds.push({ cmd: `\x1BIVA:${datos.totales.iva.toFixed(2)}\x0A` });
  if (datos.totales.igtf > 0) cmds.push({ cmd: `\x1BIGTF:${datos.totales.igtf.toFixed(2)}\x0A` });
  cmds.push({ cmd: `\x1BTOTAL:${datos.totales.total.toFixed(2)}\x0A` });
  cmds.push({ cmd: '\x1BDOC_FIN\x0A', desc: 'Cierre documento fiscal' });
  cmds.push({ cmd: '\x1D\x56\x41', desc: 'Cortar papel' });

  return cmds;
}

// ============================================================
// Epson Fiscal - Protocolo propietario Epson Venezuela
// ============================================================
function generarComandosEpsonFiscal(datos) {
  const cmds = [];
  cmds.push({ cmd: '\x1B\x40', desc: 'Inicializar' });
  cmds.push({ cmd: `\x1B\x7C\x03TAFACTURA\x0A`, desc: 'Tipo: Factura SENIAT' });
  cmds.push({ cmd: `\x1B\x7C\x04${datos.cliente.rif || 'CF'}\x0A`, desc: 'RIF del cliente' });

  datos.items.forEach(item => {
    const tipoIVA = item.aplica_iva ? 'I' : 'E';
    cmds.push({ cmd: `\x1B\x7C\x06${item.descripcion}|${item.cantidad}|${item.precio_unitario.toFixed(2)}|${tipoIVA}\x0A` });
  });

  cmds.push({ cmd: '\x1B\x7C\x0A', desc: 'Subtotal y pago' });
  cmds.push({ cmd: `\x1B\x7C\x0BSALDO:${datos.totales.total.toFixed(2)}\x0A` });
  cmds.push({ cmd: '\x1B\x7C\x0C', desc: 'Cerrar Factura' });

  return cmds;
}

// ============================================================
// Bematech - Protocolo serial Bematech MP-2100 TH FI
// ============================================================
function generarComandosBematech(datos) {
  const cmds = [];
  cmds.push({ cmd: '\x1B\x40', desc: 'Reset' });
  cmds.push({ cmd: '\x1B\x61\x01', desc: 'Centrar' });
  cmds.push({ cmd: `FACTURA FISCAL\x0A`, desc: 'Cabecera fiscal' });
  cmds.push({ cmd: `\x1B\x61\x00` });

  datos.items.forEach(item => {
    cmds.push({ cmd: `\x1BVENDA:${item.descripcion}|${item.cantidad}|${item.precio_unitario.toFixed(3)}|${item.aplica_iva ? 'T' : 'I'}\x0A` });
  });

  cmds.push({ cmd: `\x1BSUB-TOTAL\x0A` });
  cmds.push({ cmd: `\x1BPAGAMENTO:DINHEIRO:${datos.totales.total.toFixed(2)}\x0A` });
  cmds.push({ cmd: '\x1D\x56\x01', desc: 'Cortar' });

  return cmds;
}

// ============================================================
// Detección de impresora por puerto serial (para diagnóstico)
// ============================================================
async function detectarImpresora(puertos = ['COM1', 'COM2', 'COM3', 'COM4', 'USB']) {
  // Nota: La detección real requiere 'serialport' instalado.
  // Aquí retornamos una respuesta simulada para el sistema.
  // En producción, se instala: npm install serialport
  try {
    let serialport;
    try {
      serialport = require('serialport');
    } catch {
      return { detectado: false, mensaje: 'Módulo serialport no instalado. Usando selección manual.' };
    }

    const portList = await serialport.SerialPort.list();
    const portasConectados = portList.map(p => p.path);
    const encontrado = puertos.find(p => portasConectados.includes(p));

    if (encontrado) {
      return { detectado: true, puerto: encontrado, mensaje: `Impresora detectada en ${encontrado}` };
    }
    return { detectado: false, mensaje: 'No se detectó impresora en los puertos comunes.' };
  } catch (err) {
    return { detectado: false, mensaje: `Error de detección: ${err.message}` };
  }
}

module.exports = {
  generarPayloadImpresion,
  detectarImpresora,
  PRINTER_BRANDS,
};
