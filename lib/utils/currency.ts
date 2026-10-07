export const DEFAULT_CURRENCY = '€';

/**
 * Extracts a numeric value from a price (string or number).
 * Returns NaN if input is undefined, null, empty or cannot be parsed.
 */
export function parsePrice(price: string | number | undefined | null): number {
  if (price === undefined || price === null) return NaN;
  if (typeof price === 'number') return isNaN(price) ? NaN : price;

  const str = String(price).trim();
  if (!str) return NaN;

  // Replace comma with dot and remove non-numeric chars except dot and minus
  const cleaned = str.replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  if (!cleaned) return NaN;

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
