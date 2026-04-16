import React, { useState, useEffect } from 'react';
import { Lock, Unlock, CheckCircle, AlertTriangle, Printer, ArrowLeft, Search, Eye } from 'lucide-react';
import useCaja from '../../hooks/useCaja';
import { formatCurrency } from '../../utils/format';

const CajaPage = () => {
    const { cajaAbierta, loading, error, abrirCaja, cerrarCaja, getEstaciones, obtenerPreview } = useCaja();
    const [monto, setMonto] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [resumenCierre, setResumenCierre] = useState(null);
    const [estaciones, setEstaciones] = useState([]);
    const [selectedEstacion, setSelectedEstacion] = useState('');

    // Estado del flujo de cierre: 'form' -> 'preview' -> 'done'
    const [cierreStep, setCierreStep] = useState('form');
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        getEstaciones().then(setEstaciones).catch(console.error);
    }, []);

    const handleAbrir = async (e) => {
        e.preventDefault();
        if(!selectedEstacion) return alert('Debe seleccionar la estación física en la que está trabajando.');
        const res = await abrirCaja(parseFloat(monto), observaciones, selectedEstacion);
        if (!res.success) alert(res.message);
        else {
            setMonto('');
            setObservaciones('');
        }
    };

    // PASO 1: Solicitar pre-arqueo (sin cerrar la caja)
    const handleVerificarArqueo = async (e) => {
        e.preventDefault();
        if (!monto) return alert('Ingrese el monto contado en la gaveta.');
        setLoadingPreview(true);
        try {
            const data = await obtenerPreview(parseFloat(monto));
            setPreviewData(data);
            setCierreStep('preview');
        } catch (err) {
            alert('Error al generar el pre-arqueo.');
        } finally {
            setLoadingPreview(false);
        }
    };

    // PASO 2: Volver a contar (regresar al formulario)
    const handleVolverAContar = () => {
        setCierreStep('form');
        setPreviewData(null);
        setMonto('');
    };

    // PASO 3: Confirmar cierre definitivo
    const handleConfirmarCierre = async () => {
        try {
            const res = await cerrarCaja(parseFloat(previewData.efectivo_real), observaciones);
            if (res.success) {
                setResumenCierre(res.resumen);
                setMonto('');
                setObservaciones('');
                setCierreStep('form');
                setPreviewData(null);
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error('ERROR EN handleConfirmarCierre:', err);
            alert('Error inesperado al intentar cerrar el turno.');
        }
    };

    const imprimirArqueo = () => {
        if (!resumenCierre) return;
        const win = window.open('', '_blank', 'width=400,height=700');
        win.document.write(`
            <html>
            <head><title>Comprobante de Arqueo</title>
            <style>
                body { font-family: 'Courier New', monospace; color: #000; padding: 20px; margin: 0; max-width: 380px; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .sep { border-bottom: 2px dashed #000; margin: 10px 0; }
                .sep-dot { border-bottom: 1px dotted #999; margin: 4px 0; }
                .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
                .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; font-size: 15px; border-top: 2px solid #000; }
                .box { border: 2px solid #000; padding: 12px; text-align: center; margin: 12px 0; }
                .box .amount { font-size: 24px; font-weight: bold; }
                .firma { margin-top: 25px; text-align: center; font-size: 11px; }
                .firma div { margin-bottom: 15px; }
            </style>
            </head>
            <body>
                <div class="center">
                    <div class="bold" style="font-size:18px">COMPROBANTE DE ARQUEO</div>
                    <div style="font-size:14px">Cierre de Turno</div>
                    <div style="font-size:12px; margin-top:5px">${new Date().toLocaleString()}</div>
                </div>
                <div class="sep"></div>
                <div class="row"><span>Cajero:</span><span class="bold">${resumenCierre.cajero || 'Cajero'}</span></div>
                <div class="row"><span>Estación:</span><span class="bold">${resumenCierre.estacion || 'General'}</span></div>
                <div class="sep"></div>
                <div class="row"><span>Fondo de Apertura</span><span class="bold">$${formatCurrency(resumenCierre.apertura)}</span></div>
                <div class="sep-dot"></div>
                <div class="row"><span>Ventas en Efectivo</span><span class="bold">+$${formatCurrency(resumenCierre.ventas_efectivo)}</span></div>
                <div class="sep-dot"></div>
                <div class="row"><span>Ventas Tarjeta/Transf.</span><span class="bold">$${formatCurrency(resumenCierre.ventas_tarjeta)}</span></div>
                <div class="sep-dot"></div>
                <div class="total-row"><span>EFECTIVO ESPERADO</span><span>$${formatCurrency(resumenCierre.efectivo_esperado)}</span></div>
                <div class="total-row" style="border-top:none"><span>EFECTIVO CONTADO</span><span>$${formatCurrency(resumenCierre.efectivo_real)}</span></div>
                <div class="box">
                    <div style="font-size:12px">DIFERENCIA</div>
                    <div class="amount">${resumenCierre.diferencia > 0 ? '+' : ''}$${formatCurrency(resumenCierre.diferencia)}</div>
                    <div style="font-size:11px; margin-top:4px">${resumenCierre.diferencia === 0 ? 'CUADRE PERFECTO' : resumenCierre.diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'}</div>
                </div>
                <div class="sep"></div>
                <div class="firma">
                    <div>Firma del Cajero: ________________________</div>
                    <div>Firma del Supervisor: ________________________</div>
                    <div style="color:#666; margin-top:10px">Documento generado por Sistema POS</div>
                </div>
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 300);
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


            {/* MOSTRAR RESUMEN FINAL SI ACABA DE CERRAR */}
            {resumenCierre && (
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', border: '2px solid var(--primary)', borderRadius: 'var(--radius)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                            <CheckCircle size={32} />
                            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Cierre de Turno Exitoso</h2>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fondo de Apertura</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${formatCurrency(resumenCierre.apertura)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ventas en Efectivo</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${formatCurrency(resumenCierre.ventas_efectivo)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Efectivo Esperado</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>${formatCurrency(resumenCierre.efectivo_esperado)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Efectivo Real (Contado)</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${formatCurrency(resumenCierre.efectivo_real)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Diferencia</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: resumenCierre.diferencia === 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    ${formatCurrency(resumenCierre.diferencia)}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={imprimirArqueo}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    
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
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Estación Física (Caja)</label>
                                    <select 
                                        required
                                        value={selectedEstacion} 
                                        onChange={e => setSelectedEstacion(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-sidebar)', border: '2px solid var(--border)', borderRadius: 'var(--radius)' }}
                                    >
                                        <option value="">-- Seleccione Computadora/Caja --</option>
                                        {estaciones.map(e => (
                                            <option key={e.id} value={e.id}>{e.nombre} - {e.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" style={{ padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1rem' }}>
                                    Iniciar Turno / Abrir Caja
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* SI LA CAJA ESTÁ ABIERTA -> FLUJO DE CIERRE EN 2 PASOS */
                        <>
                            {/* ====== PASO 1: Formulario para ingresar monto contado ====== */}
                            {cierreStep === 'form' && (
                                <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--primary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                            <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--success)', borderRadius: '50%' }}></div>
                                            CAJA ABIERTA
                                        </div>
                                        <h2 style={{ marginBottom: '1.5rem' }}>Paso 1: Contar Efectivo</h2>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Cajero:</span>
                                                <span style={{ fontWeight: '600' }}>{cajaAbierta.usuario_nombre || 'Usuario Actual'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Estación:</span>
                                                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{cajaAbierta.estacion_nombre || 'No asignada'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Apertura:</span>
                                                <span style={{ fontWeight: '600' }}>{new Date(cajaAbierta.fecha_apertura).toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Monto Inicial:</span>
                                                <span style={{ fontWeight: '600' }}>${formatCurrency(cajaAbierta.monto_apertura)}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.9rem', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                                            <AlertTriangle size={16} />
                                            <span>Cuente el efectivo real en su gaveta antes de continuar.</span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleVerificarArqueo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Comentarios (Opcional)</label>
                                            <textarea 
                                                value={observaciones} 
                                                onChange={e => setObservaciones(e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: '80px' }} 
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={loadingPreview}
                                            style={{ padding: '1rem', backgroundColor: '#f59e0b', color: '#000', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loadingPreview ? 0.7 : 1 }}
                                        >
                                            <Eye size={20} /> {loadingPreview ? 'Calculando...' : 'Verificar Arqueo (Pre-Cierre)'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ====== PASO 2: Pre-visualización del arqueo ====== */}
                            {cierreStep === 'preview' && previewData && (
                                <div style={{ backgroundColor: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius)', border: `2px solid ${previewData.diferencia === 0 ? 'var(--success)' : 'var(--danger)'}` }}>
                                    
                                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                        <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                            <Search size={28} /> Pre-Arqueo de Caja
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                            Revise los números antes de confirmar el cierre definitivo.
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Fondo de Apertura</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${formatCurrency(previewData.apertura)}</div>
                                        </div>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Ventas en Efectivo</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>+${formatCurrency(previewData.ventas_efectivo)}</div>
                                        </div>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Ventas Tarjeta / Transf.</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${formatCurrency(previewData.ventas_tarjeta)}</div>
                                        </div>
                                        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                            <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem' }}>Efectivo Esperado en Gaveta</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>${formatCurrency(previewData.efectivo_esperado)}</div>
                                        </div>
                                    </div>

                                    {/* RESULTADO DE DIFERENCIA */}
                                    <div style={{ 
                                        padding: '1.5rem', 
                                        borderRadius: 'var(--radius)', 
                                        textAlign: 'center',
                                        backgroundColor: previewData.diferencia === 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                        border: previewData.diferencia === 0 ? '2px solid rgba(34, 197, 94, 0.3)' : '2px solid rgba(239, 68, 68, 0.3)',
                                        marginBottom: '2rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Usted contó:</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${formatCurrency(previewData.efectivo_real)}</div>
                                            </div>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>vs</div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>El sistema esperaba:</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>${formatCurrency(previewData.efectivo_esperado)}</div>
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: previewData.diferencia === 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {previewData.diferencia === 0 ? '✅ CUADRE PERFECTO' : previewData.diferencia > 0 ? '⚠️ SOBRANTE EN CAJA' : '🔴 FALTANTE EN CAJA'}
                                            </div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: previewData.diferencia === 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {previewData.diferencia > 0 ? '+' : ''}${formatCurrency(previewData.diferencia)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* BOTONES DE ACCIÓN */}
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button 
                                            onClick={handleVolverAContar}
                                            style={{ flex: 1, padding: '1rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        >
                                            <ArrowLeft size={20} /> Volver a Contar
                                        </button>
                                        <button 
                                            onClick={handleConfirmarCierre}
                                            style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--danger)', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        >
                                            <Lock size={20} /> Confirmar Cierre Definitivo
                                        </button>
                                    </div>

                                    {previewData.diferencia !== 0 && (
                                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.9rem' }}>
                                            <AlertTriangle size={18} />
                                            <span>Hay un descuadre. Puede volver a contar o confirmar el cierre con la diferencia registrada.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    
                </div>
            )}
        </div>
    );
};

export default CajaPage;
