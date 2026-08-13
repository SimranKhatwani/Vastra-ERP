import JSZip from 'jszip';

export const extractImagesFromExcel = async (file) => {
  const images = {}; // Format: { [rowIndex]: { [colIndex]: "base64..." } }
  
  try {
    const zip = await JSZip.loadAsync(file);
    
    // Check if drawings exist
    const drawingFile = zip.file('xl/drawings/drawing1.xml');
    const relsFile = zip.file('xl/drawings/_rels/drawing1.xml.rels');
    
    if (!drawingFile || !relsFile) {
      return images;
    }
    
    const drawingXml = await drawingFile.async('text');
    const relsXml = await relsFile.async('text');
    
    // Parse rels mapping rId -> target media path
    const relsMapping = {};
    const relsRegex = /<Relationship Id="([^"]+)" Type="[^"]+" Target="([^"]+)"/g;
    let relMatch;
    while ((relMatch = relsRegex.exec(relsXml)) !== null) {
      relsMapping[relMatch[1]] = relMatch[2]; // e.g., rId1 -> ../media/image1.jpeg
    }
    
    // Parse drawing anchors
    const anchorRegex = /<xdr:(?:twoCellAnchor|oneCellAnchor)[^>]*>[\s\S]*?<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>[\s\S]*?<\/xdr:from>[\s\S]*?<a:blip[^>]*?r:embed="([^"]+)"/g;
    
    let match;
    while ((match = anchorRegex.exec(drawingXml)) !== null) {
      const col = parseInt(match[1], 10);
      const row = parseInt(match[2], 10);
      const rId = match[3];
      
      const mediaPathRaw = relsMapping[rId];
      if (mediaPathRaw) {
        // mediaPathRaw might be "../media/image1.jpeg"
        const mediaPath = mediaPathRaw.replace('../', 'xl/');
        const mediaFile = zip.file(mediaPath);
        
        if (mediaFile) {
          const base64Data = await mediaFile.async('base64');
          
          let mimeType = 'image/jpeg';
          if (mediaPath.endsWith('.png')) mimeType = 'image/png';
          else if (mediaPath.endsWith('.gif')) mimeType = 'image/gif';
          
          if (!images[row]) images[row] = {};
          images[row][col] = `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
  } catch (error) {
    console.error('Error extracting embedded Excel images:', error);
  }
  
  return images;
};
