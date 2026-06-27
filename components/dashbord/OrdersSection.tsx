"use client";

import { useState } from 'react';
import { useOrders, useUpdateOrderStatus, Order } from '@/lib/hooks/use-orders';
import { useDashboardStore } from '@/lib/dashboard-store';
import {
  OrdersFilters,
  OrdersTable,
  OrderDetailsModal
} from './helpers/OrdersSectionHelpers';

export default function OrdersSection() {
  const {
    orderSearchQuery,
    setOrderSearchQuery,
    orderStatusFilter,
    setOrderStatusFilter,
    orderCurrentPage,
    setOrderCurrentPage,
  } = useDashboardStore();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const ordersPerPage = 5;

  const { data: ordersData, isLoading: isOrdersLoading, error: ordersError } = useOrders({
    page: orderCurrentPage,
    limit: ordersPerPage,
    query: orderSearchQuery,
    status: orderStatusFilter,
    sortBy,
    sortOrder,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/10">
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
        totalOrders={ordersData?.meta?.total || 0}
      />

      {/* Orders Table & Pagination */}
      <OrdersTable
        orders={ordersData?.data || []}
        isLoading={isOrdersLoading}
        error={ordersError}
        ordersPerPage={ordersPerPage}
        orderCurrentPage={orderCurrentPage}
        setOrderCurrentPage={setOrderCurrentPage}
        totalPages={ordersData?.meta?.totalPages || 0}
        totalOrders={ordersData?.meta?.total || 0}
        updateStatusMutation={updateStatusMutation}
        onViewDetails={setSelectedOrder}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        updateStatusMutation={updateStatusMutation}
        onUpdateOrderLocal={setSelectedOrder}
      />
    </div>
  );
}
