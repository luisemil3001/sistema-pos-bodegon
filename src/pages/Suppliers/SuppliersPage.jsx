import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import useSuppliers from '../../hooks/useSuppliers';
import SupplierModal from './SupplierModal';

const SuppliersPage = () => {
  const { suppliers, loading, error, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenNew = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Está seguro que desea eliminar al proveedor "${name}"?`)) {
      const res = await deleteSupplier(id);
      if (!res.success) alert(res.message);
    }
  };

  const handleSaveModal = async (supplierData) => {
    if (editingSupplier) {
      return await updateSupplier(editingSupplier.id, supplierData);
    } else {
      return await createSupplier(supplierData);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.rnc_cedula && s.rnc_cedula.includes(searchTerm))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Gestión de Proveedores</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administre su base de datos de distribuidores y proveedores</p>
        </div>
        <button 
          onClick={handleOpenNew}
          style={{ backgroundColor: 'var(--primary)', color: 'var(--bg-main)', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
        >
          <Plus size={18} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Filters & Errors */}
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o RNC/Cédula..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading && suppliers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando proveedores...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Nombre / Razón Social</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>RNC / Cédula</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Contacto</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron proveedores.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{s.nombre}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{s.rnc_cedula || '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.9rem' }}>{s.telefono || '-'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.email || ''}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenEdit(s)}
                            style={{ padding: '0.4rem', backgroundColor: 'transparent', color: 'var(--info)', border: '1px solid var(--border)' }}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id, s.nombre)}
                            style={{ padding: '0.4rem', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--border)' }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SupplierModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        supplier={editingSupplier} 
        onSave={handleSaveModal}
      />
    </div>
  );
};

export default SuppliersPage;
