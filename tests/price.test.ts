import { describe, it, expect } from 'vitest';
import { formatPrice, CURRENCY_SYMBOL, formatCurrency, normalizePrice, parsePrice } from '@/lib/price';

describe('Price and Currency Helpers', () => {
  it('should centralize currency symbol to Euro', () => {
    expect(CURRENCY_SYMBOL).toBe('€');
  });

  describe('formatPrice and formatCurrency', () => {
    it('should format number values correctly as Euro', () => {
      expect(formatPrice(10)).toBe('10.00 €');
      expect(formatPrice(5.5)).toBe('5.50 €');
      expect(formatPrice(99.99)).toBe('99.99 €');
      expect(formatCurrency(10)).toBe('10.00 €');
      expect(formatCurrency(5.5)).toBe('5.50 €');
    });

    it('should format string values correctly as Euro', () => {
      expect(formatPrice('45')).toBe('45.00 €');
      expect(formatPrice('45.50')).toBe('45.50 €');
      expect(formatCurrency('45.50')).toBe('45.50 €');
    });

    it('should replace dollar or pound characters with Euro, preventing mixed currencies', () => {
      expect(formatPrice('$12')).toBe('12.00 €');
      expect(formatPrice('12 £')).toBe('12.00 €');
      expect(formatPrice('$12.50 £')).toBe('12.50 €');
      expect(formatCurrency('$12.50')).toBe('12.50 €');
    });

    it('should handle comma decimals', () => {
      expect(formatCurrency('12,50')).toBe('12.50 €');
      expect(formatCurrency('12,50 €')).toBe('12.50 €');
    });

    it('should return default fallback and never output NaN for invalid or empty inputs', () => {
      expect(formatPrice(undefined)).toBe('—');
      expect(formatPrice(null)).toBe('—');
      expect(formatPrice('')).toBe('—');
      expect(formatPrice('invalid')).toBe('—');
      expect(formatCurrency('abc')).toBe('—');
      expect(formatCurrency(NaN)).toBe('—');
      expect(formatCurrency(undefined)).toBe('—');
    });
  });

  describe('normalizePrice', () => {
    it('should strip currency signs and produce clean numeric decimal string', () => {
      expect(normalizePrice('$15.00')).toBe('15.00');
      expect(normalizePrice('15.00 €')).toBe('15.00');
      expect(normalizePrice('  $ 45.50  ')).toBe('45.50');
      expect(normalizePrice(45.5)).toBe('45.50');
      expect(normalizePrice('10,50 €')).toBe('10.50');
    });

    it('should throw an error for negative or unparseable prices', () => {
      expect(() => normalizePrice('-10')).toThrow();
      expect(() => normalizePrice('-$15.00')).toThrow();
      expect(() => normalizePrice('not-a-price')).toThrow();
      expect(() => normalizePrice(undefined)).toThrow();
      expect(() => normalizePrice(null)).toThrow();
    });
  });

  describe('parsePrice', () => {
    it('should parse numbers and formatted strings correctly', () => {
      expect(parsePrice(12.5)).toBe(12.5);
      expect(parsePrice('$12.50')).toBe(12.5);
      expect(parsePrice('12,50 €')).toBe(12.5);
      expect(parsePrice('invalid')).toBeNaN();
    });
  });
});
