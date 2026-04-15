const fs = require('fs');
const path = require('path');

// Directorio para guardar archivos de contingencia (fuera de la carpeta builds de ser posible)
const OFFLINE_DIR = path.join(process.cwd(), 'offline_storage');
const SALES_FILE = path.join(OFFLINE_DIR, 'offline_sales.json');
const CACHE_FILE = path.join(OFFLINE_DIR, 'products_cache.json');

// Asegurar que el directorio existe
if (!fs.existsSync(OFFLINE_DIR)) {
  fs.mkdirSync(OFFLINE_DIR, { recursive: true });
}

/**
 * Guarda una venta en la cola local de contingencia.
 * @param {object} saleData - Datos completos de la factura
 */
function guardarVentaOffline(saleData) {
  try {
    let sales = [];
    if (fs.existsSync(SALES_FILE)) {
      const content = fs.readFileSync(SALES_FILE, 'utf8');
      sales = JSON.parse(content || '[]');
    }
    
    // Añadimos metadata de contingencia
    const offlineRecord = {
      ...saleData,
      offline_at: new Date().toISOString(),
      sync_status: 'pending'
    };
    
    sales.push(offlineRecord);
    fs.writeFileSync(SALES_FILE, JSON.stringify(sales, null, 2));
    
    console.log(`[CONTINGENCIA] Venta guardada localmente: ${saleData.numero_factura || 'S/N'}`);
    return { success: true, offline: true };
  } catch (error) {
    console.error('[CONTINGENCIA] Error guardando venta local:', error);
    return { success: false, error: 'Error guardando en contingencia' };
  }
}

/**
 * Obtener todas las ventas pendientes de sincronización.
 */
function obtenerVentasPendientes() {
  if (!fs.existsSync(SALES_FILE)) return [];
  try {
    const content = fs.readFileSync(SALES_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

/**
 * Limpiar la cola de ventas tras una sincronización exitosa.
 */
function limpiarColaOffline() {
  try {
    fs.writeFileSync(SALES_FILE, JSON.stringify([], null, 2));
    return true;
  } catch (error) {
    console.error('[CONTINGENCIA] Error limpiando cola:', error);
    return false;
  }
}

/**
 * Guarda una copia de los productos para consulta offline.
 */
function actualizarCacheProductos(productos) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(productos, null, 2));
  } catch (error) {
    console.error('[CONTINGENCIA] Error actualizando cache:', error);
  }
}

/**
 * Lee los productos desde la cache local.
 */
function obtenerProductosCache() {
  if (!fs.existsSync(CACHE_FILE)) return [];
  try {
    const content = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

/**
 * Verifica si un error de base de datos es por falta de conexión.
 */
function esErrorDeConexion(error) {
  const codes = ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ENOTFOUND'];
  return error && (codes.includes(error.code) || error.message?.includes('connect'));
}

module.exports = {
  guardarVentaOffline,
  obtenerVentasPendientes,
  limpiarColaOffline,
  actualizarCacheProductos,
  obtenerProductosCache,
  esErrorDeConexion
};
