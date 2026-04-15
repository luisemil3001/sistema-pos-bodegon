import React from 'react';
import { 
    TrendingUp, Users, Package, AlertCircle, 
    DollarSign, ShoppingBag, ArrowUpRight, Calendar, FileDigit
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import useDashboard from '../../hooks/useDashboard';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const DashboardPage = () => {
    const { stats, charts, topProducts, loading, error } = useDashboard();
    const navigate = useNavigate();

    if (loading && !stats) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando análisis de negocio...</div>;
    if (error) return <div style={{ color: 'var(--danger)', padding: '2rem' }}>{error}</div>;

    const barData = {
        labels: charts?.semanal?.map(d => new Date(d.fecha).toLocaleDateString('es-DO', { weekday: 'short' })) || [],
        datasets: [{
            label: 'Ventas Diarias ($)',
            data: charts?.semanal?.map(d => d.total) || [],
            backgroundColor: 'rgba(56, 189, 248, 0.6)',
            borderColor: 'var(--primary)',
            borderWidth: 1,
            borderRadius: 5,
        }]
    };

    const pieData = {
        labels: charts?.categorias?.map(c => c.categoria || 'Sin Categoría') || [],
        datasets: [{
            data: charts?.categorias?.map(c => c.total) || [],
            backgroundColor: [
                'rgba(56, 189, 248, 0.7)',
                'rgba(34, 197, 94, 0.7)',
                'rgba(251, 191, 36, 0.7)',
                'rgba(239, 68, 68, 0.7)',
                'rgba(168, 85, 247, 0.7)',
            ],
            borderWidth: 0,
        }]
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Panel de Control</h1>
                <p style={{ color: 'var(--text-muted)' }}>Resumen analítico del rendimiento de su negocio hoy.</p>
            </div>

            {/* Tarjetas KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <StatCard 
                    title="Ventas de Hoy" 
                    value={`$${(stats?.hoy?.total || 0).toFixed(2)}`} 
                    icon={<DollarSign size={24} />} 
                    color="#38bdf8" 
                    subtitle={`${stats?.hoy?.cantidad || 0} facturas emitidas`}
                />
                <StatCard 
                    title="Promedio de Venta" 
                    value={`$${(stats?.hoy?.promedio || 0).toFixed(2)}`} 
                    icon={<TrendingUp size={24} />} 
                    color="#22c55e" 
                    subtitle="Ticket promedio por cliente"
                />
                <StatCard 
                    title="Ventas del Mes" 
                    value={`$${(stats?.mes?.total || 0).toFixed(2)}`} 
                    icon={<ShoppingBag size={24} />} 
                    color="#a855f7" 
                    subtitle="Acumulado periodo actual"
                />
                <StatCard 
                    title="Alertas de Stock" 
                    value={stats?.alerta_stock || 0} 
                    icon={<AlertCircle size={24} />} 
                    color="#ef4444" 
                    subtitle="Productos agotándose"
                    warning={(stats?.alerta_stock || 0) > 0}
                    onClick={() => navigate('/inventario?filtro=stock')}
                />
                <StatCard 
                    title="Cotizaciones" 
                    value={stats?.cotizaciones_pendientes || 0} 
                    icon={<FileDigit size={24} />} 
                    color="#6366f1" 
                    subtitle="Pendientes por facturar"
                    onClick={() => navigate('/cotizaciones')}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem' }}>
                {/* Gráfico de Barras */}
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Ventas últimos 7 días</h3>
                    <div style={{ height: '300px' }}>
                        <Bar 
                            data={barData} 
                            options={{ 
                                responsive: true, 
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
                            }} 
                        />
                    </div>
                </div>

                {/* Gráfico de Pastel */}
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Top Categorías</h3>
                    <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                        <Pie 
                            data={pieData} 
                            options={{ 
                                responsive: true, 
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, color: '#9ca3af' } } }
                            }} 
                        />
                    </div>
                </div>
            </div>

            {/* Productos Estrella */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Productos Estrella (Top Ventas)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {topProducts?.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                #{idx + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600' }}>{p.nombre}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.cantidad} unidades vendidas</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>${parseFloat(p.total).toFixed(2)}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Generado</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, subtitle, warning, onClick }) => (
    <div 
        onClick={onClick}
        style={{ 
            backgroundColor: 'var(--bg-card)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius)', 
            border: `1px solid ${warning ? '#ef4444' : 'var(--border)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            position: 'relative',
            overflow: 'hidden',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            opacity: onClick ? 1 : 0.9
        }}
    >
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1, transform: 'scale(2.5)', color }}>
            {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {React.cloneElement(icon, { size: 16, color })} {title}
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: warning ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {subtitle}
        </div>
    </div>
);

export default DashboardPage;
