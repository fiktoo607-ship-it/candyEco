"use client";

import React from 'react';
import { useOrdersSection } from './hooks/useOrdersSection';
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
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedOrder,
    setSelectedOrder,
    ordersPerPage,
    orders,
    isLoading,
    error,
    totalPages,
    totalOrders,
    updateStatusMutation,
  } = useOrdersSection();

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
        totalOrders={totalOrders}
      />

      {/* Orders Table & Pagination */}
      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        error={error as Error | null}
        ordersPerPage={ordersPerPage}
        orderCurrentPage={orderCurrentPage}
        setOrderCurrentPage={setOrderCurrentPage}
        totalPages={totalPages}
        totalOrders={totalOrders}
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
