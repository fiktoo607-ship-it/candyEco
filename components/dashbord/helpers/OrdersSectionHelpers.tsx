import React from 'react';
import { Order } from '@/lib/hooks/use-orders';
import { formatPrice } from '@/lib/price';

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
    <div className="flex flex-col gap-md border-b border-outline-variant/30 p-md lg:flex-row lg:items-center lg:justify-between bg-surface-container-lowest/50">
      <div className="flex flex-col gap-sm lg:flex-row lg:items-center w-full lg:w-auto flex-1">
        {/* Search Bar */}
        <label className="relative w-full lg:w-80 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher des commandes..."
            value={orderSearchQuery}
            onChange={(e) => {
              setOrderSearchQuery(e.target.value);
              setOrderCurrentPage(1);
            }}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-sm pl-10 pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm w-full lg:w-auto">
          {/* Status Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              filter_list
            </span>
            <select
              value={orderStatusFilter}
              onChange={(e) => {
                setOrderStatusFilter(e.target.value);
                setOrderCurrentPage(1);
              }}
              className="w-full sm:w-48 rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="ACCEPTED">Acceptée</option>
              <option value="DELIVERED">Livrée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex-grow sm:flex-initial">
            <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none" translate="no">
              sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setOrderCurrentPage(1);
              }}
              className="w-full sm:w-56 rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="createdAt">Trier par Date (Récentes)</option>
              <option value="status">Trier par Statut</option>
              <option value="orderCount">Trier par Volume Commandes</option>
              <option value="trustScore">Trier par Score Trust</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>

          {/* Sort Order Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setOrderCurrentPage(1);
              }}
              className="w-full sm:w-36 rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>
        </div>
      </div>

      <div className="text-sm text-on-surface-variant font-medium flex-shrink-0 mt-sm lg:mt-0 lg:text-right border-t border-outline-variant/10 pt-sm lg:border-t-0 lg:pt-0">
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
      <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant bg-surface/10">
        <svg className="w-12 h-12 text-on-surface-variant/60 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-semibold">Aucune commande trouvée</p>
        <p className="text-sm">Les commandes entrantes des clients apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile/Tablet Card Grid Layout (< 1024px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md p-md lg:hidden bg-surface/20">
        {orders.map((order) => {
          const statusConfig = {
            PENDING: { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-800', label: 'En attente' },
            ACCEPTED: { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800', label: 'Acceptée' },
            DELIVERED: { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-800', label: 'Livrée' },
            CANCELLED: { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-800', label: 'Annulée' },
          }[order.status as 'PENDING' | 'ACCEPTED' | 'DELIVERED' | 'CANCELLED'] || { bg: 'bg-surface-variant', label: order.status };

          return (
            <div key={order.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md hover:border-primary/20 transition-all flex flex-col justify-between">
              <div className="space-y-sm">
                {/* Card Header */}
                <div className="flex items-center justify-between gap-sm border-b border-outline-variant/10 pb-sm">
                  <span className="font-mono text-xs font-semibold text-on-surface-variant bg-surface-container-high px-sm py-[2px] rounded-lg">
                    {order.reference || `#${order.id.substring(0, 8).toUpperCase()}`}
                  </span>
                  <span className={`rounded-full px-sm py-[2px] text-xs font-bold border ${statusConfig.bg}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="space-y-xs">
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-base text-primary">person</span>
                    <span className="font-semibold text-sm text-on-surface">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-xs text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    <span>{formatFrenchDate(order.createdAt)}</span>
                  </div>
                </div>

                {/* Ordered Items Summary */}
                <div className="bg-surface-container-low/55 p-sm rounded-xl border border-outline-variant/10 space-y-xs">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-xs">shopping_basket</span>
                    Articles ({order.items.length})
                  </p>
                  <div className="space-y-xs max-h-24 overflow-y-auto pr-xs">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs text-on-surface gap-sm border-b border-outline-variant/5 pb-xs last:border-0 last:pb-0">
                        <span className="line-clamp-1 font-medium">{item.product?.title || 'Produit Inconnu'}</span>
                        <span className="text-primary font-bold bg-primary-container/10 px-xs py-[2px] rounded-md">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="space-y-sm pt-sm border-t border-outline-variant/10 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant">Prix Total</span>
                  <span className="text-base font-bold text-primary">{formatPrice(order.totalPrice)}</span>
                </div>

                <div className="flex items-center justify-end gap-sm w-full">
                  <div className="flex items-center gap-xs w-full justify-end">
                    {updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id && (
                      <svg className="w-4 h-4 text-primary animate-spin flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    )}

                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          updateStatusMutation.mutate({ id: order.id, status: 'ACCEPTED' });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="flex-grow sm:flex-grow-0 rounded-xl bg-emerald-600 px-sm py-[8px] text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-xs shadow-soft"
                      >
                        <span className="material-symbols-outlined text-sm">thumb_up</span>
                        Accepter
                      </button>
                    )}
                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => {
                          updateStatusMutation.mutate({ id: order.id, status: 'DELIVERED' });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="flex-grow sm:flex-grow-0 rounded-xl bg-blue-600 px-sm py-[8px] text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-xs shadow-soft"
                      >
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                        Livrer
                      </button>
                    )}

                    <button
                      onClick={() => onViewDetails(order)}
                      className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-[8px] text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Grid Layout (>= 1024px) */}
      <div className="overflow-x-auto lg:block hidden">
        <table className="min-w-[1000px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
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
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                    <span className="font-semibold text-on-surface">{order.customerName}</span>
                  </div>
                </td>
                <td className="p-md">
                  <div className="flex flex-col gap-xs text-xs text-on-surface max-w-[250px]">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-md border-b border-outline-variant/10 pb-[2px] last:border-0 last:pb-0">
                        <span className="line-clamp-1 font-medium">{item.product?.title || 'Produit Inconnu'}</span>
                        <span className="text-primary font-bold whitespace-nowrap bg-primary-container/10 px-xs rounded-md">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-md font-bold text-primary">{formatPrice(order.totalPrice)}</td>
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
                    <div className="relative">
                      <select
                        value={order.status}
                        disabled={updateStatusMutation.isPending}
                        onChange={(e) => {
                          updateStatusMutation.mutate({
                            id: order.id,
                            status: e.target.value,
                          });
                        }}
                        className={`rounded-xl border px-sm pr-7 py-xs text-xs font-bold outline-none cursor-pointer focus:border-primary disabled:opacity-50 appearance-none h-[34px] ${
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
                        <option value="CANCELLED">Annulée</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none select-none text-base">
                        arrow_drop_down
                      </span>
                    </div>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          updateStatusMutation.mutate({
                            id: order.id,
                            status: 'ACCEPTED',
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="rounded-xl bg-emerald-600 px-sm py-xs text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-soft h-[34px] flex items-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-sm">thumb_up</span>
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
                        className="rounded-xl bg-blue-600 px-sm py-xs text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-soft h-[34px] flex items-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                        Livrer
                      </button>
                    )}
                    <button
                      onClick={() => onViewDetails(order)}
                      className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors h-[34px] flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Détails
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Orders Pagination Footer (Responsive design) */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant/30 p-md gap-sm bg-surface-container-lowest/80 flex-wrap">
          <span className="text-xs md:text-sm text-on-surface-variant font-medium text-center sm:text-left">
            Affichage de {(orderCurrentPage - 1) * ordersPerPage + 1} à{' '}
            {Math.min(orderCurrentPage * ordersPerPage, totalOrders)} sur {totalOrders} commandes
          </span>
          <div className="flex gap-xs items-center overflow-x-auto max-w-full py-1">
            <button
              disabled={orderCurrentPage === 1}
              onClick={() => setOrderCurrentPage(Math.max(orderCurrentPage - 1, 1))}
              className="rounded-xl border border-outline-variant text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed h-9 w-9 flex items-center justify-center font-bold p-0"
            >
              ‹
            </button>
            <div className="flex gap-xs items-center">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setOrderCurrentPage(page)}
                  className={`rounded-xl text-xs md:text-sm font-semibold transition-all h-9 w-9 flex items-center justify-center p-0 ${
                    orderCurrentPage === page
                      ? 'bg-primary text-white shadow-soft font-bold'
                      : 'border border-outline-variant text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              disabled={orderCurrentPage === totalPages}
              onClick={() => setOrderCurrentPage(Math.min(orderCurrentPage + 1, totalPages))}
              className="rounded-xl border border-outline-variant text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed h-9 w-9 flex items-center justify-center font-bold p-0"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-sm md:p-md">
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
                    <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Score de Confiance</span>
                    <span className="inline-flex items-center gap-xs rounded-full bg-emerald-500/10 px-sm py-[2px] text-xs font-bold text-emerald-600 mt-[2px]">
                      {(order as any).customerTrustScore} / 100
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
              <span className="text-base md:text-lg font-bold text-primary">{formatPrice(order.totalPrice)}</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Date de commande</span>
              <span className="text-xs font-medium text-on-surface block mt-xs">{formatFrenchDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Statut</span>
              <span className={`inline-block mt-xs rounded-full px-sm py-[2px] text-xs font-bold uppercase ${
                order.status === 'PENDING'
                  ? 'bg-amber-100 text-amber-800'
                  : order.status === 'ACCEPTED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'DELIVERED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {order.status === 'PENDING' ? 'En attente' : order.status === 'ACCEPTED' ? 'Acceptée' : order.status === 'DELIVERED' ? 'Livrée' : 'Annulée'}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-sm border-t border-outline-variant/30 p-md bg-surface-container-low flex-shrink-0">
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
              className="rounded-xl bg-emerald-600 px-md py-sm text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-xs shadow-soft"
            >
              <span className="material-symbols-outlined text-sm">thumb_up</span>
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
