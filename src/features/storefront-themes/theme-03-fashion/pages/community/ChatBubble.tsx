import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, CheckCheck, CornerUpLeft, FileText, ImageOff, MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { Message } from '@/api/services/messaging';
import type { OptimisticMessage } from '@/hooks/messaging/useMessages';
import { useMoney } from '../../../core/hooks/useMoney';
import { fashionTheme as t } from '../../theme.config';
import { REACTION_EMOJIS, clockTime, formatBytes, messagePreview, safeUrl } from '../../../core/community/communityFormat';

interface Props {
  message: OptimisticMessage;
  mine: boolean;
  myId?: string;
  storeName: string;
  onReply: (m: Message) => void;
  onEdit: (m: Message) => void;
  onDelete: (id: string) => void;
  onRetry: (m: OptimisticMessage) => void;
  onReact: (id: string, emoji: string) => void;
}

function Attachments({ message, onAccent }: { message: Message; onAccent: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {message.attachments.map((a, i) => {
        const url = safeUrl(a.url);
        if (!url) return null;
        if (message.type === 'image') return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${a.fileName || 'photo'}`}>
            <img src={safeUrl(a.thumbnailUrl) ?? url} alt={a.fileName || 'Photo sent in chat'} loading="lazy" className="block max-h-72 max-w-full object-cover" style={{ borderRadius: 14 }} />
          </a>
        );
        if (message.type === 'video') return <video key={i} src={url} controls preload="metadata" className="max-h-72 max-w-full" style={{ borderRadius: 14 }} aria-label={a.fileName || 'Video'}><track kind="captions" /></video>;
        if (message.type === 'voice') return <audio key={i} src={url} controls preload="metadata" className="max-w-full" aria-label={a.fileName || 'Voice message'}><track kind="captions" /></audio>;
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 no-underline" style={{ padding: '8px 12px', borderRadius: 12, background: onAccent ? 'rgba(255,255,255,.14)' : t.colors.bg, color: 'inherit' }}>
            <FileText size={18} aria-hidden />
            <span className="min-w-0"><span className="block truncate text-[13px] font-medium">{a.fileName || 'Download file'}</span>{a.fileSize > 0 && <span className="block text-xs opacity-70">{formatBytes(a.fileSize)}</span>}</span>
          </a>
        );
      })}
    </div>
  );
}

function ProductShareCard({ share }: { share: NonNullable<Message['productShare']> }) {
  const { money } = useMoney();
  return (
    <Link to={`/product/${share.slug || share.productId}`} className="flex w-[240px] max-w-full items-center gap-3 no-underline" style={{ padding: 8, borderRadius: 14, background: t.colors.bg, color: t.colors.ink, border: `1px solid ${t.colors.border}` }}>
      <span className="grid shrink-0 place-items-center overflow-hidden" style={{ width: 56, height: 56, borderRadius: 10, background: t.colors.bgAlt }}>
        {share.image ? <img src={share.image} alt="" loading="lazy" className="size-full object-cover" /> : <ImageOff size={18} aria-hidden style={{ color: t.colors.inkMuted }} />}
      </span>
      <span className="min-w-0"><span className="block truncate text-[13px] font-medium">{share.title ?? 'Product'}</span>{share.price != null && <span className="block text-[13px]" style={{ color: t.colors.inkMuted }}>{money(share.price)}</span>}</span>
    </Link>
  );
}

/** A single chat message with reply quote, attachments, reactions, ticks and an actions row. */
export function ChatBubble({ message: m, mine, myId, storeName, onReply, onEdit, onDelete, onRetry, onReact }: Props) {
  const [open, setOpen] = useState(false);
  const bg = mine ? t.colors.ink : t.colors.bgAlt;
  const fg = mine ? t.colors.bg : t.colors.ink;
  const seen = mine && m.seenBy?.some(s => s.userId !== myId);
  const link = safeUrl(m.linkPreview?.url);
  const canAct = !m.isDeleted && !m._pending && !m._failed;
  const grouped = (m.reactions ?? []).reduce<Record<string, number>>((acc, r) => { acc[r.emoji] = (acc[r.emoji] ?? 0) + 1; return acc; }, {});
  const mineReaction = (m.reactions ?? []).find(r => r.userId === myId)?.emoji;

  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <div className={`flex max-w-[88%] items-end gap-1.5 sm:max-w-[72%] ${mine ? 'flex-row-reverse' : ''}`}>
        <div className="min-w-0" style={{ background: bg, color: fg, padding: '10px 14px', borderRadius: 20, borderBottomRightRadius: mine ? 6 : 20, borderBottomLeftRadius: mine ? 20 : 6, opacity: m._pending ? 0.6 : 1 }}>
          {!mine && <p className="m-0 mb-0.5 text-xs font-semibold opacity-70">{storeName}</p>}
          {m.replyTo && (
            <div className="mb-2 text-[13px]" style={{ padding: '6px 10px', borderRadius: 10, borderLeft: `3px solid ${mine ? t.colors.bg : t.colors.ink}`, background: mine ? 'rgba(255,255,255,.14)' : t.colors.bg }}>
              <span className="block truncate opacity-80">{m.replyTo.text || messagePreview({ type: m.replyTo.type ?? 'text', text: m.replyTo.text ?? null, isDeleted: false })}</span>
            </div>
          )}
          {m.isDeleted ? (
            <p className="m-0 text-sm italic opacity-70">{ts('pg.this_message_was_deleted', 'This message was deleted')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {m.type === 'product_share' && m.productShare && <ProductShareCard share={m.productShare} />}
              {m.attachments?.length > 0 && m.type !== 'text' && <Attachments message={m} onAccent={mine} />}
              {m.text && <p className="m-0 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.text}</p>}
              {link && m.linkPreview && (
                <a href={link} target="_blank" rel="noopener noreferrer" className="block no-underline" style={{ padding: '8px 12px', borderRadius: 12, background: mine ? 'rgba(255,255,255,.14)' : t.colors.bg, color: 'inherit' }}>
                  {m.linkPreview.title && <span className="block truncate text-[13px] font-medium">{m.linkPreview.title}</span>}
                  <span className="block truncate text-xs opacity-70">{m.linkPreview.siteName || link}</span>
                </a>
              )}
            </div>
          )}
          <p className="m-0 mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">
            {m.isEdited && !m.isDeleted && <span>edited</span>}
            <time dateTime={m.createdAt}>{clockTime(m.createdAt)}</time>
            {mine && !m._pending && !m._failed && (seen ? <CheckCheck size={13} aria-label={ts('pg.seen', 'Seen')} /> : <Check size={13} aria-label={ts('pg.sent', 'Sent')} />)}
          </p>
        </div>
        {canAct && (
          <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={ts('pg.message_actions', 'Message actions')} className="grid size-8 shrink-0 place-items-center rounded-full border-0 bg-transparent" style={{ color: t.colors.inkMuted, cursor: 'pointer' }}>
            <MoreHorizontal size={16} aria-hidden />
          </button>
        )}
      </div>

      {Object.keys(grouped).length > 0 && !m.isDeleted && (
        <ul className="m-0 mt-1 flex list-none gap-1 p-0" aria-label={ts('pg.reactions', 'Reactions')}>
          {Object.entries(grouped).map(([emoji, count]) => <li key={emoji} className="rounded-full px-2 py-0.5 text-xs" style={{ background: t.colors.bgAlt, border: `1px solid ${t.colors.border}` }}>{emoji}{count > 1 ? ` ${count}` : ''}</li>)}
        </ul>
      )}

      {m._failed && (
        <p role="alert" className="m-0 mt-1 flex items-center gap-2 text-xs" style={{ color: t.colors.danger }}>
          <AlertCircle size={13} aria-hidden />Not sent.
          <button type="button" onClick={() => onRetry(m)} className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold underline" style={{ color: t.colors.danger, cursor: 'pointer' }}><RotateCcw size={12} aria-hidden />{ts('cart.retry', 'Retry')}</button>
        </p>
      )}

      {open && canAct && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 p-1.5" style={{ borderRadius: 9999, background: t.colors.bg, border: `1px solid ${t.colors.border}` }}>
          {REACTION_EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => { onReact(m._id, e); setOpen(false); }} aria-label={`React ${e}`} aria-pressed={mineReaction === e} className="grid size-8 place-items-center rounded-full border-0 text-base" style={{ cursor: 'pointer', background: mineReaction === e ? t.colors.bgAlt : 'transparent' }}>{e}</button>
          ))}
          <button type="button" onClick={() => { onReply(m); setOpen(false); }} className="inline-flex h-8 items-center gap-1 rounded-full border-0 bg-transparent px-3 text-[13px]" style={{ color: t.colors.ink, cursor: 'pointer' }}><CornerUpLeft size={13} aria-hidden />{ts('pg.reply', 'Reply')}</button>
          {mine && m.type === 'text' && <button type="button" onClick={() => { onEdit(m); setOpen(false); }} className="inline-flex h-8 items-center gap-1 rounded-full border-0 bg-transparent px-3 text-[13px]" style={{ color: t.colors.ink, cursor: 'pointer' }}><Pencil size={13} aria-hidden />{ts('addresses.edit', 'Edit')}</button>}
          {mine && <button type="button" onClick={() => { onDelete(m._id); setOpen(false); }} className="inline-flex h-8 items-center gap-1 rounded-full border-0 bg-transparent px-3 text-[13px]" style={{ color: t.colors.danger, cursor: 'pointer' }}><Trash2 size={13} aria-hidden />{ts('addresses.delete', 'Delete')}</button>}
        </div>
      )}
    </div>
  );
}

