import React from 'react';
import { formatCurrency } from '@/lib/utils/currency';

interface PriceDisplayProps {
  price: string | number | undefined | null;
  currency?: string;
  className?: string;
}

export default function PriceDisplay({ price, currency, className }: PriceDisplayProps) {
  return (
    <span className={`inline-block whitespace-nowrap ${className || ''}`}>
      {formatCurrency(price, currency)}
    </span>
  );
}
