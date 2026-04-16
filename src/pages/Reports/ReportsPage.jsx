import React, { useEffect } from 'react';
import { DollarSign, FileText, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import useReports from '../../hooks/useReports';
import { formatCurrency } from '../../utils/format';

const ReportsPage = () => {
  const { stats, loading, error, fetchStats } = useReports();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando panel de control...</div>;
  if (error) return <div style={{ color: 'var(--danger)', padding: '1rem', border: '1px solid var(--danger)' }}>{error}</div>;
  if (!stats) return null;

  const StatCard = ({ title, value, subvalue, icon: Icon, color }) => (
    <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>{title}</p>
        <h3 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>{value}</h3>
        {subvalue && <p style={{ color: color || 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{subvalue}</p>}
      </div>
      <div style={{ backgroundColor: `${color}15` || 'var(--bg-main)', padding: '0.75rem', borderRadius: '50%', color: color || 'var(--primary)' }}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Panel de Control</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resumen general de las operaciones de su negocio</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          title="Ventas de Hoy" 
          value={`Bs. ${formatCurrency(stats.ventas_hoy.total_bs || 0)}`} 
          subvalue={`Ref: $${formatCurrency(stats.ventas_hoy.total || 0)} USD | ${stats.ventas_hoy.cantidad} facturas`}
          icon={DollarSign}
          color="#22c55e"
        />
        <StatCard 
          title="Ventas del Mes" 
          value={`Bs. ${formatCurrency(stats.ventas_mes.total_bs || 0)}`} 
          subvalue={`Ref: $${formatCurrency(stats.ventas_mes.total || 0)} USD`}
          icon={TrendingUp}
          color="#3b82f6"
        />
        <StatCard 
          title="Alertas de Inventario" 
          value={stats.alertas_stock.length.toString()} 
          subvalue="Productos bajo stock mínimo"
          icon={AlertTriangle}
          color="#eab308"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Tabla: Productos Bajo Stock */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <AlertTriangle size={18} color="#eab308" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Productos con Bajo Stock</h3>
          </div>
          <div style={{ padding: '1rem', flex: 1 }}>
            {stats.alertas_stock.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>El inventario está en niveles óptimos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.alertas_stock.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius)' }}>
                    <span style={{ fontWeight: '500' }}>{item.nombre}</span>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Quedan: {item.stock}</span>
                      <span style={{ color: 'var(--text-muted)' }}>(Min: {item.min_stock})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabla: Actividad Reciente */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Clock size={18} color="#3b82f6" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Últimas Facturas Emitidas</h3>
          </div>
          <div style={{ padding: '1rem', flex: 1 }}>
            {stats.actividad_reciente.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No hay ventas registradas aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.actividad_reciente.map(inv => (
                  <div key={inv.numero_factura} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius)' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.95rem' }}>{inv.numero_factura}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(inv.fecha).toLocaleTimeString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--success)' }}>Bs. {formatCurrency(inv.total_bs || 0)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${formatCurrency(inv.total)} USD</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;
