"use client";

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications, useMarkNotifications, OrderNotification } from '@/lib/hooks/use-notifications';
import { useDashboardStore } from '@/lib/dashboard-store';

function getRelativeTimeFrench(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

export default function NotificationBell() {
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

      eventSource.onerror = (err) => {
        console.warn('[SSE] Connection error. Polling will take over. Retrying in 10s...');
        if (eventSource) {
          eventSource.close();
        }
        setTimeout(connectSSE, 10000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
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

  return (
    <div className="relative inline-block text-left">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest p-3 text-primary hover:bg-surface-container-low transition-colors select-none"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-xs -right-xs flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white shadow-soft animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop to close dropdown on click outside */}
      {isOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-sm w-96 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft z-40 transition-all duration-200 origin-top-right">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-sm mb-sm">
            <h3 className="font-display text-lg font-bold text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:text-surface-tint hover:underline transition-all"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto flex flex-col gap-xs pr-xs">
            {notifications.length === 0 ? (
              <div className="py-lg text-center text-on-surface-variant/70 text-sm">
                <span className="material-symbols-outlined text-3xl mb-xs block text-on-surface-variant/40">
                  notifications_off
                </span>
                Aucune notification
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full flex items-start gap-sm rounded-xl p-sm text-left transition-all duration-200 border border-transparent hover:bg-surface-container-low hover:border-outline-variant/30 ${
                    !n.read ? 'bg-primary/5' : 'opacity-85'
                  }`}
                >
                  <span className={`material-symbols-outlined rounded-full p-xs text-xl shrink-0 ${
                    !n.read ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    shopping_bag
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      Nouvelle commande
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      Client : {n.order?.customerName || 'Anonyme'} • {n.order?.totalPrice || '0.00'}
                    </p>
                    <span className="text-[10px] text-on-surface-variant/60 font-medium">
                      {getRelativeTimeFrench(n.createdAt)}
                    </span>
                  </div>

                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Real-time Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm rounded-2xl border border-primary/20 bg-surface-container-lowest/90 backdrop-blur-md p-md shadow-soft animate-in slide-in-from-bottom duration-300">
          <div className="flex gap-sm">
            <span className="material-symbols-outlined rounded-full bg-primary/10 p-sm text-primary text-2xl shrink-0 self-center">
              campaign
            </span>
            <div className="flex-1">
              <h4 className="font-display font-bold text-on-surface text-base">Nouvelle commande !</h4>
              <p className="text-sm text-on-surface-variant mt-xxs">
                <strong>{toast.clientName}</strong> vient de passer une commande de <strong>{toast.amount}</strong>.
              </p>
              <div className="flex gap-sm mt-xs">
                <button
                  onClick={() => {
                    const matchedNotif = notifications.find(n => n.id === toast.id);
                    if (matchedNotif) {
                      handleNotificationClick(matchedNotif);
                    } else {
                      setActiveTab('orders');
                      setIsOpen(false);
                    }
                    setToast(null);
                  }}
                  className="rounded-full bg-primary px-sm py-xs text-xs font-semibold text-white hover:bg-surface-tint transition-all"
                >
                  Voir la commande
                </button>
                <button
                  onClick={() => setToast(null)}
                  className="rounded-full border border-outline-variant px-sm py-xs text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
