import type { NotificationItem } from '@/api/services/notifications';

/**
 * Where a notification should open when clicked (Shopify-style: every alert is a shortcut to the thing it is about).
 * Resolved from the notification's type + data, not from a link saved at creation time, so older notifications work too.
 * Returns null when there is nowhere useful to go (the click then only marks it read).
 */
export function notificationTarget(n: Pick<NotificationItem, 'type' | 'storeId' | 'data'>, fallbackStoreId?: string | null): string | null {
  const d = n.data ?? {};
  const type = n.type;

  if (type.startsWith('admin_')) {
    const admin: Record<string, string> = {
      admin_new_seller: '/admin/clients',
      admin_new_store: '/admin/clients',
      admin_verification_submitted: '/admin/clients',
      admin_refund_request: '/admin/finance',
      admin_payout_request: '/admin/finance',
      admin_platform_billing_failed: '/admin/billing',
      admin_promotion_request: '/admin/billing',
      admin_store_app_request: '/admin/store-app-requests',
      admin_contact_message: '/admin/contact',
      admin_email_failure: '/admin/settings',
      admin_security_alert: '/admin/activity-log',
      admin_memory_pressure: '/admin/analytics',
    };
    return admin[type] ?? (typeof d.link === 'string' && d.link.startsWith('/admin') ? d.link : null);
  }

  const storeId = n.storeId || (typeof d.storeId === 'string' ? d.storeId : null) || fallbackStoreId || null;
  const base = storeId ? `/store/${storeId}` : null;
  const id = (v: unknown) => (typeof v === 'string' && v ? v : null);
  const own = (path: string) => (base ? `${base}/${path}` : null);

  const orderId = id(d.orderId);
  if (orderId && (type.startsWith('order_') || type.startsWith('refund_') || type === 'payment_success' || type === 'payment_failed')) {
    return own(`orders/detail/${orderId}`);
  }

  switch (type) {
    case 'order_placed':
    case 'order_shipped':
    case 'order_delivered':
    case 'order_cancelled':
    case 'order_updated':
    case 'order_payment_overdue':
    case 'payment_success':
    case 'payment_failed':
      return own('orders');
    case 'refund_requested':
    case 'refund_issued':
      return own('returns');
    case 'dispute_opened':
    case 'dispute_updated':
      return own('disputes');
    case 'manual_payment_submitted':
    case 'manual_payment_approved':
    case 'manual_payment_rejected':
      return own('payment-proofs');
    case 'new_message':
      return own('messages');
    case 'contact_form_message':
      return own('online-store/contact-messages');
    case 'low_stock':
      return own('inventory');
    case 'purchase_order_overdue':
      return id(d.poId) ? own(`purchase-orders/${d.poId}`) : own('purchase-orders');
    case 'draft_order_invoice_overdue':
      return id(d.draftOrderId) ? own(`draft-orders/${d.draftOrderId}`) : own('draft-orders');
    case 'loyalty_points_earned':
    case 'loyalty_tier_upgrade':
      return own('loyalty');
    case 'subscription_renewal_reminder':
    case 'subscription_payment_failed':
    case 'subscription_cancelled':
    case 'subscriber_at_risk':
      return own('customer/subscribers');
    case 'platform_plan_renewal_reminder':
    case 'platform_plan_payment_failed':
    case 'platform_plan_trial_ended':
    case 'platform_plan_storefront_hidden':
    case 'platform_plan_admin_action':
      return own('plan-billing');
    case 'payout_auto_initiated':
    case 'payout_completed':
    case 'payout_rejected':
    case 'payout_retried':
      return own('finance');
    case 'store_approved':
    case 'store_rejected':
    case 'verification_under_review':
      return own('verification');
    case 'store_app_request_submitted':
    case 'store_app_platform_updated':
    case 'store_app_published':
    case 'store_app_rejected':
      return own('online-store/apps');
    case 'promotion_request_submitted':
    case 'promotion_approved':
    case 'promotion_rejected':
    case 'promotion_payment_succeeded':
    case 'promotion_payment_failed':
    case 'promotion_going_live':
    case 'promotion_expiring_soon':
    case 'promotion_expired':
      return own('online-store/featured');
    default:
      // A route the server attached itself (only same-app paths).
      return typeof d.link === 'string' && d.link.startsWith('/') && !d.link.startsWith('//') ? d.link : null;
  }
}
