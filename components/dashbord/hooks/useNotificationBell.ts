import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications, useMarkNotifications, useClearNotifications, OrderNotification } from '@/lib/hooks/use-notifications';
import { useDashboardStore } from '@/lib/dashboard-store';

export function useNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ id: string; clientName: string; amount: string } | null>(null);
  
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useNotifications();
  const markMutation = useMarkNotifications();
  const { setActiveTab, setOrderSearchQuery, setOrderCurrentPage } = useDashboardStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sound chime helper
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      // Play a lovely double chime
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0, start);
        gain.gain.linearRampToValueAtTime(0.04, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.25); // C5
      playTone(659.25, now + 0.08, 0.35); // E5
    } catch (e) {
      console.warn('Failed to play chime:', e);
    }
  };

  // Setup Server-Sent Events for real-time notification updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimer: NodeJS.Timeout;
    
    function connectSSE() {
      eventSource = new EventSource('/api/notifications/sse');

      eventSource.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data) as OrderNotification;
          
          // Invalidate notifications query to fetch updated list
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // Trigger browser notification / chime / toast
          playChime();
          setToast({
            id: newNotif.id,
            clientName: newNotif.order?.customerName || 'Nouveau Client',
            amount: newNotif.order?.totalPrice || '0.00',
          });
        } catch (err) {
          console.error('[SSE] Failed to parse event data:', err);
        }
      };

      eventSource.onerror = () => {
        console.warn('[SSE] Connection error. Polling will take over. Retrying in 10s...');
        if (eventSource) {
          eventSource.close();
        }
        retryTimer = setTimeout(connectSSE, 10000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [queryClient]);

  // Automatically clear toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleNotificationClick = (n: OrderNotification) => {
    // Mark as read
    if (!n.read) {
      markMutation.mutate({ id: n.id });
    }
    // Switch to orders tab and filter by order ID
    setActiveTab('orders');
    setOrderSearchQuery(n.orderId);
    setOrderCurrentPage(1);
    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markMutation.mutate({ readAll: true });
    }
  };

  const clearMutation = useClearNotifications();

  const handleClearAll = () => {
    if (notifications.length > 0) {
      clearMutation.mutate();
    }
  };

  return {
    isOpen,
    setIsOpen,
    toast,
    setToast,
    notifications,
    unreadCount,
    handleNotificationClick,
    handleMarkAllRead,
    handleClearAll,
    setActiveTab,
  };
}
