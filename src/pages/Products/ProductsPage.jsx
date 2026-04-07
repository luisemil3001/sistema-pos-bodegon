import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import useProducts from '../../hooks/useProducts';
import ProductModal from './ProductModal';

const ProductsPage = () => {
  const { products, categories, loading, error, fetchProducts, fetchCategories, addProduct, updateProduct, deleteProduct } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleOpenNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Está seguro que desea eliminar el producto "${name}"?`)) {
      const res = await deleteProduct(id);
      if (!res.success) alert(res.message);
    }
  };

  const handleSaveModal = async (productData) => {
    if (editingProduct) {
      return await updateProduct(editingProduct.id, productData);
    } else {
      return await addProduct(productData);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.codigo_barras && p.codigo_barras.includes(searchTerm))
  );

  const exportToExcel = async () => {
    if (!products || products.length === 0) return alert('No hay productos para exportar');
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS Bodegón';
    const worksheet = workbook.addWorksheet('Inventario');

    // Título Principal
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE INVENTARIO ACTUAL';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Subtítulo con Fechas
    worksheet.mergeCells('A2:G2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Emitido: ${new Date().toLocaleString()}`;
    subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF555555' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;
    
    // Fila en blanco
    worksheet.addRow([]);

    // Configurar Encabezados
    const headers = ['Código de Barras', 'Nombre del Producto', 'Categoría', 'Unidad', 'Costo Unit.', 'Venta Unit.', 'Stock Actual'];
    worksheet.columns = [
      { key: 'codigo', width: 20 },
      { key: 'nombre', width: 40 },
      { key: 'categoria', width: 25 },
      { key: 'unidad', width: 15 },
      { key: 'costo', width: 18 },
      { key: 'venta', width: 18 },
      { key: 'stock', width: 15 }
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
    headerRow.height = 25;

    // Agregar Datos
    let totalCostoInventario = 0;
    let totalVentaInventario = 0;

    const listToExport = filteredProducts.length > 0 ? filteredProducts : products;

    listToExport.forEach((item, index) => {
      const costo = parseFloat(item.precio_costo || 0);
      const venta = parseFloat(item.precio_venta || 0);
      const stock = parseInt(item.stock || 0);

      totalCostoInventario += (costo * stock);
      totalVentaInventario += (venta * stock);

      const rowData = [
        item.codigo_barras || 'N/A',
        item.nombre,
        item.categoria_nombre || 'Sin Categoría',
        item.unidad || 'Unid',
        costo,
        venta,
        stock
      ];

      const valRow = worksheet.addRow(rowData);
      
      const alternateColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB';
      valRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: alternateColor } };
        cell.border = { top: {style:'thin', color:{argb:'FFEEEEEE'}}, bottom: {style:'thin', color:{argb:'FFEEEEEE'}}, left: {style:'thin', color:{argb:'FFEEEEEE'}}, right: {style:'thin', color:{argb:'FFEEEEEE'}} };
        
        if (colNumber <= 4) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 5 || colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '"$"#,##0.00';
        } else if (colNumber === 7) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { bold: true, color: { argb: stock <= (item.min_stock||5) ? 'EF4444' : '22C55E' } };
        }
      });
    });

    // Fila de Totales de Valoración
    worksheet.addRow([]);
    const totalsRow = worksheet.addRow(['', '', '', 'VALOR TOTAL INVENTARIO:', totalCostoInventario, totalVentaInventario, '']);
    
    totalsRow.getCell(4).font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
    totalsRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    
    [5, 6].forEach(colIndex => {
      const cell = totalsRow.getCell(colIndex);
      cell.font = { bold: true, size: 12, color: { argb: colIndex === 6 ? 'FF10B981' : 'FF3B82F6' } }; 
      cell.numFmt = '"$"#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colIndex === 6 ? 'FFF0Fdf4' : 'FFE3F2FD' } };
      cell.border = { top: {style:'double'}, bottom: {style:'double'} };
    });
    totalsRow.height = 30;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Listado_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Catálogo de Productos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestione su inventario, precios y categorías</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={exportToExcel}
            style={{ 
              backgroundColor: 'var(--success)', 
              color: 'var(--bg-main)', 
              padding: '0.6rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              border: '1px solid var(--success)'
            }}
            title="Exportar listado a Excel"
          >
            <Download size={18} />
            Exportar Excel
          </button>
          
          <button 
            onClick={handleOpenNew}
            style={{ 
              backgroundColor: 'var(--primary)', 
              color: 'var(--bg-main)', 
              padding: '0.6rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filters & Errors */}
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código de barras..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: 'var(--radius)', 
        border: '1px solid var(--border)',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading && products.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando productos...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Código</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Nombre</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Categoría</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Precio</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Stock</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{p.codigo_barras || '-'}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{p.nombre}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          backgroundColor: 'rgba(56, 189, 248, 0.1)', 
                          color: 'var(--primary)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.8rem' 
                        }}>
                          {p.categoria_nombre || 'Sin Categoría'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span>${parseFloat(p.precio_venta).toFixed(2)}</span>
                          {p.aplica_iva ? (
                            <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '500' }}>+ IVA</span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Exento</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          color: p.stock <= p.min_stock ? 'var(--danger)' : 'var(--success)',
                          fontWeight: '600'
                        }}>
                          {p.stock} {p.unidad}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            style={{ padding: '0.4rem', backgroundColor: 'transparent', color: 'var(--info)', border: '1px solid var(--border)' }}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id, p.nombre)}
                            style={{ padding: '0.4rem', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--border)' }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct} 
        onSave={handleSaveModal}
        categories={categories}
      />
    </div>
  );
};

export default ProductsPage;
