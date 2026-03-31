import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, ArrowDownUp } from 'lucide-react';
import api from '../../api/api';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'ascending' });

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const filteredProducts = sortedProducts.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.codigo_barras && p.codigo_barras.includes(searchTerm)) ||
    (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Totals calculation
  const totals = useMemo(() => {
    let totalItems = 0;
    let totalCosto = 0;
    let totalVenta = 0;
    let lowStock = 0;

    products.forEach(p => {
      totalItems += p.stock;
      totalCosto += (p.stock * p.precio_costo);
      totalVenta += (p.stock * p.precio_venta);
      if (p.stock <= p.min_stock) lowStock++;
    });

    return { totalItems, totalCosto, totalVenta, lowStock, profit: totalVenta - totalCosto };
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
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>${totals.totalCosto.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'uppercase' }}>Valor Estimado (Venta)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>${totals.totalVenta.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'uppercase' }}>Ganancia Proyectada</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#22c55e' }}>${totals.profit.toFixed(2)}</div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
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
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Valor Total</th>
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
                          {p.stock} {p.unidad}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)' }}>${parseFloat(p.precio_costo).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary)' }}>${parseFloat(p.precio_venta).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>${(p.stock * p.precio_costo).toFixed(2)}</td>
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
