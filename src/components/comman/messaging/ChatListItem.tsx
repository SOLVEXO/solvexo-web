import { clsx } from 'clsx';
import { Pin, BellOff, Archive, ChevronDown, Image as ImageIcon, Video as VideoIcon, Mic, FileText, ShoppingBag, Check, CheckCheck } from 'lucide-react';
import type { MessageType } from '@/api/services/messaging';
import { ActionMenu, type ActionMenuItem } from '@/components/comman/ui';
import { ChatAvatar } from './ChatAvatar';

interface ChatListItemProps {
  name:        string;
  image?:      string | null;
  preview:     string;
  previewType?: MessageType;
  own?:        boolean;
  seen?:       boolean;
  time:        string;
  unread:      number;
  pinned?:     boolean;
  muted?:      boolean;
  archived?:   boolean;
  online?:     boolean;
  verified?:   boolean;
  isTyping?:   boolean;
  /** Pin/mute/archive/block/report/delete etc. — the exact same actions
   *  available from inside the open chat's header menu, just reachable
   *  straight from the list row (WhatsApp-style) without opening it first. */
  menuItems?:  ActionMenuItem[];
  active:      boolean;
  onClick:     () => void;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-hidden>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-[3.5px] h-[3.5px] rounded-full bg-brand-orange animate-bounce"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: '900ms' }}
        />
      ))}
    </span>
  );
}

const TYPE_ICON: Partial<Record<MessageType, typeof ImageIcon>> = {
  image: ImageIcon, video: VideoIcon, voice: Mic, pdf: FileText, document: FileText, product_share: ShoppingBag,
};

// A single row in the chat list — bold name/preview while unread, avatar
// with a live presence dot / verified badge, pin/mute/archive indicators,
// and a small orange unread pill — the same information hierarchy
// WhatsApp/Instagram/Telegram lists use.
//
// The row itself is a real <button> (native click/keyboard activation), and
// the row-actions dropdown trigger is a SIBLING positioned on top of it, not
// a descendant — a <button> can't legally contain another <button>, and this
// also means clicking the arrow never bubbles into the row's own onClick.
export function ChatListItem({
  name, image, preview, previewType, own, seen, time, unread, pinned, muted, archived, online, verified, isTyping, menuItems, active, onClick,
}: ChatListItemProps) {
  const hasUnread = unread > 0;
  const TypeIcon = previewType ? TYPE_ICON[previewType] : undefined;

  return (
    <div className={clsx('group relative w-full', active ? 'bg-brand-pale-orange' : 'bg-transparent hover:bg-cream')}>
      <button
        onClick={onClick}
        aria-current={active ? 'true' : undefined}
        className={clsx(
          'w-full flex items-center gap-[11px] px-[14px] py-[10px] text-left cursor-pointer border-none bg-transparent transition-colors duration-150 outline-none',
          'focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-inset',
          menuItems?.length && 'pr-[34px]',
        )}
      >
        <ChatAvatar name={name} image={image} size={50} online={online} verified={verified} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={clsx(
              'flex items-center gap-[4px] text-[14px] truncate',
              hasUnread ? 'font-bold text-charcoal' : 'font-medium text-charcoal',
            )}>
              {pinned && <Pin size={11} className="text-brand-orange shrink-0 fill-brand-orange" />}
              <span className="truncate">{name}</span>
              {archived && <Archive size={11} className="text-slate shrink-0" />}
            </span>
            <span className={clsx('text-[11px] shrink-0', hasUnread ? 'text-brand-orange font-semibold' : 'text-slate')}>{time}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-[2px]">
            <span className={clsx('flex items-center gap-[4px] text-[12.5px] truncate flex-1', isTyping ? 'text-brand-orange font-medium italic' : hasUnread ? 'text-charcoal font-medium' : 'text-slate')}>
              {isTyping ? (
                <>
                  <span className="truncate">typing</span>
                  <TypingDots />
                </>
              ) : (
                <>
                  {muted && <BellOff size={11} className="shrink-0 text-slate" />}
                  {own && (seen
                    ? <CheckCheck size={13} className="shrink-0 text-[#4fa8e8]" />
                    : <Check size={13} className="shrink-0 text-slate" />
                  )}
                  {TypeIcon && <TypeIcon size={12} className="shrink-0 text-slate" />}
                  <span className="truncate">{preview}</span>
                </>
              )}
            </span>
            {hasUnread && (
              <span className="shrink-0 min-w-[19px] h-[19px] px-1 rounded-full bg-brand-orange text-white text-[10.5px] font-bold flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </button>

      {!!menuItems?.length && (
        <div className="absolute right-[8px] top-1/2 -translate-y-1/2">
          <ActionMenu
            items={menuItems}
            align="right"
            ariaLabel={`Options for ${name}`}
            trigger={<ChevronDown size={15} />}
            triggerClassName="w-7 h-7 rounded-full flex items-center justify-center border-none bg-transparent text-slate hover:bg-bone hover:text-charcoal cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
          />
        </div>
      )}
    </div>
  );
}
