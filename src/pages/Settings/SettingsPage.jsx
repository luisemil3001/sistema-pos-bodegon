import React, { useState, useEffect } from 'react';
import { Save, Store, Receipt, AlertCircle } from 'lucide-react';
import useSettings from '../../hooks/useSettings';

const SettingsPage = () => {
  const { settings, loading, error, fetchSettings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    rnc: '',
    direccion: '',
    telefono: '',
    email: '',
    itbis_tasa: 16,
    tipo_impresora: 'pos'
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        nombre_empresa: settings.nombre_empresa || '',
        rnc: settings.rnc || '',
        direccion: settings.direccion || '',
        telefono: settings.telefono || '',
        email: settings.email || '',
        itbis_tasa: settings.itbis_tasa || 16,
        tipo_impresora: settings.tipo_impresora || 'pos'
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'itbis_tasa' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const result = await updateSettings(formData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setSaving(false);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (loading && !settings) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando configuración...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Configuración del Sistema</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestione los datos de su negocio y preferencias de impresión</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {message.text && (
        <div style={{ 
          backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          color: message.type === 'success' ? '#22c55e' : 'var(--danger)', 
          padding: '1rem', 
          borderRadius: 'var(--radius)', 
          border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Sección: Datos de la Empresa */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-sidebar)' }}>
            <Store size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>Datos de la Empresa</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre de la Empresa *</label>
              <input 
                type="text" 
                name="nombre_empresa"
                value={formData.nombre_empresa} 
                onChange={handleChange}
                required 
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>RNC / Cédula</label>
              <input 
                type="text" 
                name="rnc"
                value={formData.rnc} 
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Teléfono</label>
              <input 
                type="text" 
                name="telefono"
                value={formData.telefono} 
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Dirección Física</label>
              <textarea 
                name="direccion"
                value={formData.direccion} 
                onChange={handleChange}
                rows={2}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* Sección: Facturación e Impuestos */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-sidebar)' }}>
            <Receipt size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>Facturación e Impresión</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Tasa de IVA (%) *</label>
              <input 
                type="number" 
                name="itbis_tasa"
                step="0.01"
                min="0"
                value={formData.itbis_tasa} 
                onChange={handleChange}
                required
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Esta tasa global aplica al calcular ventas en POS.</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Tipo de Impresora *</label>
              <select 
                name="tipo_impresora"
                value={formData.tipo_impresora}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
              >
                <option value="pos">1. Impresora de Ticket (Estándar POS)</option>
                <option value="fiscal">2. Impresora Fiscal (Venezuela)</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Determina cómo se procesa la impresión al cerrar una venta.</p>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            type="submit" 
            disabled={saving}
            style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--primary)', color: 'var(--bg-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SettingsPage;
