import { useState, useCallback } from 'react';
import api from '../api/api';

const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            setError('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    }, []);

    const createUser = async (userData) => {
        try {
            await api.post('/users', userData);
            fetchUsers();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al crear usuario' };
        }
    };

    const updateUser = async (id, userData) => {
        try {
            await api.put(`/users/${id}`, userData);
            fetchUsers();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al actualizar usuario' };
        }
    };

    const deleteUser = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al eliminar usuario' };
        }
    };

    return { users, loading, error, fetchUsers, createUser, updateUser, deleteUser };
};

export default useUsers;
