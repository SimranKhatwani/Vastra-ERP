/**
 * Helper to convert array of objects into CSV string or JSON structure ready for Excel export
 */

const exportToCSV = (data = [], fields = []) => {
  if (!data || !data.length) return '';

  const headers = fields.length > 0 ? fields : Object.keys(data[0]);
  const csvRows = [];

  // Header line
  csvRows.push(headers.join(','));

  // Data lines
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      // Escape double quotes and enclose in quotes
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

const formatExportData = (data = [], format = 'json') => {
  if (format.toLowerCase() === 'csv') {
    return {
      contentType: 'text/csv',
      content: exportToCSV(data)
    };
  }
  return {
    contentType: 'application/json',
    content: data
  };
};

module.exports = {
  exportToCSV,
  formatExportData
};
