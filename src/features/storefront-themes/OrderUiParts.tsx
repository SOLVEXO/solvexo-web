import { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { apiGetDownloadLink } from '@/api/services/orders';
import { BADGE_TONE_COLOR, type OrderBadgeInfo } from './orderUi';

/** Small status pill shared by both themes' Orders pages (theme supplies font/radius). */
export function OrderBadge({ badge, fontFamily, radius = '2px' }: { badge: OrderBadgeInfo; fontFamily: string; radius?: string }) {
  const color = BADGE_TONE_COLOR[badge.tone];
  return (
    <span
      className="inline-block whitespace-nowrap"
      style={{ fontFamily, fontSize: '11px', fontWeight: 600, color, border: `1px solid ${color}`, borderRadius: radius, padding: '2px 8px' }}
    >
      {badge.label}
    </span>
  );
}

/** Digital-item download (same behaviour as the Account page's `DownloadLink`),
 *  with the failure surfaced instead of swallowed. */
export function OrderDownloadLink({ orderId, productId, color, fontFamily, fontWeight = 600 }: {
  orderId: string; productId: string; color: string; fontFamily: string; fontWeight?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiGetDownloadLink(orderId, productId, 0);
      const base = import.meta.env.VITE_API_URL as string;
      window.open(`${base}${res.data.endpoint}?token=${res.data.token}`, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally { setBusy(false); }
  };
  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" onClick={handle} disabled={busy} className="flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0" style={{ fontFamily, fontSize: '11.5px', fontWeight, color }}>
        {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} Download
      </button>
      {error && <span role="alert" style={{ fontFamily, fontSize: '11px', color: BADGE_TONE_COLOR.danger }}>{error}</span>}
    </span>
  );
}
