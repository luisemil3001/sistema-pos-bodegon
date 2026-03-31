import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const CustomerModal = ({ isOpen, onClose, customer, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rnc_cedula: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        nombre: customer.nombre || '',
        rnc_cedula: customer.rnc_cedula || '',
        telefono: customer.telefono || '',
        email: customer.email || '',
        direccion: customer.direccion || ''
      });
    } else {
      setFormData({
        nombre: '',
        rnc_cedula: '',
        telefono: '',
        email: '',
        direccion: ''
      });
    }
    setError('');
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.nombre) {
      setError('El nombre del cliente es obligatorio');
      return;
    }

    setSaving(true);
    const result = await onSave(formData);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.message);
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: '500px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form id="customerForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Nombre / Razón Social *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={{ width: '100%' }} autoFocus />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>RNC o Cédula</label>
              <input type="text" name="rnc_cedula" value={formData.rnc_cedula} onChange={handleChange} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Teléfono</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Correo Electrónico</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Dirección Física</label>
              <textarea name="direccion" value={formData.direccion} onChange={handleChange} rows="3" style={{ width: '100%', resize: 'none' }}></textarea>
            </div>

          </form>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.6rem 1.25rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
            Cancelar
          </button>
          <button type="submit" form="customerForm" disabled={saving} style={{ padding: '0.6rem 1.25rem', backgroundColor: 'var(--primary)', color: 'var(--bg-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}>
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
