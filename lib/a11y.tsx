import React from 'react';

/**
 * Checks if a string contains Arabic Unicode characters
 */
export function containsArabic(text: unknown): boolean {
  if (typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Wraps text in <span lang="ar" dir="rtl"> if it contains Arabic characters,
 * allowing screen readers to pronounce Arabic properly within a French document.
 */
export function formatLocalizedText(text: string | null | undefined, prefix = ''): React.ReactNode {
  if (!text) return null;
  const fullText = `${prefix}${text}`;
  if (containsArabic(text)) {
    return (
      <span lang="ar" dir="rtl">
        {fullText}
      </span>
    );
  }
  return fullText;
}

export function LocalizedSpan({
  text,
  prefix = '',
  className,
  ...props
}: {
  text: string | null | undefined;
  prefix?: string;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  if (!text) return null;
  const isAr = containsArabic(text);
  const fullText = `${prefix}${text}`;

  if (isAr) {
    return (
      <span lang="ar" dir="rtl" className={className} {...props}>
        {fullText}
      </span>
    );
  }

  return (
    <span className={className} {...props}>
      {fullText}
    </span>
  );
}
