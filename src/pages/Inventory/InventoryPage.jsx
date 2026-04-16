import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, AlertTriangle, ArrowDownUp, Calendar, X, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import useSettings from '../../hooks/useSettings';
import api from '../../api/api';
import { formatCurrency, formatQty } from '../../utils/format';

const InventoryPage = () => {
  const { settings, fetchSettings } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'ascending' });
  const [searchParams] = useSearchParams();
  const filtroParam = searchParams.get('filtro');

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, [fetchSettings]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      setError('Error al obtener inventario');
    } finally {
      setLoading(false);
    }
  };

  const currentMargen = settings?.margen_vencimiento || 30;

  const exportExpirations = async () => {
    const nextVenc = products.filter(p => {
      if (!p.fecha_vencimiento) return false;
      const today = new Date();
      const venc = new Date(p.fecha_vencimiento);
      const diffDays = Math.ceil((venc - today) / (1000 * 60 * 60 * 24));
      return diffDays <= currentMargen;
    });

    if (nextVenc.length === 0) return alert('No hay productos próximos a vencer para exportar');
    
    // ... rest of exportExpirations (using same currentMargen if needed below)

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vencimientos');

    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE PRODUCTOS PRÓXIMOS A VENCER';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.getRow(3).values = ['Producto', 'Proveedor', 'Stock', 'Fecha Vencimiento', 'Estado'];
    worksheet.getRow(3).font = { bold: true };
    worksheet.columns = [
      { key: 'nombre', width: 40 },
      { key: 'proveedor', width: 30 },
      { key: 'stock', width: 10 },
      { key: 'vencimiento', width: 20 },
      { key: 'status', width: 15 }
    ];

    nextVenc.forEach(p => {
      const today = new Date();
      const venc = new Date(p.fecha_vencimiento);
      const isExpired = venc <= today;
      
      worksheet.addRow({
        nombre: p.nombre,
        proveedor: p.proveedor_nombre || 'S/N',
        stock: p.stock,
        vencimiento: venc.toLocaleDateString(),
        status: isExpired ? 'VENCIDO' : 'PRONTO'
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Vencimientos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        // Handle numbers vs strings
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  const filteredProducts = useMemo(() => {
    return sortedProducts.filter(p => {
      // Filtro por término de búsqueda
      const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.codigo_barras && p.codigo_barras.includes(searchTerm)) ||
        (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtro por parámetros de la URL (desde el Dashboard)
      if (filtroParam === 'stock') {
        return p.stock <= p.min_stock;
      }
      if (filtroParam === 'vencimiento') {
        if (!p.fecha_vencimiento) return false;
        const today = new Date();
        const venc = new Date(p.fecha_vencimiento);
        const diffDays = Math.ceil((venc - today) / (1000 * 60 * 60 * 24));
        return diffDays <= currentMargen;
      }

      return true;
    });
  }, [sortedProducts, searchTerm, filtroParam]);

  // Totals calculation
  const totals = useMemo(() => {
    let totalItems = 0;
    let totalCosto = 0;
    let totalVenta = 0;
    let lowStock = 0;
    let expiredCount = 0;

    products.forEach(p => {
      totalItems += p.stock;
      totalCosto += (p.stock * p.precio_costo);
      totalVenta += (p.stock * p.precio_venta);
      if (p.stock <= p.min_stock) lowStock++;
      
      if (p.fecha_vencimiento) {
        const today = new Date();
        const venc = new Date(p.fecha_vencimiento);
        const diffDays = Math.ceil((venc - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= currentMargen) expiredCount++;
      }
    });

    return { totalItems, totalCosto, totalVenta, lowStock, expiredCount, profit: totalVenta - totalCosto };
  }, [products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Control de Inventario</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monitoree el stock y evalúe la valoración de su mercancía</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'uppercase' }}>Productos Bajo Stock</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: totals.lowStock > 0 ? 'var(--danger)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {totals.lowStock} {totals.lowStock > 0 && <AlertTriangle size={24} />}
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'uppercase' }}>Valor Inventario (Costo)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>${formatCurrency(totals.totalCosto)}</div>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Bs. {formatCurrency(totals.totalCosto * (settings?.tasa_dolar || 1))}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'uppercase' }}>Valor Estimado (Venta)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>${formatCurrency(totals.totalVenta)}</div>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Bs. {formatCurrency(totals.totalVenta * (settings?.tasa_dolar || 1))}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'uppercase' }}>Próximos a Vencer</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: totals.expiredCount > 0 ? 'var(--danger)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {totals.expiredCount} {totals.expiredCount > 0 && <Calendar size={24} />}
          </div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar producto o categoría..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
        </div>

        {filtroParam && (
          <button 
            onClick={() => window.location.href = '/inventario'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 1rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Filtro: {filtroParam === 'vencimiento' ? 'Vencimientos' : 'Bajo Stock'}
            <X size={14} />
          </button>
        )}
        </div>

        <button 
          onClick={exportExpirations}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.6rem 1.25rem', 
            backgroundColor: '#C0392B', 
            color: 'white',
            fontWeight: '600',
            borderRadius: 'var(--radius)'
          }}
        >
          <Download size={18} />
          Reporte Vencimientos
        </button>
      </div>

      {/* Data Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando inventario...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                  <th onClick={() => handleSort('nombre')} style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Producto <ArrowDownUp size={12}/>
                  </th>
                  <th onClick={() => handleSort('categoria_nombre')} style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Categoría <ArrowDownUp size={12}/>
                  </th>
                  <th onClick={() => handleSort('stock')} style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center' }}>
                    Stock <ArrowDownUp size={12}/>
                  </th>
                  <th onClick={() => handleSort('precio_costo')} style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'right' }}>
                    Costo U. <ArrowDownUp size={12}/>
                  </th>
                  <th onClick={() => handleSort('precio_venta')} style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'right' }}>
                    Precio V. <ArrowDownUp size={12}/>
                  </th>
                  <th onClick={() => handleSort('fecha_vencimiento')} style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center' }}>
                    Vencimiento <ArrowDownUp size={12}/>
                  </th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Costo (Bs / $)</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Venta (Bs / $)</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Valor Total Bs.</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron productos en el inventario.</td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLowStock = p.stock <= p.min_stock;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: isLowStock ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                          <div>{p.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.codigo_barras || 'S/N'}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{p.categoria_nombre || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: isLowStock ? 'var(--danger)' : 'var(--text-main)' }}>
                          {formatQty(p.stock)} {p.unidad}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ fontWeight: '600' }}>Bs. {formatCurrency(parseFloat(p.precio_costo) * (settings?.tasa_dolar || 1))}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${formatCurrency(p.precio_costo)}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: 'var(--primary)' }}>Bs. {formatCurrency(parseFloat(p.precio_venta) * (settings?.tasa_dolar || 1))}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${formatCurrency(p.precio_venta)}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {p.fecha_vencimiento ? (
                            (() => {
                              const today = new Date();
                              const venc = new Date(p.fecha_vencimiento);
                              const diffDays = Math.ceil((venc - today) / (1000 * 60 * 60 * 24));
                              let color = 'var(--text-main)';
                              if (diffDays <= 0) color = 'var(--danger)';
                              else if (diffDays <= currentMargen) color = '#fbbf24'; // Orange
                              
                              return (
                                <span style={{ 
                                  color, 
                                  fontWeight: diffDays <= currentMargen ? 'bold' : 'normal',
                                  fontSize: '0.85rem'
                                }}>
                                  {venc.toLocaleDateString()}
                                  {diffDays <= 0 && ' (VENCIDO)'}
                                </span>
                              );
                            })()
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin fecha</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                          <div>Bs. {formatCurrency(p.stock * p.precio_costo * (settings?.tasa_dolar || 1))}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>${formatCurrency(p.stock * p.precio_costo)}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
