import XLSX from 'xlsx';

const formatValue = (value, formatter) => {
  if (value === null || value === undefined) return '';

  switch (formatter) {
    case 'date':
      return value ? new Date(value).toLocaleDateString('en-IN') : '';
    case 'datetime':
      return value ? new Date(value).toLocaleString('en-IN') : '';
    case 'boolean':
      return value === true ? 'Yes' : value === false ? 'No' : '';
    case 'percent':
      return typeof value === 'number' ? `${value}%` : value;
    case 'number':
      return typeof value === 'number' ? value : value;
    default:
      return value;
  }
};

const sanitizeSheetName = (name) => String(name).replace(/[:\\/?*\[\]]/g, '-').substring(0, 31);

export const buildExportRows = (definition, selectedFields, rows) => {
  const fields = selectedFields
    .map(key => definition.fields.find(f => f.key === key))
    .filter(Boolean);

  return rows.map(row => {
    const exported = {};
    for (const field of fields) {
      const label = field.label;
      const rawValue = row[field.key];
      exported[label] = formatValue(rawValue, field.formatter);
    }
    return exported;
  });
};

export const generateExcelBuffer = (definition, selectedFields, rows, sheetName = 'Report') => {
  const fields = selectedFields
    .map(key => definition.fields.find(f => f.key === key))
    .filter(Boolean);

  const headers = fields.map(f => f.label);
  const data = rows.map(row => {
    return fields.map(f => formatValue(row[f.key], f.formatter));
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths based on field width hints
  worksheet['!cols'] = fields.map(f => ({ wch: Math.min(Math.max(f.width || 18, 8), 60) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheetName));

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

export const sendExcel = (res, buffer, filename) => {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

export const generateFilename = (definition, suffix = '') => {
  const base = definition.name.replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${base}_Report${suffix ? '_' + suffix : ''}_${timestamp}.xlsx`;
};
