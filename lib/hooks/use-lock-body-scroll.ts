import { useEffect } from 'react';

export function useLockBodyScroll(open: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!open) return;

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle || '';
    };
  }, [open]);
}
