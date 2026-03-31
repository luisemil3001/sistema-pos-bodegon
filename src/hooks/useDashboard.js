import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';

const useDashboard = () => {
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [sRes, cRes, tRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/charts'),
                api.get('/dashboard/top-products')
            ]);
            setStats(sRes.data);
            setCharts(cRes.data);
            setTopProducts(tRes.data);
        } catch (err) {
            setError('Error al cargar datos del dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { stats, charts, topProducts, loading, error, refresh: fetchData };
};

export default useDashboard;
