import React from 'react';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';
import { ORDER_STATUS_CONFIG } from '@/types/orderStatusConfig';

interface OrderStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reference: string;
  currentStatus: string;
  newStatus: string;
}

export function OrderStatusConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  reference,
  currentStatus,
  newStatus,
}: OrderStatusConfirmModalProps) {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const statusLabel = (status: string) => {
    return ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG]?.label || status;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-md bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up">
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
          <h2 className="font-display text-base font-bold text-primary flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-xl">published_with_changes</span>
            Confirmer le changement
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <div className="p-md space-y-md">
          <p className="text-on-surface-variant leading-relaxed text-sm">
            Voulez-vous vraiment changer le statut de la commande <strong className="text-on-surface">{reference}</strong> de <strong className="text-amber-600">{statusLabel(currentStatus)}</strong> à <strong className="text-emerald-600">{statusLabel(newStatus)}</strong> ?
          </p>

          <footer className="flex justify-end gap-sm pt-md border-t border-outline-variant/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-outline-variant px-md py-sm text-sm font-semibold hover:bg-surface-container-low"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="rounded-lg bg-primary px-md py-sm text-sm font-semibold text-white hover:bg-surface-tint shadow-soft flex items-center gap-xs"
            >
              Confirmer
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
