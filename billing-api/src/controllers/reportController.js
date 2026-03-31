const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 19).replace('T', ' ');
    
    // 1. Ventas del día actual
    const [ventasDiaRes] = await pool.query(
      'SELECT IFNULL(SUM(total), 0) as total_ventas, COUNT(id) as cantidad_facturas FROM facturas WHERE fecha >= ?',
      [todayStart]
    );

    // 2. Ventas del mes actual
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const [ventasMesRes] = await pool.query(
      'SELECT IFNULL(SUM(total), 0) as total_ventas FROM facturas WHERE fecha >= ?',
      [monthStart]
    );

    // 3. Productos con bajo stock
    const [bajoStockRes] = await pool.query(
      'SELECT id, nombre, stock, min_stock FROM productos WHERE stock <= min_stock ORDER BY stock ASC LIMIT 10'
    );

    // 4. Últimas 5 facturas
    const [ultimasFacturas] = await pool.query(
      'SELECT numero_factura, total, fecha FROM facturas ORDER BY fecha DESC LIMIT 5'
    );

    res.json({
      ventas_hoy: {
        total: parseFloat(ventasDiaRes[0].total_ventas),
        cantidad: ventasDiaRes[0].cantidad_facturas
      },
      ventas_mes: {
        total: parseFloat(ventasMesRes[0].total_ventas)
      },
      alertas_stock: bajoStockRes,
      actividad_reciente: ultimasFacturas
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
  }
};

module.exports = { getDashboardStats };
