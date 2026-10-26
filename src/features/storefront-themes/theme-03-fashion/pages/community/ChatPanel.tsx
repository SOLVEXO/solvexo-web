import { Fragment, useEffect, useRef, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Loader2, MessageCircle, Store as StoreIcon } from 'lucide-react';
import { apiUploadAttachment, type Conversation, type Message } from '@/api/services/messaging';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useMessages, type OptimisticMessage } from '@/hooks/messaging/useMessages';
import { fashionTheme as t } from '../../theme.config';
import { Notice } from '../../ui/primitives';
import { ChatBubble } from './ChatBubble';
import { ChatComposer } from './ChatComposer';
import { ProductSharePicker } from './ProductSharePicker';
import { attachmentKind, dayLabel, formatBytes, MAX_UPLOAD_BYTES, retryPayload, sameDay } from '../../../core/community/communityFormat';

interface Props { conversation: Conversation; storeId: string; storeName: string; storeLogo?: string | null }

/** Live buyer <-> store thread: history, realtime messages, typing + presence, attachments, replies, edits, reactions. */
export function ChatPanel({ conversation, storeId, storeName, storeLogo }: Props) {
  const { profile } = useGetProfile();
  const myId = profile?._id;
  const chat = useMessages(conversation._id);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState('');
  const [sharing, setSharing] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const isMine = (m: OptimisticMessage) => !!m._tempId || (myId ? m.senderId === myId : m.senderRole === 'user');
  const last = chat.messages[chat.messages.length - 1];
  const lastId = last?._id;
  const lastIncoming = [...chat.messages].reverse().find(m => !isMine(m) && !m._pending);
  const lastIncomingId = lastIncoming?._id;

  // Keep the newest message in view (only when it changes, so "load earlier" does not jump the scroll).
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId, chat.loading]);

  // Tell the store its messages were read, including ones that arrive while this page is open.
  const markSeenRef = useRef(chat.markSeen);
  useEffect(() => { markSeenRef.current = chat.markSeen; });
  useEffect(() => {
    if (lastIncomingId) void markSeenRef.current(lastIncomingId).catch(() => {});
  }, [lastIncomingId]);

  const sendText = (text: string) => {
    if (editing) {
      const id = editing._id;
      setEditing(null);
      chat.edit(id, text).catch(() => setNotice(ts('pg.we_could_not_save_your_edit_please_try', 'We could not save your edit. Please try again.')));
      return;
    }
    const payload = { type: 'text' as const, text, ...(replyTo ? { replyTo: { messageId: replyTo._id, text: replyTo.text, type: replyTo.type, senderId: replyTo.senderId, senderRole: replyTo.senderRole } } : {}) };
    setReplyTo(null);
    void chat.send(payload);
  };

  const upload = async (file: File) => {
    setNotice('');
    setUploading(true);
    setProgress(0);
    try {
      const attachment = await apiUploadAttachment(conversation._id, file, setProgress);
      await chat.send({ type: attachmentKind(file), attachments: [attachment] });
    } catch (err) {
      setNotice(err instanceof Error && err.message ? err.message : ts('pg.the_file_could_not_be_uploaded', 'The file could not be uploaded.'));
    } finally { setUploading(false); }
  };

  const subtitle = chat.otherTyping ? ts('pg.word_typing', 'typing...') : chat.otherOnline ? ts('pg.word_online', 'Online') : ts('pg.we_reply_as_soon_as_we_can', 'We reply as soon as we can');

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'min(700px, calc(100dvh - 230px))', minHeight: 440, border: `1px solid ${t.colors.border}`, borderRadius: 24, background: t.colors.bg }}>
      <header className="flex shrink-0 items-center gap-3 p-4" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
        <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full" style={{ background: t.colors.bgAlt }}>
          {storeLogo ? <img src={storeLogo} alt="" className="size-full object-contain p-1" /> : <StoreIcon size={20} aria-hidden />}
          {chat.otherOnline && <span aria-hidden className="absolute bottom-0 right-0 size-3 rounded-full" style={{ background: t.colors.success, border: `2px solid ${t.colors.bg}` }} />}
        </span>
        <div className="min-w-0">
          <h2 className="m-0 truncate text-base font-semibold">{storeName}</h2>
          <p className="m-0 text-[13px]" style={{ color: t.colors.inkMuted }} aria-live="polite">{subtitle}</p>
        </div>
      </header>

      {(chat.error || notice) && (
        <div className="shrink-0 px-4 pt-3">
          <Notice tone="error" action={chat.error ? <button type="button" onClick={() => void chat.refetch()} className="border-0 bg-transparent p-0 text-sm font-semibold underline" style={{ color: t.colors.ink, cursor: 'pointer' }}>{ts('cart.retry', 'Retry')}</button> : undefined}>{notice || chat.error}</Notice>
        </div>
      )}

      <div ref={scroller} role="log" aria-live="polite" aria-label={ts('pg.conversation_with_store', 'Conversation with {{store}}', { store: storeName })} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {chat.hasMore && (
          <button type="button" onClick={() => void chat.loadMore()} disabled={chat.loadingMore} className="mx-auto inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium" style={{ background: t.colors.bgAlt, border: 'none', color: t.colors.ink, cursor: 'pointer' }}>
            {chat.loadingMore && <Loader2 size={14} className="animate-spin" aria-hidden />}{ts('pg.load_earlier_messages', 'Load earlier messages')}
          </button>
        )}
        {chat.loading && chat.messages.length === 0 ? (
          <div role="status" aria-label={ts('pg.loading_messages', 'Loading messages')} className="flex flex-col gap-3">
            {[60, 40, 70].map((w, i) => <div key={i} className="animate-pulse" style={{ width: `${w}%`, height: 48, borderRadius: 20, background: t.colors.bgAlt, alignSelf: i === 1 ? 'flex-end' : 'flex-start' }} />)}
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="m-auto grid place-items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-full" style={{ background: t.colors.bgAlt }}><MessageCircle size={24} aria-hidden /></span>
            <p className="m-0 text-lg font-semibold">{ts('pg.say_hello_to_store', 'Say hello to {{store}}', { store: storeName })}</p>
            <p className="m-0 max-w-[320px] text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.ask_about_a_product_an_order_or', 'Ask about a product, an order or anything else. You can attach photos and files too.')}</p>
          </div>
        ) : chat.messages.map((m, i) => {
          const prev = chat.messages[i - 1];
          return (
            <Fragment key={m._id}>
              {(!prev || !sameDay(prev.createdAt, m.createdAt)) && <p className="m-0 my-1 text-center text-xs font-medium" style={{ color: t.colors.inkMuted }}>{dayLabel(m.createdAt)}</p>}
              <ChatBubble message={m} mine={isMine(m)} myId={myId} storeName={storeName} onReply={setReplyTo} onEdit={msg => { setEditing(msg); setReplyTo(null); }}
                onDelete={id => { chat.remove(id).catch(() => setNotice(ts('pg.we_could_not_delete_that_message', 'We could not delete that message.'))); }} onRetry={msg => { const payload = retryPayload(msg); if (payload && msg._tempId) void chat.retry(msg._tempId, payload); }}
                onReact={(id, emoji) => void chat.react(id, emoji, myId ?? null)} />
            </Fragment>
          );
        })}
      </div>

      <ChatComposer key={editing?._id ?? 'new'} initialText={editing?.text ?? ''} editing={!!editing} replyTo={replyTo} sending={chat.sending} uploading={uploading} uploadProgress={progress}
        onSubmit={sendText} onAttach={file => void upload(file)} onShareProduct={() => setSharing(true)} onTyping={chat.sendTyping}
        onCancelReply={() => setReplyTo(null)} onCancelEdit={() => setEditing(null)}
        onFileTooLarge={file => setNotice(ts('pg.name_is_too_large_the_limit_is_size', '"{{name}}" is too large. The limit is {{size}}.', { name: file.name, size: formatBytes(MAX_UPLOAD_BYTES) }))} />

      {sharing && <ProductSharePicker storeId={storeId} onClose={() => setSharing(false)} onPick={id => { setSharing(false); void chat.send({ type: 'product_share', productShare: { productId: id } }); }} />}
    </div>
  );
}

