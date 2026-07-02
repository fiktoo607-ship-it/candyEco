/**
 * Formats a price string or number into the requested format:
 * "value £" (aligned with Euro-style placement, replacing $ with £).
 */
export function formatPrice(price: string | number | undefined | null): string {
  if (price === undefined || price === null) return '—';
  
  if (typeof price === 'number') {
    return `${price.toFixed(2)} £`;
  }
  
  // Extract digits and dot
  const cleaned = price.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) {
    // If it cannot be parsed as a number, just replace $ with £
    return price.replace(/\$/g, '£');
  }
  
  return `${num.toFixed(2)} £`;
}
