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

  // Request Notification permission and register Service Worker on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch((err) => {
          console.warn('Failed to request notification permission:', err);
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('Notification Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.error('Notification Service Worker registration failed:', err);
          });
      }
    }
  }, []);

  // System notification helper via Service Worker to support background execution
  const triggerSystemNotification = (clientName: string, amount: string) => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification('Nouvelle commande !', {
              body: `${clientName} vient de passer une commande de ${amount}.`,
              icon: '/logo.jpeg',
              tag: 'new-order',
              renotify: true,
            } as any);
          })
          .catch((err) => {
            console.error('Failed to trigger background notification via service worker:', err);
          });
      } else {
        // Fallback for browsers that don't support service workers
        try {
          const notif = new Notification('Nouvelle commande !', {
            body: `${clientName} vient de passer une commande de ${amount}.`,
            icon: '/logo.jpeg',
          });
          notif.onclick = () => {
            window.focus();
          };
        } catch (err) {
          console.error('Failed to trigger standard notification fallback:', err);
        }
      }
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

          const clientName = newNotif.order?.customerName || 'Nouveau Client';
          const rawPrice = newNotif.order?.totalPrice;
          const amount = typeof rawPrice === 'string'
            ? rawPrice.includes('€') ? rawPrice : `${rawPrice} €`
            : '0.00 €';

          // Trigger native system notification (background popup)
          triggerSystemNotification(clientName, amount);

          setToast({
            id: newNotif.id,
            clientName,
            amount,
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
