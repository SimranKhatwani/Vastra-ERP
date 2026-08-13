const ExcelJS = require('exceljs');
const fs = require('fs');
const JSZip = require('jszip');

async function extractImagesFromExcel(filePath) {
  const file = fs.readFileSync(filePath);
  const images = {};
  
  try {
    const zip = await JSZip.loadAsync(file);
    const drawingFile = zip.file('xl/drawings/drawing1.xml');
    const relsFile = zip.file('xl/drawings/_rels/drawing1.xml.rels');
    
    if (!drawingFile || !relsFile) {
        console.log("No drawings found");
        return images;
    }
    
    const drawingXml = await drawingFile.async('text');
    const relsXml = await relsFile.async('text');
    
    const relsMapping = {};
    const relsRegex = /<Relationship Id="([^"]+)" Type="[^"]+" Target="([^"]+)"/g;
    let relMatch;
    while ((relMatch = relsRegex.exec(relsXml)) !== null) {
      relsMapping[relMatch[1]] = relMatch[2];
    }
    
    const anchorRegex = /<xdr:(?:twoCellAnchor|oneCellAnchor)>[\s\S]*?<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>[\s\S]*?<\/xdr:from>[\s\S]*?<a:blip[^>]*?r:embed="([^"]+)"/g;
    
    let match;
    while ((match = anchorRegex.exec(drawingXml)) !== null) {
      const col = parseInt(match[1], 10);
      const row = parseInt(match[2], 10);
      const rId = match[3];
      
      const mediaPathRaw = relsMapping[rId];
      if (mediaPathRaw) {
        const mediaPath = mediaPathRaw.replace('../', 'xl/');
        const mediaFile = zip.file(mediaPath);
        
        if (mediaFile) {
          const base64Data = await mediaFile.async('base64');
          if (!images[row]) images[row] = {};
          images[row][col] = `data:image/jpeg;base64,${base64Data.slice(0, 50)}...`; // truncated for log
        }
      }
    }
  } catch (error) {
    console.error('Error extracting embedded Excel images:', error);
  }
  
  return images;
}

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('My Sheet');

  sheet.columns = [
    { header: 'Id', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 32 },
    { header: 'Image', key: 'image', width: 20 }
  ];

  sheet.addRow({id: 1, name: 'Product A'});
  sheet.addRow({id: 2, name: 'Product B'});

  const imageId1 = workbook.addImage({
    base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    extension: 'png',
  });

  sheet.addImage(imageId1, {
    tl: { col: 2, row: 1 },
    ext: { width: 50, height: 50 }
  });

  await workbook.xlsx.writeFile('test.xlsx');
  console.log('Created test.xlsx');
  
  const extracted = await extractImagesFromExcel('test.xlsx');
  console.log('Extracted Images:', extracted);
}

createTestExcel();
