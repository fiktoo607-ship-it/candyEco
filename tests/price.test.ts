import { describe, it, expect } from 'vitest';
import { formatPrice, CURRENCY_SYMBOL } from '@/lib/price';

describe('formatPrice helper', () => {
  it('should centralize currency symbol to Euro', () => {
    expect(CURRENCY_SYMBOL).toBe('€');
  });

  it('should format number values correctly as Euro', () => {
    expect(formatPrice(10)).toBe('10.00 €');
    expect(formatPrice(5.5)).toBe('5.50 €');
    expect(formatPrice(99.99)).toBe('99.99 €');
  });

  it('should format string values correctly as Euro', () => {
    expect(formatPrice('45')).toBe('45.00 €');
    expect(formatPrice('45.50')).toBe('45.50 €');
  });

  it('should replace dollar or pound characters with Euro', () => {
    expect(formatPrice('$12')).toBe('12.00 €');
    expect(formatPrice('12 £')).toBe('12.00 €');
    expect(formatPrice('$12.50 £')).toBe('12.50 €');
  });

  it('should return default fallback for invalid inputs', () => {
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice(null)).toBe('—');
  });
});
