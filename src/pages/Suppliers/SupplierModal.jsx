import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SupplierModal = ({ isOpen, onClose, supplier, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rnc_cedula: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplier) {
      setFormData({
        nombre: supplier.nombre || '',
        rnc_cedula: supplier.rnc_cedula || '',
        telefono: supplier.telefono || '',
        email: supplier.email || '',
        direccion: supplier.direccion || ''
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
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await onSave(formData);
    
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
      setSaving(false);
    }
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
        backgroundColor: 'var(--bg-main)',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border)'
      }}>
        
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
            {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {error && (
            <div style={{ color: 'var(--danger)', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nombre o Razón Social *</label>
            <input 
              type="text" 
              name="nombre"
              value={formData.nombre} 
              onChange={handleChange}
              required 
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RNC / Cédula</label>
            <input 
              type="text" 
              name="rnc_cedula"
              value={formData.rnc_cedula} 
              onChange={handleChange}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Teléfono</label>
              <input 
                type="text" 
                name="telefono"
                value={formData.telefono} 
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Dirección</label>
            <textarea 
              name="direccion"
              value={formData.direccion} 
              onChange={handleChange}
              rows={2}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', fontWeight: '600' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default SupplierModal;
