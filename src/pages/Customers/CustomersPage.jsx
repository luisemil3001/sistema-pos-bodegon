import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import useCustomers from '../../hooks/useCustomers';
import CustomerModal from './CustomerModal';

const CustomersPage = () => {
  const { customers, loading, error, fetchCustomers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Está seguro que desea eliminar al cliente "${name}"?`)) {
      const res = await deleteCustomer(id);
      if (!res.success) alert(res.message);
    }
  };

  const handleSaveModal = async (customerData) => {
    if (editingCustomer) {
      return await updateCustomer(editingCustomer.id, customerData);
    } else {
      return await addCustomer(customerData);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.rnc_cedula && c.rnc_cedula.includes(searchTerm))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Gestión de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administre su base de datos de consumidores finales y corporativos</p>
        </div>
        <button 
          onClick={handleOpenNew}
          style={{ backgroundColor: 'var(--primary)', color: 'var(--bg-main)', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
        >
          <Plus size={18} />
          Nuevo Cliente
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
        {loading && customers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando clientes...</div>
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
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron clientes.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{c.nombre}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{c.rnc_cedula || 'Consumidor Final'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.9rem' }}>{c.telefono || '-'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email || ''}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenEdit(c)}
                            style={{ padding: '0.4rem', backgroundColor: 'transparent', color: 'var(--info)', border: '1px solid var(--border)' }}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(c.id, c.nombre)}
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

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        customer={editingCustomer} 
        onSave={handleSaveModal}
      />
    </div>
  );
};

export default CustomersPage;
