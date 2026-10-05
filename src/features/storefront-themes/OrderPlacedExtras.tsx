import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGetOrderStatusLink } from '@/api/services/orders';

interface Props {
  orderId: string | undefined;
  guestEmail: string | null;
  fontFamily: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  dangerColor: string;
  buttonStyle: CSSProperties;
}

/** Shown on the order-placed screen of both themes: "View order status" (signed public link) and,
 *  for guests, the Shopify-like "create an account with this email" nudge. */
export function OrderPlacedExtras({ orderId, guestEmail, fontFamily, textColor, mutedColor, accentColor, dangerColor, buttonStyle }: Props) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = async () => {
    if (!orderId) return;
    setBusy(true); setError('');
    try {
      const res = await apiGetOrderStatusLink(orderId);
      navigate(`/order-status/${encodeURIComponent(res.data.token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the order status page.');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col items-center gap-3" style={{ marginBottom: '20px' }}>
      {guestEmail !== null && (
        <p style={{ fontFamily, fontSize: '12.5px', color: mutedColor, lineHeight: 1.6 }}>
          {guestEmail ? <>A confirmation was sent to <strong style={{ color: textColor }}>{guestEmail}</strong>. </> : null}
          <Link to="/register" style={{ color: accentColor, fontWeight: 600 }}>Create an account</Link> with this email to track all your orders.
        </p>
      )}
      {orderId && (
        <button type="button" onClick={open} disabled={busy} className="cursor-pointer" style={{ ...buttonStyle, opacity: busy ? 0.7 : 1 }}>
          {busy ? 'Opening…' : 'View order status'}
        </button>
      )}
      {error && <p role="alert" style={{ fontFamily, fontSize: '12px', color: dangerColor }}>{error}</p>}
    </div>
  );
}
