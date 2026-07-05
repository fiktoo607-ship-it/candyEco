"use client";

import React from 'react';
import { useOrdersSection } from './hooks/useOrdersSection';
import {
  OrdersFilters,
  OrdersTable,
  OrderDetailsModal,
  OrderStatusConfirmModal
} from './helpers/OrdersSectionHelpers';

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

  const [statusConfirmTarget, setStatusConfirmTarget] = React.useState<{
    id: string;
    status: string;
    currentStatus: string;
    reference: string;
    onConfirmExtra?: () => void;
  } | null>(null);

  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleStatusChangeClick = (
    id: string,
    status: string,
    currentStatus: string,
    reference: string,
    onConfirmExtra?: () => void
  ) => {
    setStatusConfirmTarget({ id, status, currentStatus, reference, onConfirmExtra });
  };

  const handleToastMessage = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/10 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-md py-sm text-white shadow-lg flex items-center gap-sm animate-fade-in border ${
          toast.type === 'success' 
            ? 'bg-emerald-600 border-emerald-500/30' 
            : 'bg-rose-600 border-rose-500/30'
        }`}>
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

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
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        updateStatusMutation={updateStatusMutation}
        onUpdateOrderLocal={setSelectedOrder}
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
              setToast({ message: "Statut de la commande mis à jour avec succès !", type: 'success' });
            } catch (err: any) {
              console.error("Status update error:", err);
              setToast({ message: err.message || "Une erreur est survenue.", type: 'error' });
            }
            setStatusConfirmTarget(null);
          }
        }}
        reference={statusConfirmTarget?.reference || ''}
        currentStatus={statusConfirmTarget?.currentStatus || ''}
        newStatus={statusConfirmTarget?.status || ''}
      />
    </div>
  );
}
