import React, { useState, useEffect } from 'react';
import { Monitor, PlusCircle, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import useWorkstations from '../../hooks/useWorkstations';

const WorkstationsPage = () => {
    const { workstations, loading, error, fetchWorkstations, createWorkstation, updateWorkstation, deleteWorkstation } = useWorkstations();
    const [showModal, setShowModal] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', descripcion: '', activa: 1 });

    useEffect(() => {
        fetchWorkstations();
    }, [fetchWorkstations]);

    const handleOpenModal = (station = null) => {
        if (station) {
            setEditingStation(station);
            setFormData({ nombre: station.nombre, descripcion: station.descripcion || '', activa: station.activa });
        } else {
            setEditingStation(null);
            setFormData({ nombre: '', descripcion: '', activa: 1 });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let res;
        if (editingStation) {
            res = await updateWorkstation(editingStation.id, formData);
        } else {
            res = await createWorkstation(formData);
        }

        if (res.success) {
            setShowModal(false);
            // El hook hace el refetch automáticamente
        } else {
            alert(res.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Desea eliminar esta estación? Si tiene historial, se desactivará automáticamente.')) {
            const res = await deleteWorkstation(id);
            if (!res.success) alert(res.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0 }}>Gestión de Estaciones (Cajas)</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Defina los puntos de venta físicos del establecimiento</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1rem' }}
                >
                    <PlusCircle size={20} /> Nueva Estación
                </button>
            </div>

            {error && <div style={{ color: 'var(--danger)', padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)', border: '1px solid var(--danger)' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {loading && workstations.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>Cargando estaciones...</div>
                ) : workstations.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                        No hay estaciones físicas configuradas.
                    </div>
                ) : (
                    workstations.map(station => (
                        <div key={station.id} style={{ 
                            backgroundColor: 'var(--bg-card)', 
                            borderRadius: 'var(--radius)', 
                            border: `1px solid ${station.activa ? 'var(--border)' : 'var(--danger)'}`,
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '50%', 
                                    backgroundColor: station.activa ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: station.activa ? '#3b82f6' : 'var(--text-muted)'
                                }}>
                                    <Monitor size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{station.nombre}</div>
                                    <div style={{ fontSize: '0.85rem', color: station.activa ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        {station.activa ? <><CheckCircle size={14}/> Activa / Operativa</> : <><XCircle size={14}/> Desactivada</>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', minHeight: '3rem' }}>
                                {station.descripcion || 'Sin descripción adicional.'}
                            </div>

                            <div style={{ 
                                marginTop: '1rem', 
                                paddingTop: '1rem', 
                                borderTop: '1px solid var(--border)', 
                                display: 'flex', 
                                gap: '1rem',
                                justifyContent: 'flex-end'
                            }}>
                                <button onClick={() => handleOpenModal(station)} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', background: 'transparent', border: '1px solid var(--border)' }}>
                                    <Edit size={16} /> Editar
                                </button>
                                <button onClick={() => handleDelete(station.id)} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', background: 'transparent' }}>
                                    <Trash2 size={16} /> Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '480px', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Monitor size={24} color="var(--primary)" />
                            {editingStation ? 'Editar Estación' : 'Añadir Nueva Estación'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre de la Caja (Ej: Caja Principal)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.nombre} 
                                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                                    style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }} 
                                    placeholder="Nombre identificador..."
                                    autoFocus
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Descripción / Ubicación</label>
                                <textarea 
                                    value={formData.descripcion} 
                                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                    style={{ width: '100%', padding: '0.85rem', minHeight: '100px', resize: 'none' }}
                                    placeholder="Ubicación física o detalles de la estación..."
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Estado Operativo</label>
                                <select 
                                    value={formData.activa} 
                                    onChange={e => setFormData({...formData, activa: parseInt(e.target.value)})}
                                    style={{ width: '100%', padding: '0.85rem' }}
                                >
                                    <option value={1}>Operativa (Disponible para turnos)</option>
                                    <option value={0}>Cerrada / Mantenimiento</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '1rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>Cancelar</button>
                                <button type="submit" style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>Guardar Estación</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkstationsPage;
