"use client";

import { useState, useEffect } from 'react';
import { DeviceInfo, parseDeviceInfo } from '@/lib/device-geo';

export function useClientDevice(): {
  deviceInfo: DeviceInfo | null;
  isMounted: boolean;
} {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.navigator) {
      const parsed = parseDeviceInfo(window.navigator.userAgent);
      setDeviceInfo(parsed);
    }
  }, []);

  return { deviceInfo, isMounted };
}
