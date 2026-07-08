"use client";

import { useEffect } from 'react';
import { initTabVisibilityNotifier } from '@/lib/tab-visibility';

export default function TabVisibilityNotifier() {
  useEffect(() => {
    const cleanup = initTabVisibilityNotifier();
    return () => {
      cleanup();
    };
  }, []);

  return null;
}
