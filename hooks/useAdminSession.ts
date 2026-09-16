"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { DeviceInfo, parseDeviceInfo, formatDeviceModel } from '@/lib/admin-session/device-geo';

const DEVICE_ID_KEY = 'admin_device_id';
const DEVICE_MODEL_KEY = 'admin_device_model';
const HEARTBEAT_INTERVAL_MS = 45000;

export function getOrCreateAdminDeviceId(): string {
  if (typeof window === 'undefined') return 'default_device';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'default_device';
  }
}

export function useAdminSession() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const deviceModelRef = useRef<string | null>(null);

  // Initialize device info and query Client Hints
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined' || !window.navigator) return;

    let cachedModel: string | null = null;
    try {
      cachedModel = localStorage.getItem(DEVICE_MODEL_KEY);
    } catch {}
    deviceModelRef.current = cachedModel;

    const initial = parseDeviceInfo(window.navigator.userAgent, cachedModel);
    setDeviceInfo(initial);

    const uaData = (window.navigator as any).userAgentData;
    if (uaData && typeof uaData.getHighEntropyValues === 'function') {
      uaData
        .getHighEntropyValues(['model', 'platform', 'platformVersion'])
        .then((values: any) => {
          if (values?.model) {
            const formatted = formatDeviceModel(values.model);
            if (formatted) {
              deviceModelRef.current = formatted;
              try {
                localStorage.setItem(DEVICE_MODEL_KEY, formatted);
              } catch {}
              setDeviceInfo(parseDeviceInfo(window.navigator.userAgent, formatted));
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Send heartbeat including visibility state
  const sendHeartbeat = useCallback(async (forcedVisibility?: boolean) => {
    if (!isAdmin) return;
    try {
      const deviceId = getOrCreateAdminDeviceId();
      const deviceModel = deviceModelRef.current;
      const isVisible = forcedVisibility !== undefined
        ? forcedVisibility
        : typeof document !== 'undefined' ? !document.hidden : true;

      await fetch('/api/admin/session/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
          ...(deviceModel ? { 'x-device-name': deviceModel } : {}),
        },
        body: JSON.stringify({
          deviceId,
          deviceName: deviceModel,
          isVisible,
        }),
      });
    } catch (err: any) {
      // Gracefully handle aborted requests, offline state, or transient server restarts
      if (err?.name === 'AbortError') return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      if (err instanceof TypeError && err.message?.includes('Failed to fetch')) {
        // Server temporarily restarting or navigating away
        return;
      }
      console.warn('[AdminSession] Heartbeat failed:', err);
    }
  }, [isAdmin]);

  // Release active session
  const releaseSession = useCallback(async () => {
    if (!isAdmin) return;
    try {
      if (typeof window !== 'undefined') {
        const deviceId = getOrCreateAdminDeviceId();
        fetch(`/api/admin/session/heartbeat?deviceId=${encodeURIComponent(deviceId)}`, {
          method: 'DELETE',
          headers: {
            'x-device-id': deviceId,
          },
          keepalive: true,
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[AdminSession] Release failed:', err);
    }
  }, [isAdmin]);

  // Handle periodic heartbeats & visibilitychange events
  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;

    // Send heartbeat immediately on load
    sendHeartbeat();

    // Periodic heartbeat
    const interval = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    // Visibility listener: updates both tab presence & session without delay
    const handleVisibilityChange = () => {
      sendHeartbeat(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, isAdmin, sendHeartbeat]);

  return {
    isAdmin,
    deviceInfo,
    isMounted,
    sendHeartbeat,
    releaseSession,
  };
}
