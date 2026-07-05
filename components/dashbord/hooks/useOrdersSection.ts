import { useState } from 'react';
import { useOrders, useUpdateOrderStatus, Order } from '@/lib/hooks/use-orders';
import { useDashboardStore } from '@/lib/dashboard-store';

export function useOrdersSection() {
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

  const [ordersPerPage, setOrdersPerPage] = useState(5);

  const { data: ordersData, isLoading: isOrdersLoading, error: ordersError } = useOrders({
    page: orderCurrentPage,
    limit: ordersPerPage,
    query: orderSearchQuery,
    status: orderStatusFilter,
    sortBy,
    sortOrder,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  return {
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
    orders: ordersData?.data || [],
    isLoading: isOrdersLoading,
    error: ordersError,
    totalPages: ordersData?.meta?.totalPages || 0,
    totalOrders: ordersData?.meta?.total || 0,
    updateStatusMutation,
  };
}
