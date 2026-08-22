import JsBarcode from 'jsbarcode';

/**
 * Generates an SVG string representation of a Code 128 barcode
 * @param {string} text - The value to encode in Code 128 (e.g. invoiceNo)
 * @param {object} options - Customization options (height, width, displayValue, fontSize)
 * @returns {string} - Clean SVG HTML string containing the Code 128 barcode
 */
export const generateCode128SvgString = (text, options = {}) => {
  if (!text) return '';

  const {
    width = 1.5,
    height = 42,
    displayValue = true,
    fontSize = 11,
    font = 'monospace',
    textAlign = 'center',
    textPosition = 'bottom',
    textMargin = 2,
    margin = 4,
    background = '#ffffff',
    lineColor = '#000000'
  } = options;

  try {
    // Create an off-screen SVG container in browser DOM
    if (typeof document !== 'undefined') {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svgNode, String(text).trim(), {
        format: 'CODE128',
        width,
        height,
        displayValue,
        font,
        fontSize,
        textAlign,
        textPosition,
        textMargin,
        margin,
        background,
        lineColor
      });
      return svgNode.outerHTML;
    }
  } catch (err) {
    console.error('[generateCode128SvgString] Barcode generation failed for:', text, err);
  }

  // Fallback if DOM is not present or parsing fails
  return `<div style="font-family: monospace; font-size: 12px; font-weight: bold; text-align: center; border: 1px dashed #999; padding: 4px;">*${text}*</div>`;
};

export default generateCode128SvgString;
