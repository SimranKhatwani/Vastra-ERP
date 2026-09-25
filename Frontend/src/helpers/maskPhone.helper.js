/**
 * Masks a phone number so that only the last 4 digits are visible,
 * and all preceding digits are masked with 'X'.
 * 
 * Example: "9876543210"   -> "XXXXXX3210"
 * Example: "+919876543210" -> "XXXXXXXXX3210"
 * Example: "3210"         -> "3210"
 * 
 * Used across POS billing search and selection displays to protect customer privacy
 * while ensuring full unmasked phone numbers remain stored in records, APIs, and generated bills.
 * 
 * @param {string|number} phone - The raw phone number
 * @returns {string} The masked phone string
 */
export const maskPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = String(phone).trim();
  if (cleaned.length <= 4) return cleaned;
  if (/^X+\d{4}$/i.test(cleaned)) return cleaned;

  const last4 = cleaned.slice(-4);
  const prefixLength = Math.max(0, cleaned.length - 4);
  const maskedPrefix = "X".repeat(prefixLength);
  return `${maskedPrefix}${last4}`;
};

export default maskPhoneNumber;
