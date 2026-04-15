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
        f.tasa_cambio_usada,
        (f.subtotal * f.tasa_cambio_usada) as base_imponible_bs,
        (f.itbis * f.tasa_cambio_usada) as iva_retenido_bs,
        (f.total * f.tasa_cambio_usada) as total_bs,
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
        c.total,
        c.tasa_cambio,
        (c.subtotal * c.tasa_cambio) as base_imponible_bs,
        (c.itbis * c.tasa_cambio) as iva_soportado_bs,
        (c.total * c.tasa_cambio) as total_bs
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
      SELECT 
        SUM(itbis) as debito_fiscal, 
        SUM(subtotal) as total_ventas,
        SUM(itbis * tasa_cambio_usada) as debito_fiscal_bs,
        SUM(subtotal * tasa_cambio_usada) as total_ventas_bs
      FROM facturas 
      WHERE DATE(fecha) >= ? AND DATE(fecha) <= ? AND estado = 'pagada'
    `, [fechaInicio, fechaFin]);

    // Total IVA de Compras (Crédito Fiscal)
    const [compras] = await pool.query(`
      SELECT 
        SUM(itbis) as credito_fiscal, 
        SUM(subtotal) as total_compras,
        SUM(itbis * tasa_cambio) as credito_fiscal_bs,
        SUM(subtotal * tasa_cambio) as total_compras_bs
      FROM compras 
      WHERE DATE(fecha) >= ? AND DATE(fecha) <= ?
    `, [fechaInicio, fechaFin]);

    const debito = ventas[0].debito_fiscal || 0;
    const credito = compras[0].credito_fiscal || 0;
    const debito_bs = ventas[0].debito_fiscal_bs || 0;
    const credito_bs = compras[0].credito_fiscal_bs || 0;

    res.json({
      fechaInicio,
      fechaFin,
      total_ventas_base: ventas[0].total_ventas || 0,
      total_compras_base: compras[0].total_compras || 0,
      total_ventas_base_bs: ventas[0].total_ventas_bs || 0,
      total_compras_base_bs: ventas[0].total_compras_bs || 0,
      debito_fiscal: debito,
      credito_fiscal: credito,
      debito_fiscal_bs: debito_bs,
      credito_fiscal_bs: credito_bs,
      cuota_tributaria: debito - credito,
      cuota_tributaria_bs: debito_bs - credito_bs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar resumen de IVA' });
  }
};

module.exports = { getLibroVentas, getLibroCompras, getResumenIva };
