const path = require('path');
const XLSX = require('xlsx');
const filePath = path.resolve(__dirname, '..', 'testdata', 'sample.xlsx');
const wb = XLSX.readFile(filePath);
console.log('Sheet Names:', wb.SheetNames);
wb.SheetNames.forEach(s => {
  const data = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1 });
  console.log('\n=== Sheet: ' + s + ' ===');
  console.log('Headers:', JSON.stringify(data[0]));
  console.log('Row count:', data.length - 1);
  if (data.length > 1) console.log('Sample row 1:', JSON.stringify(data[1]));
  if (data.length > 2) console.log('Sample row 2:', JSON.stringify(data[2]));
});
