import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';

const useWorkstations = () => {
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWorkstations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/workstations');
            setWorkstations(res.data);
            setError(null);
        } catch (err) {
            setError('Error al cargar las estaciones de trabajo');
        } finally {
            setLoading(false);
        }
    }, []);

    const createWorkstation = async (data) => {
        try {
            await api.post('/workstations', data);
            fetchWorkstations();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al crear la estación' };
        }
    };

    const updateWorkstation = async (id, data) => {
        try {
            await api.put(`/workstations/${id}`, data);
            fetchWorkstations();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al actualizar la estación' };
        }
    };

    const deleteWorkstation = async (id) => {
        try {
            const res = await api.delete(`/workstations/${id}`);
            fetchWorkstations();
            return { success: true, message: res.data.message };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al eliminar la estación' };
        }
    };

    return { workstations, loading, error, fetchWorkstations, createWorkstation, updateWorkstation, deleteWorkstation };
};

export default useWorkstations;
