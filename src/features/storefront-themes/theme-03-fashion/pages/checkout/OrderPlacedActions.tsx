import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGetOrderStatusLink } from '@/api/services/orders';
import { fashionTheme as t } from '../../theme.config';
import { PillButton } from '../../ui/primitives';

/** Order-placed actions: "View order status" (signed public link) and, for guests, a nudge to create an account with the same email. */
export function OrderPlacedActions({ orderId, guestEmail }: { orderId: string | undefined; guestEmail: string | null }) {
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
    <div className="flex flex-col items-center gap-3">
      {guestEmail !== null && (
        <p className="m-0 max-w-[460px] text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>
          {guestEmail ? <>A confirmation was sent to <strong style={{ color: t.colors.ink }}>{guestEmail}</strong>. </> : null}
          <Link to="/register" className="font-semibold underline" style={{ color: t.colors.ink }}>Create an account</Link> with this email to track all your orders.
        </p>
      )}
      {orderId && <PillButton variant="outline" loading={busy} onClick={open}>{busy ? 'Opening…' : 'View order status'}</PillButton>}
      {error && <p role="alert" className="m-0 text-[13px]" style={{ color: t.colors.danger }}>{error}</p>}
    </div>
  );
}
