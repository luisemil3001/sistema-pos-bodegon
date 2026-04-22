import React, { useState, useEffect } from 'react';
import { ShieldCheck, History, ClipboardList, Search, FileText, TrendingDown, TrendingUp, AlertCircle, Monitor } from 'lucide-react';
import useReports from '../../hooks/useReports';
import useWorkstations from '../../hooks/useWorkstations';
import { formatCurrency, formatQty } from '../../utils/format';
import { ReportCard, ReportFilters, ReportPageShell } from '../../components/ReportLayout';

const AuditPage = () => {
    const { fetchShifts, fetchAdjustments } = useReports();
    const { workstations, fetchWorkstations } = useWorkstations();
    
    const [activeTab, setActiveTab] = useState('shifts');
    const [shifts, setShifts] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filtros para turnos
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        estacionId: ''
    });

    useEffect(() => {
        if (activeTab === 'shifts') {
            loadShifts();
            fetchWorkstations();
        } else {
            loadAdjustments();
        }
    }, [activeTab]);

    const loadShifts = async () => {
        setLoading(true);
        try {
            const data = await fetchShifts(filters);
            setShifts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadAdjustments = async () => {
        setLoading(true);
        try {
            const data = await fetchAdjustments();
            setAdjustments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '1rem 1.5rem',
                backgroundColor: activeTab === id ? 'var(--bg-card)' : 'transparent',
                color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: activeTab === id ? '3px solid var(--primary)' : '3px solid transparent',
                fontWeight: activeTab === id ? '600' : '400',
                transition: 'all 0.2s'
            }}
        >
            <Icon size={20} />
            {label}
        </button>
    );

    return (
        <ReportPageShell
            title="Auditoría de Sistema"
            subtitle="Seguimiento detallado de operaciones, arqueos y movimientos de inventario"
            icon={ShieldCheck}
        >
            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                <TabButton id="shifts" label="Historial de Arqueos" icon={History} />
                <TabButton id="adjustments" label="Auditoría de Inventario" icon={ClipboardList} />
            </div>

            {/* CONTENIDO TAB 1: ARQUEOS */}
            {activeTab === 'shifts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Filtros */}
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Desde</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} style={{ padding: '0.6rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Hasta</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} style={{ padding: '0.6rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Estación / Caja</label>
                            <select value={filters.estacionId} onChange={e => setFilters({...filters, estacionId: e.target.value})} style={{ padding: '0.6rem', minWidth: '180px' }}>
                                <option value="">Todas las Cajas</option>
                                {workstations.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                            </select>
                        </div>
                        <button onClick={loadShifts} style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                            <Search size={18} /> Filtrar Auditoría
                        </button>
                    </div>

                    {/* Tabla de Arqueos */}
                    <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Cierre (Fecha/Hora)</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Cajero / Estación</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Ventas Totales</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Diferencia</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>Consultando registros...</td></tr>
                                ) : shifts.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>No se encontraron cierres de caja en este rango.</td></tr>
                                ) : (
                                    shifts.map(shift => (
                                        <tr key={shift.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '500' }}>{new Date(shift.fecha_cierre).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(shift.fecha_cierre).toLocaleTimeString()}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '600' }}>{shift.usuario_nombre}</div>
                                                <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
                                                    <Monitor size={14} /> {shift.estacion_nombre || 'PC-General'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                ${formatCurrency(parseFloat(shift.total_ventas_efectivo || 0) + parseFloat(shift.total_ventas_tarjeta || 0))}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <span style={{ 
                                                    padding: '0.3rem 0.6rem', 
                                                    borderRadius: 'var(--radius)', 
                                                    backgroundColor: shift.diferencia === 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: shift.diferencia === 0 ? 'var(--success)' : 'var(--danger)',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {shift.diferencia > 0 ? '+' : ''}{formatCurrency(shift.diferencia)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button style={{ color: 'var(--primary)', background: 'transparent' }}><FileText size={20}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CONTENIDO TAB 2: AJUSTES DE INVENTARIO */}
            {activeTab === 'adjustments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Fecha</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Producto</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Tipo / Cant.</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Motivo / Autor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adjustments.map(adj => (
                                    <tr key={adj.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                            {new Date(adj.fecha).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '600' }}>{adj.producto_nombre}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: adj.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                                                {adj.tipo === 'entrada' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                                {formatQty(adj.cantidad)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem' }}>{adj.motivo}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por: {adj.usuario_nombre}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </ReportPageShell>
    );
};

export default AuditPage;
