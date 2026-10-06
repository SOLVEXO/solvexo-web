import { useState, type ElementType, type ReactNode } from 'react';
import {
  Clock, ShoppingBag, Pencil, RefreshCw, CreditCard, XCircle, Undo2, MessageSquare, StickyNote, MapPin, AlertCircle,
} from 'lucide-react';
import { Button, Textarea } from '@/components/comman/ui';
import { apiAddOrderComment } from '@/api/services/orders';
import type { OrderTimelineEntry, OrderTimelineType } from '@/api/services/product';
import { timeAgo } from '@/utils/timeAgo';

const MAX_COMMENT = 2000;

const ICONS: Record<OrderTimelineType, ElementType> = {
  placed: ShoppingBag, exchange: RefreshCw, edit: Pencil, status: RefreshCw, payment: CreditCard, cancel: XCircle,
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
}

export function OrderTimelineCard({ storeId, orderId, entries, currentUserId, canComment, onPosted }: Props) {
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
