const pool = require('../config/db');

// Libro de Ventas
const getLibroVentas = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query; 
  
  if (!fechaInicio || !fechaFin) return res.status(400).json({ error: 'Debe especificar fecha de inicio y fin' });

  try {
    const query = `
      SELECT 
        f.fecha, 
        f.numero_factura, 
        c.nombre as cliente_nombre, 
        c.rnc_cedula,
        f.subtotal as base_imponible, 
        f.itbis as iva_retenido, 
        f.total,
        f.estado
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE DATE(f.fecha) >= ? AND DATE(f.fecha) <= ?
      ORDER BY f.fecha ASC
    `;
    const [rows] = await pool.query(query, [fechaInicio, fechaFin]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar libro de ventas' });
  }
};

// Libro de Compras
const getLibroCompras = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  
  if (!fechaInicio || !fechaFin) return res.status(400).json({ error: 'Debe especificar fecha de inicio y fin' });

  try {
    const query = `
      SELECT 
        c.fecha, 
        c.numero_factura_proveedor, 
        p.nombre as proveedor_nombre, 
        p.rnc_cedula, 
        c.subtotal as base_imponible, 
        c.itbis as iva_soportado, 
        c.total
      FROM compras c
      LEFT JOIN proveedores p ON c.proveedor_id = p.id
      WHERE DATE(c.fecha) >= ? AND DATE(c.fecha) <= ?
      ORDER BY c.fecha ASC
    `;
    const [rows] = await pool.query(query, [fechaInicio, fechaFin]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar libro de compras' });
  }
};

// Resumen de IVA (Créditos vs Débitos)
const getResumenIva = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  
  if (!fechaInicio || !fechaFin) return res.status(400).json({ error: 'Debe especificar fecha de inicio y fin' });

  try {
    // Total IVA de Ventas (Débito Fiscal)
    const [ventas] = await pool.query(`
      SELECT SUM(itbis) as debito_fiscal, SUM(subtotal) as total_ventas 
      FROM facturas 
      WHERE DATE(fecha) >= ? AND DATE(fecha) <= ? AND estado = 'pagada'
    `, [fechaInicio, fechaFin]);

    // Total IVA de Compras (Crédito Fiscal)
    const [compras] = await pool.query(`
      SELECT SUM(itbis) as credito_fiscal, SUM(subtotal) as total_compras 
      FROM compras 
      WHERE DATE(fecha) >= ? AND DATE(fecha) <= ?
    `, [fechaInicio, fechaFin]);

    const debito = ventas[0].debito_fiscal || 0;
    const credito = compras[0].credito_fiscal || 0;

    res.json({
      fechaInicio,
      fechaFin,
      total_ventas_base: ventas[0].total_ventas || 0,
      total_compras_base: compras[0].total_compras || 0,
      debito_fiscal: debito,
      credito_fiscal: credito,
      cuota_tributaria: debito - credito // Si es positivo, pagar a hacienda. Si es negativo, a favor.
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar resumen de IVA' });
  }
};

module.exports = { getLibroVentas, getLibroCompras, getResumenIva };
