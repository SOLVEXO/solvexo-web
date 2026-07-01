import { Loader2 } from 'lucide-react';
import type { Message } from '@/api/commerce/messaging';
import { groupMessages } from './groupMessages';
import { DateDivider } from './DateDivider';
import { MessageBubble } from './MessageBubble';

interface MessageThreadProps {
  messages:      Message[];
  loading:       boolean;
  currentUserId?: string;
  otherPartyId:  string;
  otherPartyName: string;
  otherPartyImage?: string | null;
  hasMore:       boolean;
  onLoadMore:    () => void;
  editingId:     string | null;
  editText:      string;
  onEditTextChange: (v: string) => void;
  onStartEdit:   (m: Message) => void;
  onCancelEdit:  () => void;
  onSaveEdit:    () => void;
  onDelete:      (id: string) => void;
  onReply:       (m: Message) => void;
}

// The scrollable message area: date dividers + grouped bubbles, exactly
// the reading order Instagram/WhatsApp threads use.
export function MessageThread({
  messages, loading, currentUserId, otherPartyId, otherPartyName, otherPartyImage,
  hasMore, onLoadMore, editingId, editText, onEditTextChange, onStartEdit, onCancelEdit, onSaveEdit, onDelete, onReply,
}: MessageThreadProps) {
  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-brand-orange" /></div>;
  }
  if (messages.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-[13px] text-slate">No messages yet — say hello 👋</div>;
  }

  const sections = groupMessages(messages);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
      {hasMore && (
        <div className="flex justify-center mb-3">
          <button onClick={onLoadMore} className="px-3 py-[6px] rounded-full border border-bone bg-white text-[11.5px] text-slate cursor-pointer hover:bg-cream">
            Load older messages
          </button>
        </div>
      )}

      {sections.map(section => (
        <div key={section.dateLabel}>
          <DateDivider label={section.dateLabel} />
          {section.groups.map((group, gi) => {
            const own = group.senderId === currentUserId;
            return (
              <div key={gi} className="flex flex-col gap-[2px] mb-[6px]">
                {group.messages.map((m, mi) => {
                  const isLast = mi === group.messages.length - 1;
                  return (
                    <MessageBubble
                      key={m._id}
                      message={m}
                      own={own}
                      isLastInGroup={isLast}
                      seenByOther={m.seenBy.includes(otherPartyId)}
                      showAvatar={!own && isLast}
                      avatarName={otherPartyName}
                      avatarImage={otherPartyImage}
                      editing={editingId === m._id}
                      editText={editText}
                      onEditTextChange={onEditTextChange}
                      onStartEdit={own ? onStartEdit : undefined}
                      onCancelEdit={onCancelEdit}
                      onSaveEdit={onSaveEdit}
                      onDelete={own ? onDelete : undefined}
                      onReply={onReply}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
