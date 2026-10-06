import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

interface Look { fontFamily: string; color: string; accent: string; border: string; bg: string }

/** Shown on an exchange order: "Replacement for order #X" with a link back to the original (both themes). */
export function ExchangeOrderBanner({ exchangeOf, look }: {
  exchangeOf: { orderId: string; orderNumber: string } | null | undefined; look: Look;
}) {
  if (!exchangeOf) return null;
  return (
    <div role="status" className="flex items-center gap-2" style={{ border: `1px solid ${look.border}`, background: look.bg, padding: '12px 16px', marginBottom: '20px', fontFamily: look.fontFamily, fontSize: '13px', color: look.color }}>
      <RefreshCw size={14} style={{ color: look.accent, flexShrink: 0 }} />
      <span>
        This is the replacement order for{' '}
        <Link to={`/orders/${exchangeOf.orderId}`} style={{ color: look.accent, fontWeight: 600, textDecoration: 'underline' }}>#{exchangeOf.orderNumber}</Link>.
      </span>
    </div>
  );
}

/** Shown on a returned line that was resolved by an exchange: links to the replacement order. */
export function ExchangeItemLink({ orderId, orderNumber, color, fontFamily }: {
  orderId: string | null | undefined; orderNumber?: string | null; color: string; fontFamily: string;
}) {
  if (!orderId) return null;
  return (
    <Link to={`/orders/${orderId}`} className="inline-flex items-center gap-1" style={{ fontFamily, fontSize: '12px', fontWeight: 600, color, textDecoration: 'underline' }}>
      <RefreshCw size={11} /> Exchange order{orderNumber ? ` #${orderNumber}` : ''}
    </Link>
  );
}
