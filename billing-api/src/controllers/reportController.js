const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 19).replace('T', ' ');
    
    // 1. Ventas del día actual
    const [ventasDiaRes] = await pool.query(
      'SELECT IFNULL(SUM(total), 0) as total_ventas, IFNULL(SUM(total * tasa_cambio_usada), 0) as total_bs, COUNT(id) as cantidad_facturas FROM facturas WHERE fecha >= ?',
      [todayStart]
    );

    // 2. Ventas del mes actual
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const [ventasMesRes] = await pool.query(
      'SELECT IFNULL(SUM(total), 0) as total_ventas, IFNULL(SUM(total * tasa_cambio_usada), 0) as total_bs FROM facturas WHERE fecha >= ?',
      [monthStart]
    );

    // 3. Productos con bajo stock
    const [bajoStockRes] = await pool.query(
      'SELECT id, nombre, stock, min_stock FROM productos WHERE stock <= min_stock ORDER BY stock ASC LIMIT 10'
    );

    // 4. Últimas 5 facturas
    const [ultimasFacturas] = await pool.query(
      'SELECT numero_factura, total, (total * tasa_cambio_usada) as total_bs, fecha, tasa_cambio_usada FROM facturas ORDER BY fecha DESC LIMIT 5'
    );

    res.json({
      ventas_hoy: {
        total: parseFloat(ventasDiaRes[0].total_ventas),
        total_bs: parseFloat(ventasDiaRes[0].total_bs),
        cantidad: ventasDiaRes[0].cantidad_facturas
      },
      ventas_mes: {
        total: parseFloat(ventasMesRes[0].total_ventas),
        total_bs: parseFloat(ventasMesRes[0].total_bs)
      },
      alertas_stock: bajoStockRes,
      actividad_reciente: ultimasFacturas
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
  }
};

// Historial de cierres de caja (Arqueos)
const getAuditShifts = async (req, res) => {
  const { startDate, endDate, estacionId } = req.query;
  try {
    let query = `
      SELECT c.*, u.nombre as usuario_nombre, e.nombre as estacion_nombre 
      FROM cajas c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN estaciones_trabajo e ON c.estacion_id = e.id
      WHERE c.estado = 'cerrada'
    `;
    const params = [];

    if (startDate && endDate) {
      query += ` AND c.fecha_apertura BETWEEN ? AND ? `;
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    if (estacionId) {
      query += ` AND c.estacion_id = ? `;
      params.push(estacionId);
    }

    query += ` ORDER BY c.fecha_cierre DESC `;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial de arqueos' });
  }
};

// Historial de ajustes de inventario
const getAuditAdjustments = async (req, res) => {
  try {
    const query = `
      SELECT a.*, p.nombre as producto_nombre, u.nombre as usuario_nombre 
      FROM ajustes_stock a
      JOIN productos p ON a.producto_id = p.id
      JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY a.fecha DESC LIMIT 100
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener ajustes de auditoría' });
  }
};

// Reporte de ventas por producto
const getSalesByProduct = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let query = `
      SELECT p.nombre, p.codigo, SUM(di.cantidad) as cantidad_vendida, 
             SUM(di.total) as total_venta_usd, SUM(di.total * f.tasa_cambio_usada) as total_venta_bs
      FROM detalle_facturas di
      JOIN productos p ON di.producto_id = p.id
      JOIN facturas f ON di.factura_id = f.id
      WHERE f.estado = 'activa'
    `;
    const params = [];

    if (startDate && endDate) {
      query += ` AND f.fecha BETWEEN ? AND ? `;
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    query += ` GROUP BY p.id, p.nombre, p.codigo ORDER BY cantidad_vendida DESC LIMIT 50 `;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener ventas por producto' });
  }
};

// Reporte de clientes más activos
const getTopCustomers = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let query = `
      SELECT c.nombre, c.rnc, COUNT(f.id) as cantidad_facturas, 
             SUM(f.total) as total_compras_usd, SUM(f.total * f.tasa_cambio_usada) as total_compras_bs
      FROM clientes c
      JOIN facturas f ON c.id = f.cliente_id
      WHERE f.estado = 'activa'
    `;
    const params = [];

    if (startDate && endDate) {
      query += ` AND f.fecha BETWEEN ? AND ? `;
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    query += ` GROUP BY c.id, c.nombre, c.rnc ORDER BY total_compras_usd DESC LIMIT 20 `;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener clientes más activos' });
  }
};

// Reporte de inventario detallado
const getInventoryReport = async (req, res) => {
  try {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre,
             (p.stock * p.precio_venta) as valor_inventario_usd,
             CASE WHEN p.stock <= p.min_stock THEN 'Bajo' ELSE 'Normal' END as estado_stock
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.stock ASC, p.nombre ASC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte de inventario' });
  }
};

// Reporte de movimientos de caja
const getCashMovements = async (req, res) => {
  const { startDate, endDate, cajaId } = req.query;
  try {
    let query = `
      SELECT c.*, u.nombre as usuario_nombre, e.nombre as estacion_nombre,
             TIMESTAMPDIFF(MINUTE, c.fecha_apertura, c.fecha_cierre) as duracion_minutos
      FROM cajas c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN estaciones_trabajo e ON c.estacion_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate && endDate) {
      query += ` AND c.fecha_apertura BETWEEN ? AND ? `;
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    if (cajaId) {
      query += ` AND c.id = ? `;
      params.push(cajaId);
    }

    query += ` ORDER BY c.fecha_apertura DESC `;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener movimientos de caja' });
  }
};

module.exports = { 
  getDashboardStats, 
  getAuditShifts, 
  getAuditAdjustments,
  getSalesByProduct,
  getTopCustomers,
  getInventoryReport,
  getCashMovements
};
