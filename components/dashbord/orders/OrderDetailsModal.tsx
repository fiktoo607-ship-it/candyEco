import React from 'react';
import { Order } from '@/lib/hooks/use-orders';
import PriceDisplay from '@/components/PriceDisplay';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';
import { formatFrenchDate } from '@/lib/date';
import { ORDER_STATUS_CONFIG } from '@/types/orderStatusConfig';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  updateStatusMutation: any;
  onStatusChangeClick: (
    id: string,
    status: string,
    currentStatus: string,
    reference: string,
    onConfirmExtra?: () => void
  ) => void;
}

export function OrderDetailsModal({
  order,
  onClose,
  updateStatusMutation,
  onStatusChangeClick,
}: OrderDetailsModalProps) {
  useLockBodyScroll(!!order);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-sm md:p-md">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-soft flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 p-md bg-surface-container-low flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-xl">description</span>
              Détails de la Commande
            </h3>
            <p className="text-xs font-mono text-on-surface-variant mt-[2px] bg-surface-container-high px-sm py-[2px] rounded-lg inline-block">
              Réf: {order.reference || `#${order.id.toUpperCase()}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-xs text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-md space-y-md overflow-y-auto flex-1">
          {/* Customer Details Section */}
          <div className="space-y-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">contact_page</span>
              Informations Client
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md bg-surface-container-low/40 p-md rounded-2xl border border-outline-variant/20">
              <div className="flex items-start gap-xs">
                <span className="material-symbols-outlined text-primary text-xl mt-[2px]">person</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Nom</span>
                  <span className="text-sm font-semibold text-on-surface block">{order.customerName}</span>
                </div>
              </div>
              <div className="flex items-start gap-xs">
                <span className="material-symbols-outlined text-primary text-xl mt-[2px]">call</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Téléphone</span>
                  <span className="text-sm font-semibold text-on-surface block">{order.customerPhone || '—'}</span>
                </div>
              </div>
              <div className="flex items-start gap-xs">
                <span className="material-symbols-outlined text-primary text-xl mt-[2px]">mail</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Email</span>
                  <span className="text-sm font-semibold text-on-surface block truncate max-w-[220px]">{order.customerEmail || '—'}</span>
                </div>
              </div>
              <div className="flex items-start gap-xs">
                <span className="material-symbols-outlined text-primary text-xl mt-[2px]">local_shipping</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Mode de livraison</span>
                  <span className="text-sm font-semibold text-primary block">{(order as any).deliveryMethod || '—'}</span>
                </div>
              </div>
              {order.shippingAddress && (
                <div className="flex items-start gap-xs sm:col-span-2 border-t border-outline-variant/10 pt-sm">
                  <span className="material-symbols-outlined text-primary text-xl mt-[2px]">location_on</span>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Adresse de livraison</span>
                    <span className="text-sm font-medium text-on-surface block">{order.shippingAddress}</span>
                  </div>
                </div>
              )}
              {(order as any).customerTrustScore !== undefined && (
                <div className="flex items-start gap-xs border-t border-outline-variant/10 pt-sm sm:col-span-2">
                  <span className="material-symbols-outlined text-primary text-xl mt-[2px]">verified_user</span>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Points de Confiance</span>
                    <span className="inline-flex items-center gap-xs rounded-full bg-emerald-500/10 px-sm py-[2px] text-xs font-bold text-emerald-600 mt-[2px]">
                      {(order as any).customerTrustScore} point{(order as any).customerTrustScore !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Info & Items Section */}
          <div className="space-y-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">shopping_basket</span>
              Articles Commandés
            </h4>
            <div className="border border-outline-variant/20 rounded-2xl overflow-hidden bg-surface-container-low/20">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-xs font-semibold text-on-surface-variant">
                    <th className="p-sm md:p-md">Produit</th>
                    <th className="p-sm md:p-md text-center">Quantité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-sm md:p-md font-medium text-on-surface">
                        {item.product?.title || 'Produit Inconnu'}
                      </td>
                      <td className="p-sm md:p-md text-center">
                        <span className="inline-block font-bold text-primary bg-primary-container/10 px-sm py-[2px] rounded-lg">
                          x{item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Metadata summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm pt-sm border-t border-outline-variant/20">
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Prix Total</span>
              <span className="text-base md:text-lg font-bold text-primary"><PriceDisplay price={order.totalPrice} /></span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Date de commande</span>
              <span className="text-xs font-medium text-on-surface block mt-xs">{formatFrenchDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Statut</span>
              <span className={`inline-block mt-xs rounded-full px-sm py-[2px] text-xs font-bold uppercase ${
                ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.badgeClass || 'bg-neutral-100 text-neutral-800'
              }`}>
                {ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.label || order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-sm border-t border-outline-variant/30 p-md bg-surface-container-low flex-shrink-0">
          {order.status === 'PENDING' && (
            <button
              onClick={() => {
                onStatusChangeClick(
                  order.id,
                  'ACCEPTED',
                  order.status,
                  order.reference || `#${order.id.substring(0, 8).toUpperCase()}`
                );
              }}
              disabled={updateStatusMutation.isPending}
              className="rounded-xl bg-emerald-600 px-md py-sm text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-xs shadow-soft"
            >
              <span className="material-symbols-outlined text-sm">thumb_up</span>
              Accepter la commande
            </button>
          )}
          {order.status === 'ACCEPTED' && (
            <button
              onClick={() => {
                onStatusChangeClick(
                  order.id,
                  'DELIVERED',
                  order.status,
                  order.reference || `#${order.id.substring(0, 8).toUpperCase()}`
                );
              }}
              disabled={updateStatusMutation.isPending}
              className="rounded-xl bg-blue-600 px-md py-sm text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-xs shadow-soft"
            >
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              Marquer comme livrée
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
