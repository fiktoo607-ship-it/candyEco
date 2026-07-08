import React from 'react';
import { formatPrice } from '@/lib/price';

interface PriceDisplayProps {
  price: string | number | undefined | null;
  className?: string;
}

export default function PriceDisplay({ price, className }: PriceDisplayProps) {
  return (
    <span className={`inline-block whitespace-nowrap ${className || ''}`}>
      {formatPrice(price)}
    </span>
  );
}
