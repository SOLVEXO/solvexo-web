import { useState, type ElementType, type ReactNode } from 'react';
import {
  Clock, ShoppingBag, Pencil, RefreshCw, CreditCard, XCircle, Undo2, MessageSquare, StickyNote, MapPin, AlertCircle, Mail,
} from 'lucide-react';
import { Button, Select, Textarea } from '@/components/comman/ui';
import { apiAddOrderComment, apiResendOrderEmail, type ResendableCustomerEmail } from '@/api/services/orders';
import type { OrderTimelineEntry, OrderTimelineType } from '@/api/services/product';
import { timeAgo } from '@/utils/timeAgo';

const MAX_COMMENT = 2000;

const ICONS: Record<OrderTimelineType, ElementType> = {
  email: Mail, placed: ShoppingBag, exchange: RefreshCw, edit: Pencil, status: RefreshCw, payment: CreditCard, cancel: XCircle,
  refund: Undo2, comment: MessageSquare, note: StickyNote, address: MapPin,
};

/** Shared card chrome for the order-detail cards added alongside the timeline. */
export function OrderSideCard({ title, icon: Icon, action, children }: {
  title: string; icon?: ElementType; action?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone flex items-center gap-2">
        {Icon && <Icon size={14} className="text-brand-orange shrink-0" />}
        <p className="text-[12px] font-bold text-charcoal uppercase tracking-[0.06em] flex-1">{title}</p>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function actorLabel(entry: OrderTimelineEntry, currentUserId: string | null): string {
  const buyer = entry.actorRole === 'buyer' || entry.actorRole === 'user';
  if (!entry.actorId) return buyer ? 'Customer' : 'System';
  if (currentUserId && entry.actorId === currentUserId) return 'You';
  if (entry.actorRole === 'staff') return 'Staff';
  if (entry.actorRole === 'seller') return 'Store owner';
  if (entry.actorRole === 'admin') return 'Solvexo';
  return buyer ? 'Customer' : 'System';
}

interface Props {
  storeId: string;
  orderId: string;
  entries: OrderTimelineEntry[];
  currentUserId: string | null;
  canComment: boolean;
  /** Called with the saved entry so the parent can prepend it (newest first). */
  onPosted: (entry: OrderTimelineEntry) => void;
  /** Show the Shopify "Resend email" control (needs orders.edit). */
  canResend?: boolean;
  isPickup?: boolean;
  /** Called after an email was resent so the parent reloads the order (the timeline gets the new entry). */
  onResent?: () => void;
}

/** Shopify's "Resend email" — pick which customer email to send again. */
function ResendEmail({ storeId, orderId, isPickup, onResent }: { storeId: string; orderId: string; isPickup: boolean; onResent?: () => void }) {
  const [choice, setChoice] = useState<ResendableCustomerEmail | ''>('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const send = () => {
    if (!choice || busy) return;
    setBusy(true);
    setMsg(null);
    apiResendOrderEmail(storeId, orderId, choice)
      .then(() => { setMsg({ ok: true, text: 'Email sent to the customer.' }); setChoice(''); onResent?.(); })
      .catch((err: unknown) => setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not send the email.' }))
      .finally(() => setBusy(false));
  };

  return (
    <div className="pb-4 mb-4 border-b border-bone flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select aria-label="Customer email to resend" value={choice} onChange={e => setChoice(e.target.value as ResendableCustomerEmail | '')} disabled={busy}>
            <option value="">Resend an email to the customer…</option>
            <option value="order_confirmation">Order confirmation</option>
            {isPickup
              ? <option value="order_ready_for_pickup">Ready for pickup</option>
              : <option value="order_shipped">Shipping confirmation</option>}
            <option value="order_delivered">{isPickup ? 'Picked up' : 'Delivered'}</option>
            <option value="order_cancelled">Order canceled</option>
            <option value="order_refunded">Refund</option>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={send} loading={busy} disabled={!choice || busy}>Send</Button>
      </div>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'text-[12px] text-success' : 'flex items-center gap-1.5 text-[12px] text-error'}>
          {!msg.ok && <AlertCircle size={13} />} {msg.text}
        </p>
      )}
    </div>
  );
}

export function OrderTimelineCard({ storeId, orderId, entries, currentUserId, canComment, onPosted, canResend = false, isPickup = false, onResent }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const post = () => {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError('');
    apiAddOrderComment(storeId, orderId, message)
      .then(res => { onPosted(res.data); setText(''); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to post comment.'))
      .finally(() => setBusy(false));
  };

  return (
    <OrderSideCard title="Timeline" icon={Clock}>
      {canResend && <ResendEmail storeId={storeId} orderId={orderId} isPickup={isPickup} onResent={onResent} />}
      {canComment && (
        <div className="flex flex-col gap-2 pb-4 mb-4 border-b border-bone">
          <Textarea
            rows={2}
            maxLength={MAX_COMMENT}
            placeholder="Leave a comment..."
            aria-label="Leave a comment"
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={busy}
          />
          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-[12px] text-error"><AlertCircle size={13} /> {error}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate">Only you and your staff can see comments.</span>
            <Button size="sm" onClick={post} loading={busy} disabled={busy || !text.trim()}>Post</Button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-[12.5px] text-slate">No activity yet.</p>
      ) : (
        <ol className="flex flex-col">
          {entries.map((e, i) => {
            const Icon = ICONS[e.type] ?? Clock;
            const isComment = e.type === 'comment';
            return (
              <li key={`${e.createdAt}-${i}`} className="flex gap-3 relative pb-4 last:pb-0">
                {i < entries.length - 1 && <span aria-hidden className="absolute left-[13px] top-7 bottom-0 w-px bg-bone" />}
                <span className="w-[27px] h-[27px] rounded-full bg-cream border border-bone flex items-center justify-center shrink-0 z-[1]">
                  <Icon size={12} className="text-slate" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={isComment
                    ? 'text-[12.5px] text-charcoal bg-cream border border-bone rounded-lg px-3 py-2 whitespace-pre-wrap break-words'
                    : 'text-[12.5px] text-charcoal whitespace-pre-wrap break-words'}>{e.message}</p>
                  <p className="text-[11px] text-slate mt-1">
                    {actorLabel(e, currentUserId)} · {timeAgo(e.createdAt)} · {new Date(e.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </OrderSideCard>
  );
}
