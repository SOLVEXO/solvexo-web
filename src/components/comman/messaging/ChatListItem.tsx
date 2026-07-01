import { clsx } from 'clsx';
import { Pin, BellOff } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';

interface ChatListItemProps {
  name:      string;
  image?:    string | null;
  preview:   string;
  time:      string;
  unread:    number;
  pinned?:   boolean;
  muted?:    boolean;
  active:    boolean;
  onClick:   () => void;
}

// A single row in the chat list — bold name/preview while unread, a
// pinned icon before the name, a muted bell, and a small orange unread
// pill on the right, same information hierarchy WhatsApp/Instagram use.
export function ChatListItem({ name, image, preview, time, unread, pinned, muted, active, onClick }: ChatListItemProps) {
  const hasUnread = unread > 0;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-[11px] px-[14px] py-[10px] text-left cursor-pointer border-none transition-colors',
        active ? 'bg-brand-pale-orange' : 'bg-transparent hover:bg-[#FAF9F5]',
      )}
    >
      <ChatAvatar name={name} image={image} size={48} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={clsx(
            'flex items-center gap-[4px] text-[14px] truncate',
            hasUnread ? 'font-bold text-charcoal' : 'font-medium text-charcoal',
          )}>
            {pinned && <Pin size={11} className="text-brand-orange shrink-0" />}
            {name}
          </span>
          <span className={clsx('text-[11px] shrink-0', hasUnread ? 'text-brand-orange font-semibold' : 'text-slate')}>{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-[2px]">
          <span className={clsx('text-[12.5px] truncate flex-1', hasUnread ? 'text-charcoal font-medium' : 'text-slate')}>
            {muted && <BellOff size={11} className="inline mr-1 -mt-[1px] text-slate" />}
            {preview}
          </span>
          {hasUnread && (
            <span className="shrink-0 min-w-[19px] h-[19px] px-1 rounded-full bg-brand-orange text-white text-[10.5px] font-bold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
