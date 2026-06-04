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
            <span className="material-symbols-outlined pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search orders..."
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
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="text-sm text-on-surface-variant font-medium">
          Total Orders: <span className="text-primary font-bold">{ordersData?.meta?.total || 0}</span>
        </div>
      </div>

      {/* Loading Indicator */}
      {isOrdersLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-md">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            sync
          </span>
          <p className="text-on-surface-variant">Loading orders...</p>
        </div>
      ) : ordersError ? (
        <div className="flex h-64 flex-col items-center justify-center gap-sm text-error">
          <span className="material-symbols-outlined text-5xl">error</span>
          <p className="text-lg font-semibold">Failed to load orders</p>
          <p className="text-sm">{(ordersError as Error).message}</p>
        </div>
      ) : !ordersData?.data || ordersData.data.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl">receipt_long</span>
          <p className="text-lg font-semibold">No orders found</p>
          <p className="text-sm">Incoming customer orders will appear here.</p>
        </div>
      ) : (
        /* Orders Table */
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                <th className="p-md">Order ID</th>
                <th className="p-md">Customer Details</th>
                <th className="p-md">Items Ordered</th>
                <th className="p-md">Total Price</th>
                <th className="p-md">Points Earned</th>
                <th className="p-md">Date</th>
                <th className="p-md text-right">Status Action</th>
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
                          <span className="line-clamp-1 font-medium">{item.product?.title || 'Unknown Product'}</span>
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
                        <span className="material-symbols-outlined text-sm text-primary animate-spin">sync</span>
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
                        <option value="PENDING">Pending</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
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
            Showing {(orderCurrentPage - 1) * ordersPerPage + 1} to{' '}
            {Math.min(orderCurrentPage * ordersPerPage, ordersData.meta.total)} of {ordersData.meta.total} entries
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
