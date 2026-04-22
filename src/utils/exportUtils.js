import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const quoteCsvValue = (value) => {
  if (value === null || value === undefined) return '""';
  const stringValue = String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const normalizeExportValue = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'number') return value;

  const stringValue = String(value).trim();
  if (stringValue === '' || ['N/A', 'ABIERTO'].includes(stringValue.toUpperCase())) {
    return stringValue;
  }

  const plainValue = stringValue
    .replace(/\s/g, '')
    .replace(/Bs\.?/gi, '')
    .replace(/\$/g, '');

  let cleaned = plainValue;

  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');

    if (lastComma > lastDot) {
      // Spanish style: 1.234,56 -> 1234.56
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // English style: 1,234.56 -> 1234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.') && !cleaned.includes(',')) {
    // Dot-only values may be English decimals or thousand-separated groups.
    // Keep dot as decimal if there is only one or if the grouping pattern isn't obvious.
    const dotGroups = cleaned.split('.');
    if (dotGroups.length > 1 && dotGroups.every((group, idx) => idx === 0 || group.length === 3)) {
      cleaned = dotGroups.join('');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Comma-only values may be Spanish decimals or thousand-separated groups.
    const commaGroups = cleaned.split(',');
    if (commaGroups.length === 2 || commaGroups.every((group, idx) => idx === 0 || group.length === 3)) {
      cleaned = commaGroups.join('.');
    }
  }

  if (/^[+-]?\d+(\.\d+)?$/.test(cleaned)) {
    const parsedNumber = Number(cleaned);
    return Number.isNaN(parsedNumber) ? stringValue : parsedNumber;
  }

  return stringValue;
};

const addTotalsRow = (rows, totals, headers) => {
  if (!totals) return rows;
  if (Array.isArray(totals)) {
    return [...rows, totals];
  }

  const totalRow = new Array(headers.length).fill('');
  totalRow[totals.labelIndex || 0] = totals.label || 'Total';

  (totals.values || []).forEach((item) => {
    if (typeof item.index === 'number' && item.index >= 0 && item.index < headers.length) {
      totalRow[item.index] = item.value;
    }
  });

  return [...rows, totalRow];
};

const buildWorksheetColumns = (headers, rows, options = {}) => {
  const widths = options.columnWidths || headers.map((header, index) => {
    const maxCell = rows.reduce((max, row) => {
      const cellValue = row[index] == null ? '' : String(normalizeExportValue(row[index]));
      return Math.max(max, cellValue.length);
    }, String(header).length);

    return Math.min(45, Math.max(14, maxCell + 5));
  });

  return widths.map(width => ({ width }));
};

export const exportCSV = (fileName, headers, rows, options = {}) => {
  const rowsWithTotals = addTotalsRow(rows, options.totals, headers);
  const csvRows = [headers, ...rowsWithTotals].map(row => row.map(quoteCsvValue).join(','));
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, fileName);
};

export const exportXLSX = async (fileName, sheetName, headers, rows, options = {}) => {
  const rowsWithTotals = addTotalsRow(rows, options.totals, headers);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName || 'Reporte');
  const reportTitle = options.title || sheetName || 'Reporte';
  const generatedAt = new Date().toLocaleString('es-ES');

  worksheet.addRow([reportTitle]);
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.getRow(1).alignment = { horizontal: 'center' };
  worksheet.mergeCells(1, 1, 1, headers.length);

  worksheet.addRow([`Emitido: ${generatedAt}`]);
  worksheet.getRow(2).font = { italic: true, size: 10 };
  worksheet.getRow(2).alignment = { horizontal: 'center' };
  worksheet.mergeCells(2, 1, 2, headers.length);

  worksheet.addRow([]);
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  rowsWithTotals.forEach((rowData, rowIndex) => {
    const normalizedRow = rowData.map(normalizeExportValue);
    const row = worksheet.addRow(normalizedRow);
    const isTotalRow = options.totals && rowIndex === rowsWithTotals.length - 1;
    row.eachCell((cell) => {
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (isTotalRow) {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  worksheet.columns = buildWorksheetColumns(headers, rowsWithTotals, options);
  worksheet.views = [{ state: 'frozen', ySplit: 3 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
};

export const exportPDF = (fileName, title, headers, rows, options = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleString('es-ES');

  doc.setFontSize(16);
  doc.setTextColor(20, 34, 51);
  doc.text(title, margin, 40);

  doc.setFontSize(10);
  doc.setTextColor(100, 110, 120);
  doc.text(`Emitido: ${generatedAt}`, margin, 58);

  const tableTop = 72;

  const rowsWithTotals = addTotalsRow(rows, options.totals, headers);

  autoTable(doc, {
    startY: tableTop,
    head: [headers],
    body: rowsWithTotals,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 78, 121],
      textColor: 255,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold'
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [30, 30, 30],
      fontSize: 9,
      valign: 'middle'
    },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    styles: { cellPadding: 6, overflow: 'linebreak' },
    columnStyles: options.columnStyles || {},
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
    showHead: 'everyPage',
    didParseCell: (data) => {
      if (options.totals && data.section === 'body' && data.row.index === rowsWithTotals.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [243, 244, 246];
      }
    },
    didDrawPage: (data) => {
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(120, 130, 140);
      doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
    }
  });

  doc.save(fileName);
};
