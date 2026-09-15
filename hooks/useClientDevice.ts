"use client";

import { useState, useEffect } from 'react';
import { DeviceInfo, parseDeviceInfo, formatDeviceModel } from '@/lib/device-geo';

export function useClientDevice(): {
  deviceInfo: DeviceInfo | null;
  isMounted: boolean;
} {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined' || !window.navigator) return;

    // 1. Check cached model from localStorage first for immediate rendering
    let cachedModel: string | null = null;
    try {
      cachedModel = localStorage.getItem('admin_device_model');
    } catch {}

    const initial = parseDeviceInfo(window.navigator.userAgent, cachedModel);
    setDeviceInfo(initial);

    // 2. Query Client Hints (getHighEntropyValues) if supported (Chrome on Android, etc.)
    const uaData = (window.navigator as any).userAgentData;
    if (uaData && typeof uaData.getHighEntropyValues === 'function') {
      uaData
        .getHighEntropyValues(['model', 'platform', 'platformVersion'])
        .then((values: any) => {
          if (values?.model) {
            const formatted = formatDeviceModel(values.model);
            if (formatted) {
              try {
                localStorage.setItem('admin_device_model', formatted);
              } catch {}
              const updated = parseDeviceInfo(window.navigator.userAgent, formatted);
              setDeviceInfo(updated);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  return { deviceInfo, isMounted };
}
