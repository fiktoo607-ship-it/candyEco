"use client";

import React from 'react';
import { useOrdersSection } from './hooks/useOrdersSection';
import { OrdersFilters } from './orders/OrdersFilters';
import { OrdersTable } from './orders/OrdersTable';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { OrderStatusConfirmModal } from './orders/OrderStatusConfirmModal';
import { useDashboardStore } from '@/lib/dashboard-store';
import { OrderPrintReceipt } from './helpers/OrderPrintReceipt';
import { Order } from '@/lib/hooks/use-orders';


export default function OrdersSection() {
  const {
    orderSearchQuery,
    setOrderSearchQuery,
    orderStatusFilter,
    setOrderStatusFilter,
    orderCurrentPage,
    setOrderCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedOrder,
    setSelectedOrder,
    ordersPerPage,
    setOrdersPerPage,
    orders,
    isLoading,
    error,
    totalPages,
    totalOrders,
    updateStatusMutation,
  } = useOrdersSection();

  const { showToast } = useDashboardStore();

  const [statusConfirmTarget, setStatusConfirmTarget] = React.useState<{
    id: string;
    status: string;
    currentStatus: string;
    reference: string;
    onConfirmExtra?: () => void;
  } | null>(null);

  const [printOrder, setPrintOrder] = React.useState<Order | null>(null);

  // Sync selectedOrder with the latest data from the orders query
  React.useEffect(() => {
    if (selectedOrder && !isLoading) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) {
        setSelectedOrder(updated);
      } else {
        setSelectedOrder(null);
      }
    }
  }, [orders, selectedOrder?.id, isLoading, setSelectedOrder]);

  const handleStatusChangeClick = (
    id: string,
    status: string,
    currentStatus: string,
    reference: string,
    onConfirmExtra?: () => void
  ) => {
    if (status === 'CANCELLED' && (currentStatus === 'ACCEPTED' || currentStatus === 'DELIVERED')) {
      showToast("Vous ne pouvez pas annuler une commande déjà acceptée ou livrée.", "error");
      return;
    }
    setStatusConfirmTarget({ id, status, currentStatus, reference, onConfirmExtra });
  };

  const handleToastMessage = (message: string, type: 'success' | 'error') => {
    showToast(message, type);
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/10 relative">


      {/* Search & Filters */}
      <OrdersFilters
        orderSearchQuery={orderSearchQuery}
        setOrderSearchQuery={setOrderSearchQuery}
        orderStatusFilter={orderStatusFilter}
        setOrderStatusFilter={setOrderStatusFilter}
        orderCurrentPage={orderCurrentPage}
        setOrderCurrentPage={setOrderCurrentPage}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        totalOrders={totalOrders}
      />

      {/* Orders Table & Pagination */}
      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        error={error as Error | null}
        ordersPerPage={ordersPerPage}
        setOrdersPerPage={setOrdersPerPage}
        orderCurrentPage={orderCurrentPage}
        setOrderCurrentPage={setOrderCurrentPage}
        totalPages={totalPages}
        totalOrders={totalOrders}
        updateStatusMutation={updateStatusMutation}
        onViewDetails={setSelectedOrder}
        onStatusChangeClick={handleStatusChangeClick}
        onToastMessage={handleToastMessage}
        onPrintOrder={setPrintOrder}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        updateStatusMutation={updateStatusMutation}
        onStatusChangeClick={handleStatusChangeClick}
      />

      {/* Status Confirmation Modal */}
      <OrderStatusConfirmModal
        isOpen={statusConfirmTarget !== null}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={async () => {
          if (statusConfirmTarget) {
            try {
              await updateStatusMutation.mutateAsync({
                id: statusConfirmTarget.id,
                status: statusConfirmTarget.status,
              });
              if (statusConfirmTarget.onConfirmExtra) {
                statusConfirmTarget.onConfirmExtra();
              }
              showToast("Statut de la commande mis à jour avec succès !", "success");
            } catch (err: any) {
              console.error("Status update error:", err);
              showToast(err.message || "Une erreur est survenue.", "error");
            }
            setStatusConfirmTarget(null);
          }
        }}
        reference={statusConfirmTarget?.reference || ''}
        currentStatus={statusConfirmTarget?.currentStatus || ''}
        newStatus={statusConfirmTarget?.status || ''}
      />

      {/* Print receipt portal */}
      {printOrder && (
        <OrderPrintReceipt
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </div>
  );
}
