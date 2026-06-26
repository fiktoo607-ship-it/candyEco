import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from './use-orders';

export interface OrderNotification {
  id: string;
  orderId: string;
  order: Order;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  return useQuery<OrderNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return res.json() as Promise<OrderNotification[]>;
    },
    refetchInterval: 10000, // Polling fallback: every 10 seconds
  });
}

export interface MarkReadPayload {
  id?: string;
  readAll?: boolean;
}

export function useMarkNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MarkReadPayload) => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update notifications');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
