import JSZip from 'jszip';

export const extractImagesFromExcel = async (file) => {
  const images = {}; // Format: { [rowIndex]: { [colIndex]: "data:image/jpeg;base64,..." } }

  try {
    const zip = await JSZip.loadAsync(file);

    // Find all drawing xml files (e.g. xl/drawings/drawing1.xml, drawing2.xml, etc.)
    const drawingFiles = Object.keys(zip.files).filter(path => /^xl\/drawings\/drawing\d+\.xml$/i.test(path));

    for (const drawingPath of drawingFiles) {
      const drawingFile = zip.file(drawingPath);
      const relsPath = drawingPath.replace(/drawing(\d+)\.xml$/i, '_rels/drawing$1.xml.rels');
      const relsFile = zip.file(relsPath);

      if (!drawingFile || !relsFile) continue;

      const drawingXml = await drawingFile.async('text');
      const relsXml = await relsFile.async('text');

      // Parse rels mapping: Id -> Target
      const relsMapping = {};
      const relsRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/gi;
      let relMatch;
      while ((relMatch = relsRegex.exec(relsXml)) !== null) {
        relsMapping[relMatch[1]] = relMatch[2];
      }

      // Match anchors: twoCellAnchor, oneCellAnchor
      const anchorRegex = /<(?:xdr:)?(?:twoCellAnchor|oneCellAnchor)[^>]*>([\s\S]*?)<\/(?:xdr:)?(?:twoCellAnchor|oneCellAnchor)>/gi;
      let anchorMatch;

      while ((anchorMatch = anchorRegex.exec(drawingXml)) !== null) {
        const anchorContent = anchorMatch[1];

        // Extract <from> row and col
        const fromMatch = /<(?:xdr:)?from>[\s\S]*?<(?:xdr:)?col>(\d+)<\/(?:xdr:)?col>[\s\S]*?<(?:xdr:)?row>(\d+)<\/(?:xdr:)?row>[\s\S]*?<\/(?:xdr:)?from>/i.exec(anchorContent);
        if (!fromMatch) continue;

        const col = parseInt(fromMatch[1], 10);
        const row = parseInt(fromMatch[2], 10);

        // Extract embed rId
        const blipMatch = /<(?:a:)?blip[^>]+(?:r:embed|embed)="([^"]+)"/i.exec(anchorContent);
        if (!blipMatch) continue;

        const rId = blipMatch[1];
        const mediaPathRaw = relsMapping[rId];
        if (!mediaPathRaw) continue;

        // Resolve media path relative to xl/
        let mediaPath = mediaPathRaw;
        if (mediaPath.startsWith('../')) {
          mediaPath = mediaPath.replace(/^\.\.\//, 'xl/');
        } else if (!mediaPath.startsWith('xl/')) {
          mediaPath = 'xl/' + mediaPath.replace(/^\//, '');
        }

        const mediaFile = zip.file(mediaPath);
        if (mediaFile) {
          const base64Data = await mediaFile.async('base64');
          let mimeType = 'image/jpeg';
          const lowerPath = mediaPath.toLowerCase();
          if (lowerPath.endsWith('.png')) mimeType = 'image/png';
          else if (lowerPath.endsWith('.gif')) mimeType = 'image/gif';
          else if (lowerPath.endsWith('.webp')) mimeType = 'image/webp';
          else if (lowerPath.endsWith('.svg')) mimeType = 'image/svg+xml';
          else if (lowerPath.endsWith('.bmp')) mimeType = 'image/bmp';

          if (!images[row]) images[row] = {};
          images[row][col] = `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting embedded Excel images:', error);
  }

  return images;
};
