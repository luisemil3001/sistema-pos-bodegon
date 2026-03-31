import React, { useState, useEffect } from 'react';
import { Hash, Plus, Edit, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import useNCF from '../../hooks/useNCF';

const NCFPage = () => {
    const { sequences, loading, error, fetchSequences, saveSequence } = useNCF();
    const [showModal, setShowModal] = useState(false);
    const [editingSeq, setEditingSeq] = useState(null);
    const [formData, setFormData] = useState({ 
        tipo: '', nombre: '', prefijo: 'B', 
        secuencia_inicio: 1, secuencia_fin: 99999999, 
        secuencia_actual: 1, activo: 1 
    });

    useEffect(() => {
        fetchSequences();
    }, [fetchSequences]);

    const handleOpenModal = (seq = null) => {
        if (seq) {
            setEditingSeq(seq);
            setFormData({ ...seq });
        } else {
            setEditingSeq(null);
            setFormData({ 
                tipo: '', nombre: '', prefijo: 'B', 
                secuencia_inicio: 1, secuencia_fin: 99999999, 
                secuencia_actual: 1, activo: 1 
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await saveSequence(formData);
        if (res.success) {
            setShowModal(false);
            alert('Secuencia NCF guardada correctamente');
        } else {
            alert(res.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Comprobantes Fiscales (NCF)</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Configure las secuencias autorizadas por la entidad tributaria (DGII)</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                    <Plus size={20} /> Nueva Secuencia
                </button>
            </div>

            {error && <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}

            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        <tr>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Tipo</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nombre / Descripción</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Siguiente NCF</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Rango Autorizado</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Estado</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && sequences.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Cargando secuencias...</td></tr>
                        ) : sequences.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>No hay secuencias configuradas</td></tr>
                        ) : (
                            sequences.map(seq => {
                                const fullNCF = `${seq.prefijo}${seq.tipo}${String(seq.secuencia_actual).padStart(8, '0')}`;
                                const isWarning = (seq.secuencia_fin - seq.secuencia_actual) < 100;
                                return (
                                    <tr key={seq.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{seq.tipo}</td>
                                        <td style={{ padding: '1rem' }}>{seq.nombre}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <code style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{fullNCF}</code>
                                        </td>
                                        <td style={{ padding: '1rem', opacity: 0.8 }}>
                                            {seq.prefijo}{seq.tipo}{String(seq.secuencia_inicio).padStart(8, '0')} - {String(seq.secuencia_fin).padStart(8, '0')}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {seq.activo ? 
                                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={14}/> Activa</span> : 
                                                <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><XCircle size={14}/> Inactiva</span>
                                            }
                                            {isWarning && seq.activo && <div style={{ color: '#fbbf24', fontSize: '0.75rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><AlertCircle size={10}/> ¡Agotándose!</div>}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button onClick={() => handleOpenModal(seq)} style={{ padding: '0.4rem', color: 'var(--text-muted)', background: 'transparent' }}><Edit size={18}/></button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '500px', border: '1px solid var(--border)' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingSeq ? 'Editar Secuencia NCF' : 'Nueva Secuencia NCF'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Tipo (ej. 01, 02)</label>
                                    <input type="text" maxLength="2" required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ width: '100%', padding: '0.75rem' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Prefijo (E o B)</label>
                                    <input type="text" maxLength="1" required value={formData.prefijo} onChange={e => setFormData({...formData, prefijo: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '0.75rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Nombre / Descripción</label>
                                <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ width: '100%', padding: '0.75rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Secuencia Inicio</label>
                                    <input type="number" required value={formData.secuencia_inicio} onChange={e => setFormData({...formData, secuencia_inicio: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.75rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Secuencia Fin</label>
                                    <input type="number" required value={formData.secuencia_fin} onChange={e => setFormData({...formData, secuencia_fin: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.75rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Secuencia Actual</label>
                                    <input type="number" required value={formData.secuencia_actual} onChange={e => setFormData({...formData, secuencia_actual: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.75rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Estado</label>
                                    <select value={formData.activo} onChange={e => setFormData({...formData, activo: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-main)', color: 'white' }}>
                                        <option value={1}>Activa</option>
                                        <option value={0}>Inactiva</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--bg-sidebar)' }}>Cancelar</button>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'white' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NCFPage;
