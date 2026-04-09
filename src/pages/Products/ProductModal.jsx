import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, product, onSave, categories, suppliers }) => {
  const [formData, setFormData] = useState({
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    proveedor_id: '',
    precio_costo: '',
    precio_venta: '',
    stock: '',
    min_stock: '5',
    unidad: 'unid',
    aplica_iva: true,
    fecha_vencimiento: '',
    proveedor_id: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        codigo_barras: product.codigo_barras || '',
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        categoria_id: product.categoria_id || '',
        precio_costo: product.precio_costo || '',
        precio_venta: product.precio_venta || '',
        stock: product.stock || '0',
        min_stock: product.min_stock || '5',
        unidad: product.unidad || 'unid',
        aplica_iva: product.aplica_iva !== undefined ? product.aplica_iva : true,
        fecha_vencimiento: product.fecha_vencimiento ? new Date(product.fecha_vencimiento).toISOString().split('T')[0] : '',
        proveedor_id: product.proveedor_id || ''
      });
    } else {
      setFormData({
        codigo_barras: '',
        nombre: '',
        descripcion: '',
        categoria_id: '',
        precio_costo: '',
        precio_venta: '',
        stock: '0',
        min_stock: '5',
        unidad: 'unid',
        aplica_iva: true,
        fecha_vencimiento: '',
        proveedor_id: ''
      });
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.nombre || !formData.precio_venta) {
      setError('El nombre y el precio de venta son obligatorios');
      return;
    }

    setSaving(true);
    
    // Convertir formatos numéricos
    const submitData = {
      ...formData,
      categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
      precio_costo: parseFloat(formData.precio_costo) || 0,
      precio_venta: parseFloat(formData.precio_venta),
      stock: parseInt(formData.stock) || 0,
      min_stock: parseInt(formData.min_stock) || 5,
      aplica_iva: formData.aplica_iva,
      fecha_vencimiento: formData.fecha_vencimiento || null,
      proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : null
    };

    const result = await onSave(submitData);
    
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
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} style={{ 
            background: 'transparent', 
            color: 'var(--text-muted)', 
            display: 'flex', 
            alignItems: 'center',
            padding: '0.25rem'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form id="productForm" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Nombre del Producto *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={{ width: '100%' }} autoFocus />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="2" style={{ width: '100%', resize: 'none' }}></textarea>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Código de Barras</label>
              <input type="text" name="codigo_barras" value={formData.codigo_barras} onChange={handleChange} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Categoría</label>
              <select name="categoria_id" value={formData.categoria_id} onChange={handleChange} style={{ width: '100%' }}>
                <option value="">-- Sin categoría --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Proveedor</label>
              <select name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} style={{ width: '100%' }}>
                <option value="">-- Sin proveedor --</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Precio Costo</label>
              <input type="number" step="0.01" min="0" name="precio_costo" value={formData.precio_costo} onChange={handleChange} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>Precio Venta *</label>
              <input type="number" step="0.01" min="0" name="precio_venta" value={formData.precio_venta} onChange={handleChange} style={{ width: '100%', border: '1px solid var(--primary)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Stock Inicial</label>
              <input type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Stock Mínimo</label>
              <input type="number" min="0" name="min_stock" value={formData.min_stock} onChange={handleChange} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Fecha de Vencimiento</label>
              <input type="date" name="fecha_vencimiento" value={formData.fecha_vencimiento} onChange={handleChange} style={{ width: '100%' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="aplica_iva" name="aplica_iva" checked={formData.aplica_iva} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="aplica_iva" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>Aplica Impuesto (IVA)</label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1rem' 
        }}>
          <button type="button" onClick={onClose} style={{ 
            padding: '0.6rem 1.25rem', 
            background: 'transparent', 
            color: 'var(--text-main)',
            border: '1px solid var(--border)' 
          }}>
            Cancelar
          </button>
          <button type="submit" form="productForm" disabled={saving} style={{ 
            padding: '0.6rem 1.25rem', 
            backgroundColor: 'var(--primary)', 
            color: 'var(--bg-main)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: saving ? 0.7 : 1
          }}>
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
