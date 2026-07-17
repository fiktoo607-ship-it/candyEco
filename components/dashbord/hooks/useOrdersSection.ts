import { useState } from 'react';
import { useOrders, useUpdateOrderStatus, Order } from '@/lib/hooks/use-orders';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useDashboardPagination } from './useDashboardPagination';

export function useOrdersSection() {
  const {
    orderSearchQuery,
    setOrderSearchQuery,
    orderStatusFilter,
    setOrderStatusFilter,
    orderCurrentPage,
    setOrderCurrentPage,
  } = useDashboardStore();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const {
    currentPage,
    searchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    limit: ordersPerPage,
    setLimit: setOrdersPerPage,
  } = useDashboardPagination({
    searchQuery: orderSearchQuery,
    setSearchQuery: setOrderSearchQuery,
    currentPage: orderCurrentPage,
    setCurrentPage: setOrderCurrentPage,
    initialSortBy: 'createdAt',
    initialSortOrder: 'desc',
    initialLimit: 5,
    filters: { status: orderStatusFilter },
  });

  const { data: ordersData, isLoading: isOrdersLoading, error: ordersError } = useOrders({
    page: currentPage,
    limit: ordersPerPage,
    query: searchQuery,
    status: orderStatusFilter,
    sortBy,
    sortOrder,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  return {
    orderSearchQuery: searchQuery,
    setOrderSearchQuery,
    orderStatusFilter,
    setOrderStatusFilter,
    orderCurrentPage: currentPage,
    setOrderCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedOrder,
    setSelectedOrder,
    ordersPerPage,
    setOrdersPerPage,
    orders: ordersData?.data || [],
    isLoading: isOrdersLoading,
    error: ordersError,
    totalPages: ordersData?.meta?.totalPages || 0,
    totalOrders: ordersData?.meta?.total || 0,
    updateStatusMutation,
  };
}
