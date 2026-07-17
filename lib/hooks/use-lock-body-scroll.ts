import { useEffect } from 'react';

let originalOverflow: string | undefined = undefined;
let originalPaddingRight: string | undefined = undefined;
let lockCount = 0;

export function useLockBodyScroll(open: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!open) return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow ?? '';
        document.body.style.paddingRight = originalPaddingRight ?? '';
        originalOverflow = undefined;
        originalPaddingRight = undefined;
      }
    };
  }, [open]);
}

