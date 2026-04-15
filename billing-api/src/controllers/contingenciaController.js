const pool = require('../config/db');
const contingenciaService = require('../services/contingenciaService');

/**
 * Endpoint para verificar estado de conexión a la base de datos central.
 */
const checkStatus = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    const pendingCount = contingenciaService.obtenerVentasPendientes().length;
    res.json({ connected: true, pending_sync: pendingCount });
  } catch (err) {
    res.json({ connected: false, pending_sync: contingenciaService.obtenerVentasPendientes().length });
  }
};

/**
 * Sincroniza las ventas locales hacia la base de datos central.
 */
const syncSales = async (req, res) => {
  const connection = await pool.getConnection();
  const sales = contingenciaService.obtenerVentasPendientes();

  if (sales.length === 0) {
    connection.release();
    return res.json({ success: true, message: 'No hay ventas pendientes' });
  }

  try {
    await connection.beginTransaction();
    console.log(`[SYNC] Iniciando sincronización de ${sales.length} ventas...`);

    for (const sale of sales) {
      // 1. Insertar Factura
      // Usamos una lógica similar a invoiceController pero adaptada
      const [facturaResult] = await connection.query(
        `INSERT INTO facturas 
        (numero_factura, cliente_id, usuario_id, caja_id, subtotal, itbis, total, metodo_pago, estado, fecha) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sale.numero_factura, 
          sale.cliente_id || null, 
          sale.usuario_id || 1, 
          sale.caja_id || 1, 
          sale.subtotal, 
          sale.itbis, 
          sale.total, 
          sale.metodo_pago, 
          'offline_sync',
          new Date(sale.offline_at)
        ]
      );

      const facturaId = facturaResult.insertId;

      // 2. Insertar Items e impactar Stock
      for (const item of sale.items) {
        await connection.query(
          `INSERT INTO factura_items (factura_id, producto_id, cantidad, precio_unitario, subtotal) 
          VALUES (?, ?, ?, ?, ?)`,
          [facturaId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
        );

        // Descontar stock
        await connection.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.producto_id]);
      }
    }

    await connection.commit();
    contingenciaService.limpiarColaOffline();
    
    res.json({ success: true, message: `Se sincronizaron ${sales.length} ventas correctamente.` });

  } catch (err) {
    await connection.rollback();
    console.error('[SYNC] Error durante sincronización:', err);
    res.status(500).json({ error: 'Error durante la sincronización de datos' });
  } finally {
    connection.release();
  }
};

module.exports = { checkStatus, syncSales };
