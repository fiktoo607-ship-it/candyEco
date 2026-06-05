import { useOrders, useUpdateOrderStatus, Order } from '@/lib/hooks/use-orders';
import { useDashboardStore } from '@/lib/dashboard-store';

function formatFrenchDate(dateInput: Date | string): string {
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

export default function OrdersSection() {
  const {
    orderSearchQuery,
    setOrderSearchQuery,
    orderStatusFilter,
    setOrderStatusFilter,
    orderCurrentPage,
    setOrderCurrentPage,
  } = useDashboardStore();

  const ordersPerPage = 5;

  const { data: ordersData, isLoading: isOrdersLoading, error: ordersError } = useOrders({
    page: orderCurrentPage,
    limit: ordersPerPage,
    query: orderSearchQuery,
    status: orderStatusFilter,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/10">
      {/* Search & Filters */}
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
            <option value="SHIPPED">Expédié</option>
            <option value="DELIVERED">Livré</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>

        <div className="text-sm text-on-surface-variant font-medium">
          Total des commandes : <span className="text-primary font-bold">{ordersData?.meta?.total || 0}</span>
        </div>
      </div>

      {/* Loading Indicator */}
      {isOrdersLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-md">
          <svg className="w-10 h-10 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <p className="text-on-surface-variant">Chargement des commandes...</p>
        </div>
      ) : ordersError ? (
        <div className="flex h-64 flex-col items-center justify-center gap-sm text-error">
          <svg className="w-12 h-12 text-error" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-lg font-semibold">Échec du chargement des commandes</p>
          <p className="text-sm">{(ordersError as Error).message}</p>
        </div>
      ) : !ordersData?.data || ordersData.data.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant">
          <svg className="w-12 h-12 text-on-surface-variant/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-semibold">Aucune commande trouvée</p>
          <p className="text-sm">Les commandes entrantes des clients apparaîtront ici.</p>
        </div>
      ) : (
        /* Orders Table */
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                <th className="p-md">ID Commande</th>
                <th className="p-md">Détails Client</th>
                <th className="p-md">Articles Commandés</th>
                <th className="p-md">Prix Total</th>
                <th className="p-md">Points Gagnés</th>
                <th className="p-md">Date</th>
                <th className="p-md text-right">Statut / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {ordersData.data.map((order: Order) => (
                <tr key={order.id} className="group transition-colors hover:bg-surface/50">
                  <td className="p-md font-mono text-xs text-on-surface-variant">
                    #{order.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="p-md">
                    <div className="font-semibold text-on-surface">{order.customerName}</div>
                    <div className="text-xs text-on-surface-variant mt-[2px]">{order.customerPhone}</div>
                    <div className="text-xs text-on-surface-variant mt-[2px] line-clamp-1 max-w-[200px]" title={order.shippingAddress || undefined}>
                      {order.shippingAddress}
                    </div>
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
                  <td className="p-md">
                    <span className="rounded-full bg-primary/10 px-sm py-xs text-xs font-semibold text-primary">
                      +{order.pointsEarned} pts
                    </span>
                  </td>
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
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
                            : order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                        }`}
                      >
                        <option value="PENDING">En attente</option>
                        <option value="SHIPPED">Expédié</option>
                        <option value="DELIVERED">Livré</option>
                        <option value="CANCELLED">Annulé</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Pagination Footer */}
      {!isOrdersLoading && !ordersError && ordersData?.meta && ordersData.meta.totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-outline-variant/30 p-md">
          <span className="text-sm text-on-surface-variant font-medium">
            Affichage de {(orderCurrentPage - 1) * ordersPerPage + 1} à{' '}
            {Math.min(orderCurrentPage * ordersPerPage, ordersData.meta.total)} sur {ordersData.meta.total} commandes
          </span>
          <div className="flex gap-xs">
            <button
              disabled={orderCurrentPage === 1}
              onClick={() => setOrderCurrentPage(Math.max(orderCurrentPage - 1, 1))}
              className="rounded-md border border-outline-variant px-sm py-xs text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {Array.from({ length: ordersData.meta.totalPages }, (_, idx) => idx + 1).map((page) => (
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
              disabled={orderCurrentPage === ordersData.meta.totalPages}
              onClick={() => setOrderCurrentPage(Math.min(orderCurrentPage + 1, ordersData.meta.totalPages))}
              className="rounded-md border border-outline-variant px-sm py-xs text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
