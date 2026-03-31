import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import useUsers from '../../hooks/useUsers';

const UsersPage = () => {
    const { users, loading, error, fetchUsers, createUser, updateUser, deleteUser } = useUsers();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', usuario: '', password: '', rol: 'cajero', activo: 1 });

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ nombre: user.nombre, usuario: user.usuario, password: '', rol: user.rol, activo: user.activo });
        } else {
            setEditingUser(null);
            setFormData({ nombre: '', usuario: '', password: '', rol: 'cajero', activo: 1 });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let res;
        if (editingUser) {
            res = await updateUser(editingUser.id, formData);
        } else {
            res = await createUser(formData);
        }

        if (res.success) {
            setShowModal(false);
            alert('Usuario guardado con éxito');
        } else {
            alert(res.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este usuario?')) {
            const res = await deleteUser(id);
            if (!res.success) alert(res.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Gestión de Usuarios</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Administre los cajeros y personal con acceso al sistema</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                    <UserPlus size={20} /> Nuevo Usuario
                </button>
            </div>

            {error && <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}

            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        <tr>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nombre</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Usuario</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Rol</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Estado</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && users.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Cargando usuarios...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No hay usuarios registrados</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{user.nombre}</td>
                                    <td style={{ padding: '1rem' }}>{user.usuario}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            padding: '0.2rem 0.6rem', 
                                            borderRadius: '1rem', 
                                            fontSize: '0.8rem', 
                                            backgroundColor: user.rol === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                            color: user.rol === 'admin' ? '#3b82f6' : 'var(--text-muted)',
                                            border: `1px solid ${user.rol === 'admin' ? '#3b82f6' : 'var(--border)'}`
                                        }}>
                                            {user.rol.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {user.activo ? 
                                            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}><CheckCircle size={14}/> Activo</span> : 
                                            <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}><XCircle size={14}/> Inactivo</span>
                                        }
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button onClick={() => handleOpenModal(user)} style={{ padding: '0.4rem', color: 'var(--text-muted)', background: 'transparent' }}><Edit size={18}/></button>
                                            <button onClick={() => handleDelete(user.id)} style={{ padding: '0.4rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '450px', border: '1px solid var(--border)' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Nombre Completo</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.nombre} 
                                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem' }} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Usuario (Login)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.usuario} 
                                    onChange={e => setFormData({...formData, usuario: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem' }} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                    Contraseña {editingUser && '(Dejar en blanco para no cambiar)'}
                                </label>
                                <input 
                                    type="password" 
                                    required={!editingUser}
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem' }} 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Rol</label>
                                    <select 
                                        value={formData.rol} 
                                        onChange={e => setFormData({...formData, rol: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-main)', color: 'white' }}
                                    >
                                        <option value="cajero">Cajero</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Estado</label>
                                    <select 
                                        value={formData.activo} 
                                        onChange={e => setFormData({...formData, activo: parseInt(e.target.value)})}
                                        style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-main)', color: 'white' }}
                                    >
                                        <option value={1}>Activo</option>
                                        <option value={0}>Inactivo</option>
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

export default UsersPage;
