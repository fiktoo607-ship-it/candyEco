"use client";

import React from 'react';
import { useNotificationBell } from './hooks/useNotificationBell';
import { getRelativeTimeFrench } from './helpers/NotificationHelpers';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { createPortal } from 'react-dom';

export default function NotificationBell() {
  const {
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
  } = useNotificationBell();

  const {
    isSupported,
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    loading: pushLoading,
  } = usePushNotifications();

  return (
    <div className="relative inline-block text-left">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest p-3 text-primary hover:bg-surface-container-low transition-colors select-none"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-2xl">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-xs -right-xs flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white shadow-soft animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop to close dropdown on click outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-[2px] desktop:bg-transparent desktop:backdrop-blur-none"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-sm desktop:absolute desktop:top-auto desktop:left-auto desktop:right-0 desktop:translate-x-0 desktop:translate-y-0 desktop:mt-sm desktop:w-96 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft z-[90] transition-all duration-200 origin-center desktop:origin-top-right">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-sm mb-sm">
            <h3 className="font-display text-lg font-bold text-on-surface">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:text-surface-tint hover:underline transition-all"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {isSupported && (
            <button
              disabled={pushLoading}
              onClick={() => isSubscribed ? unsubscribeFromPush() : subscribeToPush()}
              className={`w-full mb-sm rounded-xl p-sm text-xs font-semibold transition-all text-center flex items-center justify-center gap-xs ${
                isSubscribed
                  ? "bg-error/10 hover:bg-error/20 text-error"
                  : "bg-primary/10 hover:bg-primary/20 text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isSubscribed ? 'notifications_off' : 'notifications'}
              </span>
              {pushLoading
                ? 'Chargement...'
                : isSubscribed
                  ? 'Désactiver les notifications push'
                  : 'Activer les notifications push'
              }
            </button>
          )}

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
                    !n.read ? "bg-primary/5" : "opacity-85"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined rounded-full p-xs text-xl shrink-0 ${
                      !n.read
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    shopping_bag
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      Nouvelle commande
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      Client : {n.order?.customerName || "Anonyme"} •{" "}
                      {n.order?.totalPrice || "0.00"}
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

          {notifications.length > 0 && (
            <div className="border-t border-outline-variant/30 pt-sm mt-sm flex justify-end">
              <button
                onClick={handleClearAll}
                className="text-xs font-semibold text-error hover:text-red-700 hover:underline transition-all flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-base">
                  delete_sweep
                </span>
                Effacer tout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Real-time Toast Alert */}
      {toast && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 right-6 z-[95] flex max-w-sm rounded-2xl border border-primary/20 bg-surface-container-lowest/90 backdrop-blur-md p-md shadow-soft animate-in slide-in-from-bottom duration-300">
          <div className="flex gap-sm">
            <span className="material-symbols-outlined rounded-full bg-primary/10 p-sm text-primary text-2xl shrink-0 self-center">
              campaign
            </span>
            <div className="flex-1">
              <h4 className="font-display font-bold text-on-surface text-base">
                Nouvelle commande !
              </h4>
              <p className="text-sm text-on-surface-variant mt-xxs">
                <strong>{toast.clientName}</strong> vient de passer une commande
                de <strong>{toast.amount}</strong>.
              </p>
              <div className="flex gap-sm mt-xs">
                <button
                  onClick={() => {
                    const matchedNotif = notifications.find(
                      (n) => n.id === toast.id,
                    );
                    if (matchedNotif) {
                      handleNotificationClick(matchedNotif);
                    } else {
                      setActiveTab("orders");
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
        </div>,
        document.body
      )}
    </div>
  );
}
