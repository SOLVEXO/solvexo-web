import { useEffect, useState } from 'react';
import { Package, Pause, Play, SkipForward } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Card, InfoRow, Input, SkeletonBox } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { formatMoney } from '@/utils/currency';
import type { BadgeColor } from '@/types';
import { apiGetContract, type ContractDetail, type ContractLine, type ContractRow, type ContractStatus, type PlanUnit } from '@/api/services/sellingPlans';

export const STATUS_COLOR: Record<ContractStatus, BadgeColor> = { active: 'green', paused: 'yellow', cancelled: 'gray', completed: 'blue' };
export const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');
export const every = (t: { unit: PlanUnit; count: number }) => `Every ${t.count === 1 ? '' : `${t.count} `}${t.unit}${t.count === 1 ? '' : 's'}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const money = (n: number | null | undefined, code?: string) => (n == null ? '—' : formatMoney(Math.round(n * 100) / 100, code));
/** The name the server gives a product that no longer exists (it is already the message, no extra badge needed). */
const GONE = 'Product no longer available';
const qtyOf = (c: ContractRow) => c.items.reduce((n, i) => n + i.quantity, 0);

/** One product of a subscription: photo, name, variant, quantity × today's discounted price. */
export function LineRow({ line, currency }: { line: ContractLine; currency?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-bone bg-mist flex items-center justify-center text-slate">
        {line.image ? <img src={line.image} alt="" loading="lazy" className="size-full object-cover" /> : <Package size={18} aria-hidden />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[13px] font-semibold text-charcoal">{line.name}</p>
        <p className="m-0 mt-0.5 text-[12px] text-slate">
          {line.variantLabel ? `${line.variantLabel} · ` : ''}Qty {line.quantity}{line.unitPrice != null ? ` × ${money(line.unitPrice, currency)}` : ''}
        </p>
        {!line.available && line.name !== GONE && <Badge color="red" size="sm">No longer available</Badge>}
      </div>
      <p className="m-0 shrink-0 text-[13px] font-semibold tabular-nums text-charcoal">{money(line.lineTotal, currency)}</p>
    </div>
  );
}

/** What the card shows for products; older rows without the server's `lines` still say how many items. */
function Lines({ c, currency }: { c: ContractRow; currency?: string }) {
  if (!c.lines?.length) return <p className="m-0 py-2 text-[12.5px] text-slate">{qtyOf(c)} item(s)</p>;
  return <div className="divide-y divide-bone">{c.lines.map((l) => <LineRow key={l.variantId} line={l} currency={currency} />)}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="m-0 text-[11px] font-medium uppercase tracking-[0.06em] text-slate">{label}</p>
      <p className="m-0 mt-0.5 truncate text-[13.5px] font-semibold text-charcoal">{value}</p>
    </div>
  );
}

export interface CardActions {
  canManage: boolean;
  busy: string;
  onPause: (c: ContractRow) => void;
  onResume: (c: ContractRow) => void;
  onSkip: (c: ContractRow) => void;
  onCancel: (c: ContractRow) => void;
  onDetails: (c: ContractRow) => void;
}

/** A subscription as a card: who, what they get, when it renews, and the things a seller can do. */
export function ContractCard({ c, currency, a }: { c: ContractRow; currency: string; a: CardActions }) {
  const cur = c.currency || currency;
  const live = c.status === 'active' || c.status === 'paused';
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-bone px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-charcoal">{c.customerName || 'Customer'}</span>
            <Badge color={STATUS_COLOR[c.status]} size="sm">{cap(c.status)}</Badge>
          </div>
          <p className="m-0 mt-0.5 text-[12px] text-slate">{c.terms.name} · {every(c.terms)} · {c.terms.discountPercent}% off</p>
        </div>
        {c.estimatedTotal != null && (
          <div className="text-right">
            <p className="m-0 text-[11px] font-medium uppercase tracking-[0.06em] text-slate">Each renewal</p>
            <p className="m-0 text-[14px] font-semibold tabular-nums text-charcoal">{money(c.estimatedTotal, cur)}</p>
          </div>
        )}
      </div>

      <div className="px-4"><Lines c={c} currency={cur} /></div>

      <div className="grid grid-cols-2 gap-3 border-t border-bone px-4 py-3 sm:grid-cols-3">
        <Stat label="Next renewal" value={c.status === 'active' ? when(c.nextBillingAt) : '—'} />
        <Stat label="Orders so far" value={String(c.cyclesDone)} />
        <Stat label="Items" value={String(qtyOf(c))} />
      </div>
      {c.pausedReason && <p className="m-0 border-t border-bone bg-mist px-4 py-2 text-[12px] text-graphite">{c.pausedReason}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-bone px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {a.canManage && c.status === 'active' && (
            <Button size="sm" variant="secondary" icon={<Pause size={13} />} onClick={() => a.onPause(c)}>Pause</Button>
          )}
          {a.canManage && c.status === 'paused' && (
            <Button size="sm" variant="secondary" icon={<Play size={13} />} loading={a.busy === `r${c._id}`} onClick={() => a.onResume(c)}>Resume</Button>
          )}
          {a.canManage && c.status === 'active' && (
            <Button size="sm" variant="outline" icon={<SkipForward size={13} />} loading={a.busy === `s${c._id}`} onClick={() => a.onSkip(c)}>Skip next</Button>
          )}
          {a.canManage && live && <Button size="sm" variant="outline" onClick={() => a.onCancel(c)}>Cancel</Button>}
        </div>
        <Button size="sm" onClick={() => a.onDetails(c)}>View details</Button>
      </div>
    </Card>
  );
}

/** Pause with an optional reason: the customer sees it on their subscription page. */
export function PauseModal({ c, busy, onClose, onConfirm }: { c: ContractRow; busy: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal title="Pause this subscription?" onClose={onClose} width={460} mobileSheet
      footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Keep running</Button><Button loading={busy} onClick={() => onConfirm(reason.trim())}>Pause</Button></div>}>
      <div className="flex flex-col gap-3">
        <p className="m-0 text-[13px] text-charcoal">{c.customerName || 'The customer'} will not get new orders until you resume it. Orders already placed stay as they are.</p>
        <Input label="Reason (optional)" value={reason} maxLength={150} placeholder="e.g. Out of stock until December" onChange={(e) => setReason(e.target.value)} />
        <p className="m-0 text-[12px] text-slate">The customer sees this note on their subscription page.</p>
      </div>
    </Modal>
  );
}

const PAY_COLOR: Record<string, BadgeColor> = { paid: 'green', pending_verification: 'yellow', unpaid: 'yellow' };

/** Everything about one subscription: customer, products, address, and every order it has placed. */
export function ContractDetailModal({ storeId, contract, currency, a, onClose }: { storeId: string; contract: ContractRow; currency: string; a: CardActions; onClose: () => void }) {
  const [d, setD] = useState<ContractDetail | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let off = false;
    apiGetContract(storeId, contract._id).then((r) => { if (!off) setD(r); }).catch((e: unknown) => { if (!off) setError(e instanceof Error && e.message ? e.message : 'Could not load this subscription.'); });
    return () => { off = true; };
  }, [storeId, contract._id]);
  const c: ContractRow = d ?? contract;
  const cur = c.currency || currency;
  const addr = c.shippingAddress;
  return (
    <Modal title={`${c.customerName || 'Customer'} · ${c.terms.name}`} onClose={onClose} width={660} mobileSheet>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={STATUS_COLOR[c.status]} size="sm">{cap(c.status)}</Badge>
          <span className="text-[12.5px] text-slate">{every(c.terms)} · {c.terms.discountPercent}% off{c.terms.maxCycles ? ` · stops after ${c.terms.maxCycles} orders` : ''}</span>
        </div>
        {c.pausedReason && <p className="m-0 rounded-lg bg-mist px-3 py-2 text-[12.5px] text-graphite">{c.pausedReason}</p>}

        <section aria-label="Products">
          <h3 className="m-0 mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate">Products</h3>
          <Lines c={c} currency={cur} />
          {c.estimatedTotal != null && (
            <div className="mt-1 border-t border-bone pt-2 text-[12.5px] text-slate">
              <div className="flex justify-between"><span>Shipping</span><span className="tabular-nums">{money(c.estimatedShipping ?? 0, cur)}</span></div>
              {!!c.estimatedTax && <div className="flex justify-between"><span>Tax</span><span className="tabular-nums">{money(c.estimatedTax, cur)}</span></div>}
              <div className="mt-1 flex justify-between text-[13.5px] font-semibold text-charcoal"><span>Each renewal</span><span className="tabular-nums">{money(c.estimatedTotal, cur)}</span></div>
              <p className="m-0 mt-1 text-[11.5px]">Calculated from today's prices.</p>
            </div>
          )}
        </section>

        <section aria-label="Customer and delivery">
          <h3 className="m-0 mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate">Customer and delivery</h3>
          <InfoRow label="Customer" value={c.customerName || '—'} />
          <InfoRow label="Email" value={c.customerEmail || '—'} />
          <InfoRow label="Phone" value={addr?.phoneNumber || '—'} />
          <InfoRow label="Deliver to" value={addr ? [addr.recipientName, addr.addressLine1, addr.addressLine2, [addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')].filter(Boolean).join(' · ') : '—'} />
          <InfoRow label="Next renewal" value={c.status === 'active' ? when(c.nextBillingAt) : '—'} />
          <InfoRow label="Started" value={when(c.createdAt)} border={false} />
        </section>

        <section aria-label="Orders">
          <h3 className="m-0 mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate">Orders from this subscription</h3>
          {error ? <p role="alert" className="m-0 text-[12.5px] text-error">{error}</p>
            : !d ? <SkeletonBox className="h-16 w-full" />
            : d.history.length === 0 ? <p className="m-0 text-[12.5px] text-slate">No order has been placed yet.</p>
            : (
              <ul className="m-0 list-none divide-y divide-bone p-0">
                {d.history.map((h) => (
                  <li key={h.orderId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      {h.orderNumber
                        ? <Link to={`/store/${storeId}/orders/detail/${h.orderId}`} className="text-[13px] font-semibold text-charcoal underline decoration-bone underline-offset-2 hover:decoration-charcoal">{h.orderNumber}</Link>
                        : <span className="text-[13px] font-semibold text-charcoal">Order {h.cycleNo}</span>}
                      <span className="ms-2 text-[12px] text-slate">{when(h.placedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] tabular-nums text-charcoal">{money(h.amount, cur)}</span>
                      <Badge color={h.isPaid ? 'green' : (PAY_COLOR[h.paymentStatus ?? ''] ?? 'yellow')} size="sm">{h.isPaid ? 'Paid' : 'Unpaid'}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </section>

        {a.canManage && (c.status === 'active' || c.status === 'paused') && (
          <div className="flex flex-wrap gap-2 border-t border-bone pt-3">
            {c.status === 'active' && <Button size="sm" variant="secondary" icon={<Pause size={13} />} onClick={() => a.onPause(c)}>Pause</Button>}
            {c.status === 'paused' && <Button size="sm" variant="secondary" icon={<Play size={13} />} onClick={() => a.onResume(c)}>Resume</Button>}
            {c.status === 'active' && <Button size="sm" variant="outline" icon={<SkipForward size={13} />} onClick={() => a.onSkip(c)}>Skip next</Button>}
            <Button size="sm" variant="outline" onClick={() => a.onCancel(c)}>Cancel subscription</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
