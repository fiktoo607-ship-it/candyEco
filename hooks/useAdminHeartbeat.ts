"use client";

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function getOrCreateAdminDeviceId(): string {
  if (typeof window === 'undefined') return 'default_device';
  try {
    let id = localStorage.getItem('admin_device_id');
    if (!id) {
      id = 'dev_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
      localStorage.setItem('admin_device_id', id);
    }
    return id;
  } catch {
    return 'default_device';
  }
}

export function useAdminHeartbeat() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const sendHeartbeat = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const deviceId = getOrCreateAdminDeviceId();
      await fetch('/api/admin/session/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({ deviceId }),
      });
    } catch (err) {
      console.warn('[AdminHeartbeat] Failed to send heartbeat:', err);
    }
  }, [isAdmin]);

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
      console.warn('[AdminHeartbeat] Failed to release session:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;

    // Send heartbeat immediately on load
    sendHeartbeat();

    // Ping every 45 seconds to keep session active
    const interval = setInterval(sendHeartbeat, 45000);

    const handleBeforeUnload = () => {
      // Release session on tab close / reload
      const deviceId = getOrCreateAdminDeviceId();
      fetch(`/api/admin/session/heartbeat?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
        headers: {
          'x-device-id': deviceId,
        },
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [status, isAdmin, sendHeartbeat]);

  return { releaseSession };
}
