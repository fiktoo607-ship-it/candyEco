import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface OrderPayload {
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItemInput[];
  sessionId?: string;
}

export interface UpdateStatusPayload {
  id: string;
  status: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: string;
  amountAtPurchase: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    title: string;
    slug: string;
    price: string;
    category: string;
    imageUrl: string;
    description: string;
    story: string;
    limitBay: number | null;
    state: string;
  } | null;
}

export interface Order {
  id: string;
  sessionId: string | null;
  status: string;
  totalPrice: string;
  totalAmount: number;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  pointsEarned: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    totalPages: number;
  };
}

export function useSubmitOrder() {
  return useMutation({
    mutationFn: async (payload: OrderPayload) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit order');
      }

      return res.json();
    },
  });
}

export function useOrders(params: { page: number; limit: number; query?: string; status?: string; sortBy?: string; sortOrder?: string }) {
  return useQuery<OrdersResponse>({
    queryKey: ['orders', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
      });
      if (params.query) searchParams.append('query', params.query);
      if (params.status) searchParams.append('status', params.status);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

      const res = await fetch(`/api/orders?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }
      return res.json() as Promise<OrdersResponse>;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: UpdateStatusPayload) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update order status');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
