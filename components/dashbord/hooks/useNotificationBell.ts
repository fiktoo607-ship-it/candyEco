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
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
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

  // Tab visibility status reporter for Web Push deduplication
  useEffect(() => {
    function reportPresence() {
      const isVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
      fetch('/api/notifications/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
      }).catch(() => {});
    }

    reportPresence();

    const handleVisibilityChange = () => {
      reportPresence();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    const heartbeat = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        reportPresence();
      }
    }, 20000);

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      clearInterval(heartbeat);
    };
  }, []);

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

          // Trigger native browser notification if permission is granted
          if ('Notification' in window && Notification.permission === 'granted') {
            const title = 'Nouvelle commande reçue ! 🍰';
            const options = {
              body: `${clientName} a passé une commande de ${amount}.`,
              icon: '/logo.jpeg',
              badge: '/logo.jpeg',
              tag: `order-${newNotif.id}`,
              data: { url: '/dashboard' },
            };

            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready
                .then((reg) => {
                  reg.showNotification(title, options);
                })
                .catch(() => {
                  new Notification(title, options);
                });
            } else {
              try {
                new Notification(title, options);
              } catch (err) {
                console.error('Failed to trigger desktop notification:', err);
              }
            }
          }

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
