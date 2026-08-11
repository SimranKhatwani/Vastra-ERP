// utils/columnNormalizer.js
/**
 * Normalizes a header string: trim, lower‑case, replace spaces and punctuation with empty string.
 */
function normalizeHeader(header) {
  if (!header) return '';
  return header
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Builds a mapping from normalized header to original header.
 * @param {string[]} headers - array of header strings from the sheet.
 * @returns {Object} map where key is normalized header and value is original header.
 */
function mapHeaders(headers) {
  const map = {};
  headers.forEach((h) => {
    const norm = normalizeHeader(h);
    if (norm) map[norm] = h;
  });
  return map;
}

module.exports = { normalizeHeader, mapHeaders };
