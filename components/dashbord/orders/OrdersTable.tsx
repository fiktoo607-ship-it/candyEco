import React, { useState } from 'react';
import { Order } from '@/lib/hooks/use-orders';
import PriceDisplay from '@/components/PriceDisplay';
import { formatFrenchDate } from '@/lib/date';
import { ORDER_STATUS_CONFIG } from '@/types/orderStatusConfig';

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  ordersPerPage: number;
  setOrdersPerPage: (size: number) => void;
  orderCurrentPage: number;
  setOrderCurrentPage: (page: number) => void;
  totalPages: number;
  totalOrders: number;
  updateStatusMutation: any;
  onViewDetails: (order: Order) => void;
  onStatusChangeClick: (
    id: string,
    status: string,
    currentStatus: string,
    reference: string,
    onConfirmExtra?: () => void
  ) => void;
  onToastMessage: (message: string, type: 'success' | 'error') => void;
  onPrintOrder: (order: Order) => void;
}

export function OrdersTable({
  orders,
  isLoading,
  error,
  ordersPerPage,
  setOrdersPerPage,
  orderCurrentPage,
  setOrderCurrentPage,
  totalPages,
  totalOrders,
  updateStatusMutation,
  onViewDetails,
  onStatusChangeClick,
  onToastMessage,
  onPrintOrder,
}: OrdersTableProps) {
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

  const toggleExpandOrder = (orderId: string) => {
    if (expandedOrderIds.includes(orderId)) {
      setExpandedOrderIds(expandedOrderIds.filter(id => id !== orderId));
    } else {
      setExpandedOrderIds([...expandedOrderIds, orderId]);
    }
  };

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
          const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] || { bg: 'bg-surface-variant', label: order.status };

          const isExpanded = expandedOrderIds.includes(order.id);

          return (
            <div key={order.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md hover:border-primary/20 transition-all flex flex-col justify-between">
              <div className="space-y-sm">
                {/* Card Header */}
                <div className="flex items-center justify-between gap-sm border-b border-outline-variant/10 pb-sm">
                  <div className="flex items-center gap-xs">
                    <span className="font-mono text-xs font-semibold text-on-surface-variant bg-surface-container-high px-sm py-[2px] rounded-lg">
                      {order.reference || `#${order.id.substring(0, 8).toUpperCase()}`}
                    </span>
                  </div>
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
                  <div className="space-y-xs pr-xs">
                    {(isExpanded ? order.items : order.items.slice(0, 2)).map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs text-on-surface gap-sm border-b border-outline-variant/5 pb-xs last:border-0 last:pb-0">
                        <span className="line-clamp-1 font-medium flex-1 min-w-0">{item.product?.title || 'Produit Inconnu'}</span>
                        <span className="text-primary font-bold bg-primary-container/10 px-xs py-[2px] rounded-md whitespace-nowrap flex-shrink-0">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {order.items.length > 2 && (
                    <button
                      type="button"
                      onClick={() => toggleExpandOrder(order.id)}
                      className="text-[10px] font-bold text-primary hover:text-surface-tint mt-xs flex items-center gap-[2px] transition-colors w-full justify-center pt-xs border-t border-outline-variant/5"
                    >
                      <span>{isExpanded ? "Voir moins" : `Voir ${order.items.length - 2} de plus`}</span>
                      <span className="material-symbols-outlined text-xs select-none">
                        {isExpanded ? "expand_less" : "expand_more"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="space-y-sm pt-sm border-t border-outline-variant/10 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant">Prix Total</span>
                  <span className="text-base font-bold text-primary"><PriceDisplay price={order.totalPrice} /></span>
                </div>

                <div className="flex items-center justify-end gap-sm w-full">
                  <div className="flex items-center gap-xs w-full justify-between sm:justify-end">
                    {updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id && (
                      <svg className="w-4 h-4 text-primary animate-spin flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    )}

                    {/* Status Dropdown on Mobile */}
                    <div className="relative flex-1 sm:flex-initial">
                      <select
                        value={order.status}
                        disabled={updateStatusMutation.isPending || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                        onChange={(e) => {
                          onStatusChangeClick(
                            order.id,
                            e.target.value,
                            order.status,
                            order.reference || `#${order.id.substring(0, 8).toUpperCase()}`
                          );
                        }}
                        className={`w-full rounded-xl border px-sm pr-7 py-xs text-xs font-bold outline-none cursor-pointer focus:border-primary disabled:opacity-50 appearance-none h-[34px] ${
                          ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.selectClass || 'bg-surface border-outline'
                        }`}
                      >
                        {order.status === 'PENDING' && (
                          <>
                            <option value="PENDING">En attente</option>
                            <option value="ACCEPTED">Acceptée</option>
                            <option value="CANCELLED">Annulée</option>
                          </>
                        )}
                        {order.status === 'ACCEPTED' && (
                          <>
                            <option value="ACCEPTED">Acceptée</option>
                            <option value="DELIVERED">Livrée</option>
                          </>
                        )}
                        {order.status === 'DELIVERED' && (
                          <option value="DELIVERED">Livrée</option>
                        )}
                        {order.status === 'CANCELLED' && (
                          <option value="CANCELLED">Annulée</option>
                        )}
                      </select>
                      <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none select-none text-base">
                        arrow_drop_down
                      </span>
                    </div>

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => onPrintOrder(order)}
                        className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-[8px] text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center gap-xs h-[34px]"
                        title="Imprimer la commande"
                      >
                        <svg className="w-4 h-4 text-on-surface" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.821V21h10.56v-7.179m-10.56 0h10.56m-10.56 0V11.25M17.28 13.821V11.25M17.28 11.25a2.25 2.25 0 00-2.25-2.25h-6.06a2.25 2.25 0 00-2.25 2.25m10.56 0V6a2.25 2.25 0 00-2.25-2.25H8.25A2.25 2.25 0 006 6v5.25m11.25 0h.008v.008h-.008V11.25zm-12 0h.008v.008H5.25V11.25z" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={() => onViewDetails(order)}
                      className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-[8px] text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center gap-xs h-[34px]"
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
        <table className="min-w-[950px] w-full border-collapse text-left">
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
                  <div className="flex items-center gap-xs max-w-[150px]" title={order.customerName ?? undefined}>
                    <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">person</span>
                    <span className="font-semibold text-on-surface truncate">{order.customerName}</span>
                  </div>
                </td>
                <td className="p-md">
                  <div className="flex flex-col gap-xs text-xs text-on-surface max-w-[200px]">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-md border-b border-outline-variant/10 pb-[2px] last:border-0 last:pb-0">
                        <span className="line-clamp-1 font-medium flex-1 min-w-0">{item.product?.title || 'Produit Inconnu'}</span>
                        <span className="text-primary font-bold whitespace-nowrap flex-shrink-0 bg-primary-container/10 px-xs rounded-md">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-md font-bold text-primary whitespace-nowrap"><PriceDisplay price={order.totalPrice} /></td>
                <td className="p-md text-xs text-on-surface-variant whitespace-nowrap">
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
                        disabled={updateStatusMutation.isPending || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                        onChange={(e) => {
                          onStatusChangeClick(
                            order.id,
                            e.target.value,
                            order.status,
                            order.reference || `#${order.id.substring(0, 8).toUpperCase()}`
                          );
                        }}
                        className={`rounded-xl border px-sm pr-7 py-xs text-xs font-bold outline-none cursor-pointer focus:border-primary disabled:opacity-50 appearance-none h-[34px] ${
                          ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.selectClass || 'bg-surface border-outline'
                        }`}
                      >
                        {order.status === 'PENDING' && (
                          <>
                            <option value="PENDING">En attente</option>
                            <option value="ACCEPTED">Acceptée</option>
                            <option value="CANCELLED">Annulée</option>
                          </>
                        )}
                        {order.status === 'ACCEPTED' && (
                          <>
                            <option value="ACCEPTED">Acceptée</option>
                            <option value="DELIVERED">Livrée</option>
                          </>
                        )}
                        {order.status === 'DELIVERED' && (
                          <option value="DELIVERED">Livrée</option>
                        )}
                        {order.status === 'CANCELLED' && (
                          <option value="CANCELLED">Annulée</option>
                        )}
                      </select>
                      <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none select-none text-base">
                        arrow_drop_down
                      </span>
                    </div>
                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => onPrintOrder(order)}
                        className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors h-[34px] flex items-center justify-center gap-xs"
                        title="Imprimer la commande"
                      >
                        <svg className="w-4 h-4 text-on-surface" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.821V21h10.56v-7.179m-10.56 0h10.56m-10.56 0V11.25M17.28 13.821V11.25M17.28 11.25a2.25 2.25 0 00-2.25-2.25h-6.06a2.25 2.25 0 00-2.25 2.25m10.56 0V6a2.25 2.25 0 00-2.25-2.25H8.25A2.25 2.25 0 006 6v5.25m11.25 0h.008v.008h-.008V11.25zm-12 0h.008v.008H5.25V11.25z" />
                        </svg>
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
          <div className="flex flex-col sm:flex-row items-center gap-md">
            <span className="text-xs md:text-sm text-on-surface-variant font-medium text-center sm:text-left">
              Affichage de {(orderCurrentPage - 1) * ordersPerPage + 1} à{' '}
              {Math.min(orderCurrentPage * ordersPerPage, totalOrders)} sur {totalOrders} commandes
            </span>
            <div className="flex items-center gap-xs">
              <span className="text-xs text-on-surface-variant font-medium">Afficher :</span>
              <div className="relative">
                <select
                  value={ordersPerPage}
                  onChange={(e) => {
                    setOrdersPerPage(Number(e.target.value));
                    setOrderCurrentPage(1);
                  }}
                  className="rounded-xl border border-outline-variant bg-surface-container-low pl-sm pr-6 py-xs text-xs text-on-surface outline-none focus:border-primary cursor-pointer h-8 appearance-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
                  arrow_drop_down
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-xs items-center overflow-x-auto max-w-full py-1">
            <button
              disabled={orderCurrentPage === 1}
              onClick={() => setOrderCurrentPage(Math.max(orderCurrentPage - 1, 1))}
              className="rounded-xl border border-outline-variant text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed h-9 w-9 max-sm:h-11 max-sm:w-11 flex items-center justify-center font-bold p-0"
            >
              ‹
            </button>
            <div className="flex gap-xs items-center">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setOrderCurrentPage(page)}
                  className={`rounded-xl text-xs md:text-sm max-sm:text-base font-semibold transition-all h-9 w-9 max-sm:h-11 max-sm:w-11 flex items-center justify-center p-0 ${
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
              className="rounded-xl border border-outline-variant text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed h-9 w-9 max-sm:h-11 max-sm:w-11 flex items-center justify-center font-bold p-0"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
