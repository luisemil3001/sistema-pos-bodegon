const pool = require('../config/db');

// Obtener estadísticas rápidas (KPIs)
const getStats = async (req, res) => {
    try {
        const hoy = new Date().toISOString().slice(0, 10);
        
        // Ventas de hoy
        const [hoyRows] = await pool.query('SELECT SUM(total) as total, COUNT(*) as count FROM facturas WHERE DATE(fecha) = ? AND estado != "anulada"', [hoy]);
        
        // Ventas del mes
        const inicioMes = new Date();
        inicioMes.setDate(1);
        const inicioMesStr = inicioMes.toISOString().slice(0, 10);
        const [mesRows] = await pool.query('SELECT SUM(total) as total FROM facturas WHERE DATE(fecha) >= ? AND estado != "anulada"', [inicioMesStr]);
        
        // Clientes totales
        const [clienteRows] = await pool.query('SELECT COUNT(*) as count FROM clientes');
        
        // Obtener margen de vencimiento
        const [empresaRows] = await pool.query('SELECT margen_vencimiento FROM empresas LIMIT 1');
        const margen = empresaRows[0]?.margen_vencimiento || 30;

        // Productos con bajo stock (< 5 unidades)
        const [stockRows] = await pool.query('SELECT COUNT(*) as count FROM productos WHERE stock < 5');

        // Productos vencidos o por vencer (Próximos X días configurables)
        const [vencRows] = await pool.query('SELECT COUNT(*) as count FROM productos WHERE fecha_vencimiento IS NOT NULL AND fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)', [margen]);

        res.json({
            hoy: {
                total: parseFloat(hoyRows[0].total || 0),
                cantidad: hoyRows[0].count,
                promedio: hoyRows[0].count > 0 ? (parseFloat(hoyRows[0].total) / hoyRows[0].count) : 0
            },
            mes: {
                total: parseFloat(mesRows[0].total || 0)
            },
            clientes: clienteRows[0].count,
            alerta_stock: stockRows[0].count,
            alerta_vencimiento: vencRows[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

// Obtener datos para gráficos
const getCharts = async (req, res) => {
    try {
        // Ventas últimos 7 días
        const [ventasSemanales] = await pool.query(`
            SELECT DATE(fecha) as fecha, SUM(total) as total 
            FROM facturas 
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND estado != "anulada"
            GROUP BY DATE(fecha)
            ORDER BY DATE(fecha) ASC
        `);

        // Ventas por categoría (Top 5)
        const [ventasCategorias] = await pool.query(`
            SELECT COALESCE(cat.nombre, 'Sin Categoría') as categoria, SUM(i.subtotal) as total
            FROM factura_items i
            JOIN facturas f ON i.factura_id = f.id
            JOIN productos p ON i.producto_id = p.id
            LEFT JOIN categorias cat ON p.categoria_id = cat.id
            WHERE f.estado != "anulada"
            GROUP BY COALESCE(cat.nombre, 'Sin Categoría')
            ORDER BY total DESC
            LIMIT 5
        `);

        res.json({
            semanal: ventasSemanales,
            categorias: ventasCategorias
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener datos de gráficos' });
    }
};

// Top 5 productos más vendidos
const getTopProducts = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.nombre, SUM(i.cantidad) as cantidad, SUM(i.subtotal) as total
            FROM factura_items i
            JOIN facturas f ON i.factura_id = f.id
            JOIN productos p ON i.producto_id = p.id
            WHERE f.estado != "anulada"
            GROUP BY p.id
            ORDER BY cantidad DESC
            LIMIT 5
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener productos estrella' });
    }
};

module.exports = { getStats, getCharts, getTopProducts };
