import { useState, useCallback } from 'react';
import api from '../api/api';
import useErrorHandler from './useErrorHandler';

const useUsers = () => {
    const [users, setUsers] = useState([]);
    const { error, isLoading, handleError, clearError, wrapAsync } = useErrorHandler();

    const fetchUsers = useCallback(async () => {
        try {
            const res = await wrapAsync(() => api.get('/users'));
            setUsers(res.data);
        } catch (err) {
            // Error ya manejado por wrapAsync
        }
    }, [wrapAsync]);

    const createUser = async (userData) => {
        try {
            await wrapAsync(() => api.post('/users', userData));
            fetchUsers();
            return { success: true };
        } catch (err) {
            return { success: false, message: error || 'Error al crear usuario' };
        }
    };

    const updateUser = async (id, userData) => {
        try {
            await wrapAsync(() => api.put(`/users/${id}`, userData));
            fetchUsers();
            return { success: true };
        } catch (err) {
            return { success: false, message: error || 'Error al actualizar usuario' };
        }
    };

    const deleteUser = async (id) => {
        try {
            await wrapAsync(() => api.delete(`/users/${id}`));
            fetchUsers();
            return { success: true };
        } catch (err) {
            return { success: false, message: error || 'Error al eliminar usuario' };
        }
    };

    return { users, loading: isLoading, error, fetchUsers, createUser, updateUser, deleteUser, clearError };
};

export default useUsers;
