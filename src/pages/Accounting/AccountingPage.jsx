import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Download, FileText, FileDown, PieChart } from 'lucide-react';
import useAccounting from '../../hooks/useAccounting';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const AccountingPage = () => {
  const { data, resumen, loading, error, fetchLibroVentas, fetchLibroCompras, fetchResumenIva, clearData } = useAccounting();
  
  const [activeTab, setActiveTab] = useState('ventas'); // ventas | compras | iva
  
  // Rango de fechas por defecto: últimos 30 días
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };
  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [fechaInicio, setFechaInicio] = useState(getFirstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(getToday());

  useEffect(() => {
    handleSearch();
  }, [activeTab, fechaInicio, fechaFin]);

  const handleSearch = () => {
    if (activeTab === 'ventas') fetchLibroVentas(fechaInicio, fechaFin);
    else if (activeTab === 'compras') fetchLibroCompras(fechaInicio, fechaFin);
    else if (activeTab === 'iva') fetchResumenIva(fechaInicio, fechaFin);
  };

  const exportToExcel = async () => {
    if (!data || data.length === 0) return alert('No hay datos para exportar');
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS Bodegón';
    const worksheet = workbook.addWorksheet(activeTab === 'ventas' ? 'Libro de Ventas' : 'Libro Compras');

    // Título Principal
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = activeTab === 'ventas' ? 'REPORTE FISCAL - LIBRO DE VENTAS' : 'REPORTE FISCAL - LIBRO DE COMPRAS';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Subtítulo con Fechas
    worksheet.mergeCells('A2:G2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Período consultado: Desde ${fechaInicio} hasta ${fechaFin}`;
    subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF555555' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;
    
    // Fila en blanco
    worksheet.addRow([]);

    // Configurar Encabezados
    let headers = [];
    if (activeTab === 'ventas') {
      headers = ['Fecha', 'Nro Factura', 'Razón Social / Cliente', 'RNC / Cédula', 'Base Imponible', 'IVA Repercutido', 'Total Operación'];
      worksheet.columns = [
        { key: 'fecha', width: 15 },
        { key: 'nro_factura', width: 20 },
        { key: 'cliente', width: 40 },
        { key: 'rnc', width: 20 },
        { key: 'base', width: 20 },
        { key: 'iva', width: 20 },
        { key: 'total', width: 20 }
      ];
    } else {
      headers = ['Fecha', 'Nro Factura', 'Proveedor', 'RNC / Cédula', 'Base Imponible', 'IVA Soportado', 'Total Operación'];
      worksheet.columns = [
        { key: 'fecha', width: 15 },
        { key: 'nro_factura', width: 20 },
        { key: 'cliente', width: 40 },
        { key: 'rnc', width: 20 },
        { key: 'base', width: 20 },
        { key: 'iva', width: 20 },
        { key: 'total', width: 20 }
      ];
    }

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
    headerRow.height = 25;

    // Agregar Datos y Calcular Totales
    let totalBase = 0;
    let totalIva = 0;
    let totalMonto = 0;

    data.forEach((item, index) => {
      let rowData = [];
      const base = parseFloat(item.base_imponible || 0);
      const total = parseFloat(item.total || 0);
      let iva = 0;

      if (activeTab === 'ventas') {
        iva = parseFloat(item.iva_retenido || 0);
        rowData = [
          new Date(item.fecha).toLocaleDateString(),
          item.numero_factura,
          item.cliente_nombre || 'Consumidor Final',
          item.rnc_cedula || 'N/A',
          base,
          iva,
          total
        ];
      } else {
        iva = parseFloat(item.iva_soportado || 0);
        rowData = [
          new Date(item.fecha).toLocaleDateString(),
          item.numero_factura_proveedor,
          item.proveedor_nombre || 'Desconocido',
          item.rnc_cedula || 'N/A',
          base,
          iva,
          total
        ];
      }

      totalBase += base;
      totalIva += iva;
      totalMonto += total;

      const valRow = worksheet.addRow(rowData);
      
      // Estilos para la fila de datos
      const alternateColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB'; // Gris muy claro intercalado
      valRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: alternateColor } };
        cell.border = { top: {style:'thin', color:{argb:'FFEEEEEE'}}, bottom: {style:'thin', color:{argb:'FFEEEEEE'}}, left: {style:'thin', color:{argb:'FFEEEEEE'}}, right: {style:'thin', color:{argb:'FFEEEEEE'}} };
        
        // Centrar las primeras 4 columnas
        if (colNumber <= 4) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          // Moneda y alinear a la derecha para montos
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '"$"#,##0.00';
        }
      });
    });

    // Fila de Totales
    worksheet.addRow([]); // Espaciador
    const totalsRow = worksheet.addRow(['', '', '', 'TOTALES GENERALES', totalBase, totalIva, totalMonto]);
    
    totalsRow.getCell(4).font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
    totalsRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    
    // Formato de totales
    [5, 6, 7].forEach(colIndex => {
      const cell = totalsRow.getCell(colIndex);
      cell.font = { bold: true, size: 12, color: { argb: colIndex === 7 ? 'FF10B981' : 'FF2C3E50' } }; 
      cell.numFmt = '"$"#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0Fdf4' } }; // Verde muy tenue para resaltar
      cell.border = { 
        top: {style:'double', color:{argb:'FF10B981'}}, 
        bottom: {style:'double', color:{argb:'FF10B981'}} 
      };
    });
    totalsRow.height = 30;

    // Descarga
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Libro_${activeTab}_${fechaInicio}_${fechaFin}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Header Container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Libros Contables e Impuestos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Genere reportes fiscales para su contador o autoridad tributaria</p>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem', borderRight: '1px solid var(--border)' }}>
            <Calendar size={18} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Desde:</span>
            <input 
              type="date" 
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              max={fechaFin}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '0.2rem', outline: 'none', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hasta:</span>
            <input 
              type="date" 
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '0.2rem', outline: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('ventas')}
          style={{ padding: '0.75rem 1.5rem', borderBottom: activeTab === 'ventas' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'ventas' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'ventas' ? '600' : '400', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={18}/> Libro de Ventas
        </button>
        <button 
          onClick={() => setActiveTab('compras')}
          style={{ padding: '0.75rem 1.5rem', borderBottom: activeTab === 'compras' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'compras' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'compras' ? '600' : '400', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileDown size={18}/> Libro de Compras
        </button>
        <button 
          onClick={() => setActiveTab('iva')}
          style={{ padding: '0.75rem 1.5rem', borderBottom: activeTab === 'iva' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'iva' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'iva' ? '600' : '400', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PieChart size={18}/> Resumen IVA
        </button>
      </div>

      {error && <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)' }}>{error}</div>}

      {/* Content Area */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Actions bar for tabular data */}
        {(activeTab === 'ventas' || activeTab === 'compras') && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
            <button 
              onClick={exportToExcel}
              disabled={loading || data.length === 0}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (loading || data.length === 0) ? 0.5 : 1 }}
            >
              <Download size={18} />
              Exportar a Excel
            </button>
          </div>
        )}

        {/* Tab Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos contables...</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            
            {activeTab === 'ventas' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Factura Nº</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>RNC / Cédula</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Base Imp.</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>IVA</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No hay ventas registradas en este período</td></tr>
                  ) : (
                    data.map((v, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>{new Date(v.fecha).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem' }}>{v.numero_factura}</td>
                        <td style={{ padding: '1rem' }}>{v.cliente_nombre || 'Consumidor Final'}</td>
                        <td style={{ padding: '1rem' }}>{v.rnc_cedula || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>${parseFloat(v.base_imponible).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary)' }}>${parseFloat(v.iva_retenido).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(v.total).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'compras' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Factura Prov.</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Proveedor</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>RNC</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Base Imp.</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>IVA Soportado</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No hay compras registradas en este período</td></tr>
                  ) : (
                    data.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>{new Date(c.fecha).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem' }}>{c.numero_factura_proveedor}</td>
                        <td style={{ padding: '1rem' }}>{c.proveedor_nombre}</td>
                        <td style={{ padding: '1rem' }}>{c.rnc_cedula || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>${parseFloat(c.base_imponible).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--info)' }}>${parseFloat(c.iva_soportado).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(c.total).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'iva' && resumen && (
              <div style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Posición de IVA Mensual</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '800px' }}>
                  
                  <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>IVA Retenido (Ventas)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>${parseFloat(resumen.debito_fiscal).toFixed(2)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Base Ventas: ${parseFloat(resumen.total_ventas_base).toFixed(2)}</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>IVA Soportado (Compras)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info)' }}>${parseFloat(resumen.credito_fiscal).toFixed(2)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Base Compras: ${parseFloat(resumen.total_compras_base).toFixed(2)}</div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>Cuota Tributaria Neta</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {resumen.cuota_tributaria > 0 
                          ? 'Monto a pagar a la autoridad tributaria por las operaciones del mes.' 
                          : 'Crédito fiscal a favor para el mes siguiente.'}
                      </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: resumen.cuota_tributaria > 0 ? 'var(--danger)' : '#10b981' }}>
                      ${Math.abs(resumen.cuota_tributaria).toFixed(2)}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingPage;
