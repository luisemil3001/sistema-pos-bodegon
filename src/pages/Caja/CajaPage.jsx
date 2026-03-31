import React, { useState } from 'react';
import { Lock, Unlock, Banknote, History, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import useCaja from '../../hooks/useCaja';

const CajaPage = () => {
    const { cajaAbierta, loading, error, abrirCaja, cerrarCaja } = useCaja();
    const [monto, setMonto] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [resumenCierre, setResumenCierre] = useState(null);

    const handleAbrir = async (e) => {
        e.preventDefault();
        const res = await abrirCaja(parseFloat(monto), observaciones);
        if (!res.success) alert(res.message);
        else {
            setMonto('');
            setObservaciones('');
        }
    };

    const handleCerrar = async (e) => {
        e.preventDefault();
        try {
            const res = await cerrarCaja(parseFloat(monto), observaciones);
            if (res.success) {
                setResumenCierre(res.resumen);
                setMonto('');
                setObservaciones('');
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error('ERROR EN handleCerrar:', err);
            alert('Error inesperado al intentar cerrar el turno. Revise su conexión.');
        }
    };

    if (loading && !cajaAbierta && !resumenCierre) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando estado de caja...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Control de Caja y Turnos</h1>
                <p style={{ color: 'var(--text-muted)' }}>Apertura y arqueo de caja diario por usuario</p>
            </div>

            {/* ERROR DISPLAY */}
            {error && <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)' }}>{error}</div>}

            {/* MOSTRAR RESUMEN SI ACABA DE CERRAR */}
            {resumenCierre && (
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', border: '2px solid var(--primary)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                        <CheckCircle size={32} />
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Cierre de Turno Exitoso</h2>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fondo de Apertura</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${resumenCierre.apertura.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ventas en Efectivo</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${resumenCierre.ventas_efectivo.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Efectivo Esperado</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>${resumenCierre.efectivo_esperado.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Efectivo Real (Contado)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${resumenCierre.efectivo_real.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Diferencia</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: resumenCierre.diferencia === 0 ? 'var(--success)' : 'var(--danger)' }}>
                                ${resumenCierre.diferencia.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => window.print()}
                        style={{ marginTop: '2rem', width: '100%', padding: '1rem', backgroundColor: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600' }}
                    >
                        <Printer size={20} /> Imprimir Comprobante de Arqueo
                    </button>
                    <button 
                        onClick={() => setResumenCierre(null)}
                        style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', background: 'transparent', color: 'var(--text-muted)' }}
                    >
                        Volver
                    </button>
                </div>
            )}

            {!resumenCierre && (
                <div style={{ display: 'grid', gridTemplateColumns: cajaAbierta ? '1fr' : '1fr', gap: '2rem' }}>
                    
                    {/* SI LA CAJA ESTÁ CERRADA -> MOSTRAR FORMULARIO DE APERTURA */}
                    {!cajaAbierta ? (
                        <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
                                <Unlock size={32} />
                            </div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Apertura de Turno</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Ingrese el monto inicial (fondo de caja) para comenzar a facturar.</p>
                            
                            <form onSubmit={handleAbrir} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Monto de Apertura ($)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                        value={monto} 
                                        onChange={e => setMonto(e.target.value)}
                                        style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', backgroundColor: 'var(--bg-sidebar)', border: '2px solid var(--border)', borderRadius: 'var(--radius)' }} 
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Observaciones (Opcional)</label>
                                    <textarea 
                                        value={observaciones} 
                                        onChange={e => setObservaciones(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: '80px' }} 
                                    />
                                </div>
                                <button type="submit" style={{ padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1rem' }}>
                                    Iniciar Turno / Abrir Caja
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* SI LA CAJA ESTÁ ABIERTA -> MOSTRAR FORMULARIO DE CIERRE */
                        <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--primary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--success)', borderRadius: '50%' }}></div>
                                    CAJA ABIERTA
                                </div>
                                <h2 style={{ marginBottom: '1.5rem' }}>Finalizar Turno</h2>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Cajero:</span>
                                        <span style={{ fontWeight: '600' }}>{cajaAbierta.usuario_nombre || 'Usuario Actual'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Apertura:</span>
                                        <span style={{ fontWeight: '600' }}>{new Date(cajaAbierta.fecha_apertura).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Monto Inicial:</span>
                                        <span style={{ fontWeight: '600' }}>${parseFloat(cajaAbierta.monto_apertura).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.9rem', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                                    <AlertTriangle size={16} />
                                    <span>Cuente el efectivo real en su gaveta antes de cerrar.</span>
                                </div>
                            </div>

                            <form onSubmit={handleCerrar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Efectivo Real en Caja ($)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="Ingrese monto contado"
                                        required
                                        value={monto} 
                                        onChange={e => setMonto(e.target.value)}
                                        style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', backgroundColor: 'var(--bg-sidebar)', border: '2px solid var(--border)', borderRadius: 'var(--radius)' }} 
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Suma de monedas y billetes físicos.</p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Comentarios de Cierre</label>
                                    <textarea 
                                        value={observaciones} 
                                        onChange={e => setObservaciones(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: '80px' }} 
                                    />
                                </div>
                                <button type="submit" style={{ padding: '1rem', backgroundColor: 'var(--danger)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Lock size={20} /> Realizar Arqueo y Cerrar Turno
                                </button>
                            </form>
                        </div>
                    )}
                    
                </div>
            )}
        </div>
    );
};

export default CajaPage;
