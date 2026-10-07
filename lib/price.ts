import { formatCurrency, parsePrice, normalizePrice, DEFAULT_CURRENCY } from './utils/currency';

export const CURRENCY_SYMBOL = DEFAULT_CURRENCY;

export { formatCurrency, parsePrice, normalizePrice };

/**
 * Formats a price string or number into the requested format:
 * "value €" (aligned with Euro-style placement, replacing $ with €).
 */
export function formatPrice(price: string | number | undefined | null): string {
  return formatCurrency(price, CURRENCY_SYMBOL);
}
