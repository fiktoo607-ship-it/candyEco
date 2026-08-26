export const ORDER_STATUS_CONFIG: Record<
  'PENDING' | 'ACCEPTED' | 'DELIVERED' | 'CANCELLED',
  { label: string; bg: string; selectClass: string; badgeClass: string }
> = {
  PENDING: {
    label: 'En attente',
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-800',
    selectClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  ACCEPTED: {
    label: 'Acceptée',
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800',
    selectClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  DELIVERED: {
    label: 'Livrée',
    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-800',
    selectClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  CANCELLED: {
    label: 'Annulée',
    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-800',
    selectClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900',
    badgeClass: 'bg-rose-100 text-rose-800',
  },
};

export const VALID_ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatus = (typeof VALID_ORDER_STATUSES)[number];

export function isValidOrderStatus(status: string): status is OrderStatus {
  return VALID_ORDER_STATUSES.includes(status.toUpperCase() as OrderStatus);
}

export function isValidStatusTransition(current: string, target: string): boolean {
  const cur = current.toUpperCase();
  const tgt = target.toUpperCase();

  if (!isValidOrderStatus(tgt)) {
    return false;
  }

  if (cur === tgt) return true;

  // Terminal states cannot transition to anything else
  if (cur === 'CANCELLED' || cur === 'DELIVERED') {
    return false;
  }

  // From ACCEPTED, we can only transition to DELIVERED
  if (cur === 'ACCEPTED') {
    return tgt === 'DELIVERED';
  }

  // From PENDING, we can transition to ACCEPTED, DELIVERED, or CANCELLED
  if (cur === 'PENDING') {
    return tgt === 'ACCEPTED' || tgt === 'DELIVERED' || tgt === 'CANCELLED';
  }

  return false;
}

