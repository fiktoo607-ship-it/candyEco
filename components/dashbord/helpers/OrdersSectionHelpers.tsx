import React from 'react';
import { Order } from '@/lib/hooks/use-orders';

export function formatFrenchDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate();
  const months = [
    'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

// ============================================================================
// 1. OrdersFilters
// ============================================================================

interface OrdersFiltersProps {
  orderSearchQuery: string;
  setOrderSearchQuery: (v: string) => void;
  orderStatusFilter: string;
  setOrderStatusFilter: (v: string) => void;
  orderCurrentPage: number;
  setOrderCurrentPage: (v: number) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  totalOrders: number;
}

export function OrdersFilters({
  orderSearchQuery,
  setOrderSearchQuery,
  orderStatusFilter,
  setOrderStatusFilter,
  setOrderCurrentPage,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  totalOrders,
}: OrdersFiltersProps) {
  return (
    <div className="flex flex-col gap-md border-b border-outline-variant/30 p-md lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center w-full lg:w-auto">
        <label className="relative w-full sm:w-80">
          <svg className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher des commandes..."
            value={orderSearchQuery}
            onChange={(e) => {
              setOrderSearchQuery(e.target.value);
              setOrderCurrentPage(1);
            }}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-sm pl-xl pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        
        <select
          value={orderStatusFilter}
          onChange={(e) => {
            setOrderStatusFilter(e.target.value);
            setOrderCurrentPage(1);
          }}
          className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary h-[46px]"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="ACCEPTED">Acceptée</option>
          <option value="DELIVERED">Livrée</option>
          <option value="CANCELLED">Annulé</option>
        </select>

        <div className="flex items-center gap-xs">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setOrderCurrentPage(1);
            }}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary h-[46px]"
          >
            <option value="createdAt">Trier par Date (Récentes)</option>
            <option value="status">Trier par Statut</option>
            <option value="orderCount">Trier par Volume Commandes</option>
            <option value="trustScore">Trier par Score Trust</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setOrderCurrentPage(1);
            }}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary h-[46px]"
          >
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>

      <div className="text-sm text-on-surface-variant font-medium">
        Total des commandes : <span className="text-primary font-bold">{totalOrders}</span>
      </div>
    </div>
  );
}

// ============================================================================
// 2. OrdersTable
// ============================================================================

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  ordersPerPage: number;
  orderCurrentPage: number;
  setOrderCurrentPage: (page: number) => void;
  totalPages: number;
  totalOrders: number;
  updateStatusMutation: any;
  onViewDetails: (order: Order) => void;
}

export function OrdersTable({
  orders,
  isLoading,
  error,
  ordersPerPage,
  orderCurrentPage,
  setOrderCurrentPage,
  totalPages,
  totalOrders,
  updateStatusMutation,
  onViewDetails,
}: OrdersTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-md">
        <svg className="w-10 h-10 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <p className="text-on-surface-variant">Chargement des commandes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-sm text-error">
        <svg className="w-12 h-12 text-error" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-lg font-semibold">Échec du chargement des commandes</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant">
        <svg className="w-12 h-12 text-on-surface-variant/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-semibold">Aucune commande trouvée</p>
        <p className="text-sm">Les commandes entrantes des clients apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              <th className="p-md">ID Commande</th>
              <th className="p-md">Détails Client</th>
              <th className="p-md">Articles Commandés</th>
              <th className="p-md">Prix Total</th>
              <th className="p-md">Date</th>
              <th className="p-md text-right">Statut / Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {orders.map((order) => (
              <tr key={order.id} className="group transition-colors hover:bg-surface/50">
                <td className="p-md font-mono text-xs text-on-surface-variant">
                  {order.reference || `#${order.id.substring(0, 8).toUpperCase()}`}
                </td>
                <td className="p-md">
                  <div className="font-semibold text-on-surface">{order.customerName}</div>
                </td>
                <td className="p-md">
                  <div className="flex flex-col gap-xs text-xs text-on-surface max-w-[250px]">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-md border-b border-outline-variant/10 pb-[2px] last:border-0 last:pb-0">
                        <span className="line-clamp-1 font-medium">{item.product?.title || 'Produit Inconnu'}</span>
                        <span className="text-primary font-semibold whitespace-nowrap">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-md font-bold text-primary">{order.totalPrice}</td>
                <td className="p-md text-xs text-on-surface-variant">
                  {formatFrenchDate(order.createdAt)}
                </td>
                <td className="p-md text-right">
                  <div className="flex justify-end items-center gap-xs">
                    {updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id && (
                      <svg className="w-4 h-4 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    )}
                    <select
                      value={order.status}
                      disabled={updateStatusMutation.isPending}
                      onChange={(e) => {
                        updateStatusMutation.mutate({
                          id: order.id,
                          status: e.target.value,
                        });
                      }}
                      className={`rounded-lg border px-sm py-xs text-xs font-bold outline-none cursor-pointer focus:border-primary disabled:opacity-50 ${
                        order.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
                          : order.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                          : order.status === 'DELIVERED'
                          ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
                          : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                      }`}
                    >
                      <option value="PENDING">En attente</option>
                      <option value="ACCEPTED">Acceptée</option>
                      <option value="DELIVERED">Livrée</option>
                      <option value="CANCELLED">Annulé</option>
                    </select>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          updateStatusMutation.mutate({
                            id: order.id,
                            status: 'ACCEPTED',
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="rounded-lg bg-emerald-600 px-sm py-xs text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        Accepter
                      </button>
                    )}
                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => {
                          updateStatusMutation.mutate({
                            id: order.id,
                            status: 'DELIVERED',
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="rounded-lg bg-blue-600 px-sm py-xs text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Livrer
                      </button>
                    )}
                    <button
                      onClick={() => onViewDetails(order)}
                      className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      Détails
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Orders Pagination Footer */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-outline-variant/30 p-md">
          <span className="text-sm text-on-surface-variant font-medium">
            Affichage de {(orderCurrentPage - 1) * ordersPerPage + 1} à{' '}
            {Math.min(orderCurrentPage * ordersPerPage, totalOrders)} sur {totalOrders} commandes
          </span>
          <div className="flex gap-xs">
            <button
              disabled={orderCurrentPage === 1}
              onClick={() => setOrderCurrentPage(Math.max(orderCurrentPage - 1, 1))}
              className="rounded-md border border-outline-variant px-sm py-xs text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <button
                key={page}
                onClick={() => setOrderCurrentPage(page)}
                className={`rounded-md px-sm py-xs text-sm font-semibold transition-all ${
                  orderCurrentPage === page
                    ? 'bg-primary text-white shadow-soft'
                    : 'border border-outline-variant text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={orderCurrentPage === totalPages}
              onClick={() => setOrderCurrentPage(Math.min(orderCurrentPage + 1, totalPages))}
              className="rounded-md border border-outline-variant px-sm py-xs text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// 3. OrderDetailsModal
// ============================================================================

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  updateStatusMutation: any;
  onUpdateOrderLocal: (updatedOrder: Order) => void;
}

export function OrderDetailsModal({
  order,
  onClose,
  updateStatusMutation,
  onUpdateOrderLocal,
}: OrderDetailsModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-md">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-soft overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 p-md bg-surface-container-low">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Détails de la Commande</h3>
            <p className="text-xs font-mono text-on-surface-variant mt-[2px]">
              Réf: {order.reference || `#${order.id.toUpperCase()}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-xs text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-md space-y-md max-h-[70vh] overflow-y-auto">
          {/* Customer Details Section */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-sm">Informations Client</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm bg-surface-container-low p-sm rounded-xl border border-outline-variant/10">
              <div>
                <span className="text-xs text-on-surface-variant block">Nom</span>
                <span className="text-sm font-semibold text-on-surface">{order.customerName}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">Téléphone</span>
                <span className="text-sm font-semibold text-on-surface">{order.customerPhone}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">Email</span>
                <span className="text-sm font-semibold text-on-surface">{order.customerEmail || '—'}</span>
              </div>
              {order.shippingAddress && (
                <div className="md:col-span-2">
                  <span className="text-xs text-on-surface-variant block">Adresse de livraison</span>
                  <span className="text-sm font-medium text-on-surface">{order.shippingAddress}</span>
                </div>
              )}
              {(order as any).deliveryMethod && (
                <div>
                  <span className="text-xs text-on-surface-variant block">Mode de livraison</span>
                  <span className="text-sm font-semibold text-primary">{(order as any).deliveryMethod}</span>
                </div>
              )}
              {(order as any).customerTrustScore !== undefined && (
                <div>
                  <span className="text-xs text-on-surface-variant block">Score Trust</span>
                  <span className="inline-flex items-center gap-xs rounded-full bg-emerald-500/10 px-sm py-[2px] text-xs font-bold text-emerald-600 mt-[2px]">
                    <span className="material-symbols-outlined text-[12px] select-none">verified_user</span>
                    {(order as any).customerTrustScore}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Info & Items Section */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-sm">Articles Commandés</h4>
            <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 text-xs font-semibold text-on-surface-variant">
                    <th className="p-sm">Produit</th>
                    <th className="p-sm text-center">Quantité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-sm font-medium text-on-surface">
                        {item.product?.title || 'Produit Inconnu'}
                      </td>
                      <td className="p-sm text-center font-bold text-primary">
                        x{item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm pt-sm border-t border-outline-variant/20">
            <div>
              <span className="text-xs text-on-surface-variant block">Prix Total</span>
              <span className="text-base font-bold text-primary">{order.totalPrice}</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant block">Date</span>
              <span className="text-xs font-medium text-on-surface block mt-xs">{formatFrenchDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant block">Statut</span>
              <span className={`inline-block mt-xs rounded-full px-sm py-[2px] text-xs font-bold uppercase ${
                order.status === 'PENDING'
                  ? 'bg-amber-100 text-amber-800'
                  : order.status === 'ACCEPTED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'DELIVERED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {order.status === 'PENDING' ? 'En attente' : order.status === 'ACCEPTED' ? 'Acceptée' : order.status === 'DELIVERED' ? 'Livrée' : 'Annulé'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-sm border-t border-outline-variant/30 p-md bg-surface-container-low">
          {order.status === 'PENDING' && (
            <button
              onClick={() => {
                updateStatusMutation.mutate({
                  id: order.id,
                  status: 'ACCEPTED',
                });
                onUpdateOrderLocal({
                  ...order,
                  status: 'ACCEPTED',
                });
              }}
              disabled={updateStatusMutation.isPending}
              className="rounded-lg bg-emerald-600 px-md py-sm text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Accepter la commande
            </button>
          )}
          {order.status === 'ACCEPTED' && (
            <button
              onClick={() => {
                updateStatusMutation.mutate({
                  id: order.id,
                  status: 'DELIVERED',
                });
                onUpdateOrderLocal({
                  ...order,
                  status: 'DELIVERED',
                });
              }}
              disabled={updateStatusMutation.isPending}
              className="rounded-lg bg-blue-600 px-md py-sm text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Marquer comme livrée
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
