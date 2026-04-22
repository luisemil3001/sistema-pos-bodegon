const pool = require('../config/db');
const bcvService = require('../services/bcvService');

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
  const { 
    nombre_empresa, rnc, direccion, telefono, email, 
    itbis_tasa, tipo_impresora, margen_vencimiento,
    tasa_dolar, auto_sync_bcv 
  } = req.body;
  
  try {
    const [result] = await pool.query(
      `UPDATE empresas SET 
      nombre = ?, rnc = ?, direccion = ?, telefono = ?, email = ?, 
      itbis_tasa = ?, tipo_impresora = ?, margen_vencimiento = ?,
      tasa_dolar = ?, auto_sync_bcv = ?
      WHERE id = 1`,
      [
        nombre_empresa, rnc || null, direccion || null, telefono || null, email || null, 
        itbis_tasa || 16, tipo_impresora || 'pos', margen_vencimiento || 30,
        tasa_dolar || 36.45, auto_sync_bcv === undefined ? true : auto_sync_bcv
      ]
    );

    if (result.affectedRows === 0) {
      // Si por alguna razón no existe el registro de la empresa 1, lo creamos
      await pool.query(
        `INSERT INTO empresas (id, nombre, rnc, direccion, telefono, email, itbis_tasa, tipo_impresora, moneda, tasa_dolar, auto_sync_bcv) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?)`,
        [nombre_empresa, rnc || null, direccion || null, telefono || null, email || null, itbis_tasa || 16, tipo_impresora || 'pos', tasa_dolar || 36.45, auto_sync_bcv === undefined ? true : auto_sync_bcv]
      );
    }
    
    res.json({ message: 'Configuración actualizada exitosamente' });
  } catch (err) {
    console.error('Error al actualizar configuración:', err);
    res.status(500).json({ error: 'Error al actualizar la configuración' });
  }
};

const syncBcvRate = async (req, res) => {
  try {
    // Si viene de un proceso automático (silent), verificamos si está permitido
    const isManual = req.body && req.body.manual === true;
    
    if (!isManual) {
      const [empresa] = await pool.query('SELECT auto_sync_bcv FROM empresas WHERE id = 1');
      if (empresa.length > 0 && !empresa[0].auto_sync_bcv) {
        return res.json({ message: 'Sincronización automática desactivada por el usuario', skipped: true });
      }
    }

    const rate = await bcvService.getBcvRate();
    if (!rate) {
      return res.status(502).json({ error: 'No se pudo obtener la tasa desde BCV' });
    }

    const [result] = await pool.query('UPDATE empresas SET tasa_dolar = ? WHERE id = 1', [rate]);
    if (result.affectedRows === 0) {
      await pool.query(
        `INSERT INTO empresas (id, nombre, tasa_dolar) VALUES (1, 'Empresa', ?)`,
        [rate]
      );
    }

    res.json({ message: 'Tasa sincronizada con BCV', tasa_dolar: rate });
  } catch (err) {
    console.error('Error al sincronizar tasa con BCV:', err);
    res.status(500).json({ error: 'Error al sincronizar la tasa con BCV' });
  }
};

module.exports = { getSettings, updateSettings, syncBcvRate };
