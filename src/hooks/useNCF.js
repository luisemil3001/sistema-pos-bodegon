import { useState, useCallback } from 'react';
import api from '../api/api';

const useNCF = () => {
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSequences = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/ncf');
            setSequences(res.data);
        } catch (err) {
            setError('Error al cargar secuencias NCF');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSequence = async (seqData) => {
        try {
            await api.post('/ncf', seqData);
            fetchSequences();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Error al guardar secuencia' };
        }
    };

    return { sequences, loading, error, fetchSequences, saveSequence };
};

export default useNCF;
