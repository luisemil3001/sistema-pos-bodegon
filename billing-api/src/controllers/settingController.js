const pool = require('../config/db');

// Obtener configuración del negocio (ej. Tasa de IVA)
const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM empresas LIMIT 1');
    if (rows.length === 0) return res.status(404).json({ error: 'Configuración no encontrada' });
    
    const data = rows[0];
    res.json({ ...data, nombre_empresa: data.nombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la configuración' });
  }
};

// Actualizar configuración del negocio
const updateSettings = async (req, res) => {
  const { nombre_empresa, rnc, direccion, telefono, email, itbis_tasa, tipo_impresora, margen_vencimiento } = req.body;
  
  try {
    const [result] = await pool.query(
      `UPDATE empresas SET 
      nombre = ?, rnc = ?, direccion = ?, telefono = ?, email = ?, 
      itbis_tasa = ?, tipo_impresora = ?, margen_vencimiento = ? 
      WHERE id = 1`,
      [nombre_empresa, rnc || null, direccion || null, telefono || null, email || null, itbis_tasa || 16, tipo_impresora || 'pos', margen_vencimiento || 30]
    );

    if (result.affectedRows === 0) {
      // Si por alguna razón no existe el registro de la empresa 1, lo creamos
      await pool.query(
        `INSERT INTO empresas (id, nombre, rnc, direccion, telefono, email, itbis_tasa, tipo_impresora, moneda) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, 'USD')`,
        [nombre_empresa, rnc || null, direccion || null, telefono || null, email || null, itbis_tasa || 16, tipo_impresora || 'pos']
      );
    }
    
    res.json({ message: 'Configuración actualizada exitosamente' });
  } catch (err) {
    console.error('Error al actualizar configuración:', err);
    res.status(500).json({ error: 'Error al actualizar la configuración' });
  }
};

module.exports = { getSettings, updateSettings };
