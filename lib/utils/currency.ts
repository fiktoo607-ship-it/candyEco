export const DEFAULT_CURRENCY = '€';

/**
 * Extracts a numeric value from a price (string or number).
 * Correctly handles decimal commas (e.g. "1,8€" -> 1.8),
 * currency codes and symbols (e.g. "1.80 DA", "$12.50", "12,50 €"),
 * and thousand separators (e.g. "1 250,50 €", "1,250.50 $").
 * Returns NaN if input is undefined, null, empty or cannot be parsed.
 */
export function parsePrice(price: string | number | undefined | null): number {
  if (price === undefined || price === null) return NaN;
  if (typeof price === 'number') return isNaN(price) ? NaN : price;

  const str = String(price).trim();
  if (!str) return NaN;

  // Strip anything that is not digit, dot, comma, or minus
  let cleaned = str.replace(/[^0-9.,-]/g, '').trim();
  if (!cleaned) return NaN;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // e.g. "1.250,50" -> dot is thousand separator, comma is decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // e.g. "1,250.50" -> comma is thousand separator, dot is decimal
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // e.g. "1,8" -> comma is decimal separator
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? NaN : num;
}

/**
 * Normalizes a price into a pure decimal string format (e.g., "45.00"),
 * completely stripped of manual currency symbols ($ or € or £).
 * Throws an Error if the price is invalid or negative.
 */
export function normalizePrice(price: string | number | undefined | null): string {
  const num = parsePrice(price);
  if (isNaN(num) || num < 0) {
    throw new Error('Le prix doit être un nombre positif valide.');
  }
  return num.toFixed(2);
}

/**
 * Formats a numeric or string price using the unified site currency.
 * Eliminates discrepancy between $ and € by strictly rendering the standard currency.
 * Guarantees no "NaN" is ever rendered.
 */
export function formatCurrency(
  price: string | number | undefined | null,
  currency: string = DEFAULT_CURRENCY
): string {
  if (price === undefined || price === null || price === '') return '—';

  const num = parsePrice(price);
  if (isNaN(num)) {
    return '—';
  }

  return `${num.toFixed(2)} ${currency}`;
}
