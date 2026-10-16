import type { NotificationItem } from '@/api/services/notifications';

export type NotificationKind = 'order' | 'message' | 'promo' | 'general';

export function notificationKind(n: Pick<NotificationItem, 'type'>): NotificationKind {
  const type = (n.type || '').toLowerCase();
  if (type.includes('order') || type.includes('shipp') || type.includes('deliver') || type.includes('refund') || type.includes('return')) return 'order';
  if (type.includes('message') || type.includes('chat')) return 'message';
  if (type.includes('promo') || type.includes('loyalty') || type.includes('gift') || type.includes('reward')) return 'promo';
  return 'general';
}

/** Where tapping a notification should lead, when the payload says so. */
export function notificationLink(n: Pick<NotificationItem, 'type' | 'data'>): string | null {
  const data = n.data ?? {};
  const orderId = typeof data.orderId === 'string' ? data.orderId : typeof data.order_id === 'string' ? data.order_id : null;
  if (orderId) return `/orders/${orderId}`;
  if (notificationKind(n) === 'message') return '/messages';
  return null;
}
