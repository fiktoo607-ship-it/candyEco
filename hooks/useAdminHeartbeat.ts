"use client";

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useAdminHeartbeat() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const sendHeartbeat = useCallback(async () => {
    if (!isAdmin) return;
    try {
      await fetch('/api/admin/session/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.warn('[AdminHeartbeat] Failed to send heartbeat:', err);
    }
  }, [isAdmin]);

  const releaseSession = useCallback(async () => {
    if (!isAdmin) return;
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/admin/session/heartbeat', {
          method: 'DELETE',
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

    // Ping every 45 seconds to keep lock fresh
    const interval = setInterval(sendHeartbeat, 45000);

    const handleBeforeUnload = () => {
      // Release session on tab close / reload
      fetch('/api/admin/session/heartbeat', {
        method: 'DELETE',
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
