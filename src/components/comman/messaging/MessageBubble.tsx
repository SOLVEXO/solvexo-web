import { clsx } from 'clsx';
import { Check, CheckCheck, Paperclip, Pencil, Trash2, Reply as ReplyIcon, FileText, Video as VideoIcon } from 'lucide-react';
import type { Message } from '@/api/commerce/messaging';
import { ChatAvatar } from './ChatAvatar';

interface MessageBubbleProps {
  message:      Message;
  own:          boolean;
  isLastInGroup: boolean;
  seenByOther:  boolean;
  avatarName?:  string;
  avatarImage?: string | null;
  showAvatar:   boolean;
  editing:      boolean;
  editText:     string;
  onEditTextChange: (v: string) => void;
  onStartEdit?: (m: Message) => void;
  onCancelEdit?: () => void;
  onSaveEdit?:  () => void;
  onDelete?:    (id: string) => void;
  onReply?:     (m: Message) => void;
}

// One WhatsApp/Instagram-style chat bubble. Own messages sit on the right
// in the brand color, the other party's sit on the left in a light bubble.
// The "tail" corner (the one nearest the sender) loses its rounding only
// on the last bubble of a consecutive group, matching how both apps
// collapse a burst of messages into one visual block.
export function MessageBubble({
  message, own, isLastInGroup, seenByOther, avatarName, avatarImage, showAvatar,
  editing, editText, onEditTextChange, onStartEdit, onCancelEdit, onSaveEdit, onDelete, onReply,
}: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const bubbleRadius = own
    ? isLastInGroup ? 'rounded-2xl rounded-br-[4px]' : 'rounded-2xl'
    : isLastInGroup ? 'rounded-2xl rounded-bl-[4px]' : 'rounded-2xl';

  if (message.isDeleted) {
    return (
      <div className={clsx('flex w-full mb-[2px]', own ? 'justify-end' : 'justify-start')}>
        <div className={clsx('px-4 py-2 text-[13px] italic text-slate bg-[#F0EEE6] rounded-2xl')}>
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('group flex w-full items-end gap-[8px] mb-[2px]', own ? 'justify-end' : 'justify-start')}>
      {/* left-side avatar gutter for the other party */}
      {!own && (
        <div className="w-7 shrink-0 self-end">
          {showAvatar && <ChatAvatar name={avatarName ?? '?'} image={avatarImage} size={26} />}
        </div>
      )}

      {/* hover actions for own text messages */}
      {own && message.type === 'text' && !editing && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-[2px] transition-opacity self-center">
          {onReply && (
            <button onClick={() => onReply(message)} className="p-[5px] rounded-full text-slate hover:bg-bone cursor-pointer bg-transparent border-none">
              <ReplyIcon size={13} />
            </button>
          )}
          {onStartEdit && (
            <button onClick={() => onStartEdit(message)} className="p-[5px] rounded-full text-slate hover:bg-bone cursor-pointer bg-transparent border-none">
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(message._id)} className="p-[5px] rounded-full text-error hover:bg-error-bg cursor-pointer bg-transparent border-none">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      <div className={clsx('flex flex-col max-w-[72%] sm:max-w-[420px]', own ? 'items-end' : 'items-start')}>
        {editing ? (
          <div className="w-[260px] flex flex-col gap-1">
            <textarea
              value={editText}
              onChange={e => onEditTextChange(e.target.value)}
              rows={2}
              autoFocus
              className="border border-bone rounded-[14px] px-3 py-2 text-[13px] outline-none bg-white resize-none"
            />
            <div className="flex gap-3 justify-end px-1">
              <button onClick={onCancelEdit} className="text-[11px] text-slate cursor-pointer bg-transparent border-none">Cancel</button>
              <button onClick={onSaveEdit} className="text-[11px] text-brand-orange font-semibold cursor-pointer bg-transparent border-none">Save</button>
            </div>
          </div>
        ) : (
          <div
            className={clsx(
              'px-[14px] py-[9px] shadow-[0_1px_1px_rgba(0,0,0,0.06)]',
              bubbleRadius,
              own ? 'bg-brand-orange text-white' : 'bg-white text-charcoal border border-[#EEECE4]',
            )}
          >
            {message.replyTo && (
              <div className={clsx(
                'mb-[6px] px-[10px] py-[6px] rounded-[10px] border-l-[3px] text-[12px] opacity-90',
                own ? 'bg-white/15 border-white' : 'bg-cream border-brand-orange',
              )}>
                <p className="line-clamp-2">{message.replyTo.text ?? `[${message.replyTo.type}]`}</p>
              </div>
            )}

            {message.type === 'text' && (
              <p className="text-[14px] leading-[1.45] whitespace-pre-wrap break-words">
                {message.text}
                {message.isEdited && <span className={clsx('text-[10px] ml-1', own ? 'text-white/70' : 'text-slate')}>(edited)</span>}
              </p>
            )}

            {message.type === 'product_share' && (
              <div className="flex items-center gap-[10px] min-w-[180px]">
                {message.productShare?.image ? (
                  <img src={message.productShare.image} alt="" className="w-11 h-11 rounded-[10px] object-cover shrink-0" />
                ) : (
                  <div className={clsx('w-11 h-11 rounded-[10px] shrink-0 flex items-center justify-center', own ? 'bg-white/15' : 'bg-cream')}>
                    <Paperclip size={16} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold truncate">{message.productShare?.title ?? `Product #${message.productShare?.productId.slice(-6)}`}</p>
                  {message.productShare?.price != null && (
                    <p className={clsx('text-[12px]', own ? 'text-white/85' : 'text-slate')}>${message.productShare.price}</p>
                  )}
                </div>
              </div>
            )}

            {message.type === 'image' && (
              <div className="flex flex-col gap-1">
                {(message.attachments ?? []).filter(Boolean).map(a => (
                  <a key={a.url} href={a.url} target="_blank" rel="noreferrer">
                    <img src={a.url} alt={a.fileName} className="rounded-[12px] max-w-[240px] max-h-[240px] object-cover" />
                  </a>
                ))}
              </div>
            )}

            {(message.type === 'file' || message.type === 'video') && (
              <div className="flex flex-col gap-1">
                {(message.attachments ?? []).filter(Boolean).map(a => (
                  <a key={a.url} href={a.url} target="_blank" rel="noreferrer"
                    className={clsx('flex items-center gap-2 text-[13px] underline', own ? 'text-white' : 'text-charcoal')}>
                    {message.type === 'video' ? <VideoIcon size={14} /> : <FileText size={14} />}
                    {a.fileName}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={clsx('flex items-center gap-[3px] mt-[3px] px-1', own ? 'flex-row' : 'flex-row-reverse')}>
          <span className="text-[10.5px] text-slate">{time}</span>
          {own && (seenByOther ? <CheckCheck size={13} className="text-[#4FA8E8]" /> : <Check size={13} className="text-slate" />)}
        </div>
      </div>
    </div>
  );
}
