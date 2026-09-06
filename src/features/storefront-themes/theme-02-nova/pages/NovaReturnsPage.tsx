import { useState, useEffect } from 'react';
import { RotateCcw, Package, Loader2, Check } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { apiGetMyOrders, apiRequestReturn, type OrderSummary } from '@/api/services/orders';
import { novaTheme as t } from '../theme.config';

const ELIGIBLE_STATUSES = new Set(['delivered', 'completed']);

/** Theme 02's own Return/Refund request page — ported functionally 1:1
 *  from `AtelierReturnsPage`, restyled with Nova's rounded/pill vocabulary. */
export function NovaReturnsPage() {
  useStorefrontSeo({ title: 'Returns', noindex: true });
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState('');
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedKeys, setSubmittedKeys] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState('');

  useEffect(() => {
    apiGetMyOrders({ page: 1, limit: 50 })
      .then(res => setOrders(res.data.orders))
      .catch(() => setError('Could not load your orders right now.'));
  }, []);

  const eligible = (orders ?? []).filter(o => ELIGIBLE_STATUSES.has(o.orderStatus));

  const submitReturn = async (orderId: string, itemId: string, itemKey: string) => {
    if (!reason.trim()) { setFormError('Please describe the issue.'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      await apiRequestReturn(orderId, { reason: reason.trim(), itemIds: [itemId] });
      setSubmittedKeys(prev => new Set(prev).add(itemKey));
      setOpenItemKey(null);
      setReason('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto" style={{ maxWidth: '820px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink, marginBottom: '8px' }}>Returns</h1>
      <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginBottom: '28px' }}>
        Request a return on any delivered item.
      </p>

      {error && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</p>}

      {orders === null && !error ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="animate-pulse" style={{ height: '80px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />)}
        </div>
      ) : eligible.length === 0 ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '64px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <RotateCcw size={28} style={{ color: t.colors.inkMuted, marginBottom: '14px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink }}>No returnable orders</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
            Delivered orders will show up here, ready to return.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {eligible.map(order => (
            <div key={order.orderId} style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, overflow: 'hidden' }}>
              <div className="flex items-center justify-between flex-wrap gap-2" style={{ padding: '14px 18px', borderBottom: `1.5px solid ${t.colors.border}`, background: t.colors.bgAlt }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: t.colors.accent }}>{order.orderNumber}</span>
                <span style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.inkMuted }}>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              {order.stores.flatMap(s => s.items).map(item => {
                const itemKey = `${order.orderId}:${item.itemId}`;
                const isOpen = openItemKey === itemKey;
                const isDone = submittedKeys.has(itemKey);
                return (
                  <div key={itemKey} style={{ padding: '14px 18px', borderBottom: `1.5px solid ${t.colors.border}` }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package size={14} style={{ color: t.colors.inkMuted, flexShrink: 0 }} />
                        <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink }} className="truncate">{item.name} ×{item.quantity}</span>
                      </div>
                      {isDone ? (
                        <span className="flex items-center gap-1" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.success }}>
                          <Check size={13} /> Requested
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setOpenItemKey(isOpen ? null : itemKey); setReason(''); setFormError(''); }}
                          className="cursor-pointer bg-transparent"
                          style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.ink, border: `1.5px solid ${t.colors.border}`, borderRadius: '9999px', padding: '7px 14px' }}
                        >
                          {isOpen ? 'Cancel' : 'Request Return'}
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="flex flex-col gap-2" style={{ marginTop: '12px' }}>
                        <textarea
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                          placeholder="Describe the issue (e.g. damaged, wrong item)…"
                          rows={2}
                          className="w-full"
                          style={{ fontFamily: t.fonts.body, fontSize: '13px', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.sm, padding: '10px 12px', resize: 'vertical', color: t.colors.ink, background: '#FFFFFF' }}
                        />
                        {formError && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.danger }}>{formError}</p>}
                        <button
                          type="button"
                          onClick={() => submitReturn(order.orderId, item.itemId, itemKey)}
                          disabled={submitting}
                          className="flex items-center gap-1.5 self-start cursor-pointer disabled:opacity-50"
                          style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: '#FFFFFF', background: t.colors.accent, border: 'none', borderRadius: '9999px', padding: '9px 18px' }}
                        >
                          {submitting && <Loader2 size={13} className="animate-spin" />} Submit Request
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
