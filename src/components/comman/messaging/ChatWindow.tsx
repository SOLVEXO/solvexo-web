import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import type { ActionMenuItem } from '@/components/comman/ui';
import type { Message, SendMessagePayload } from '@/api/commerce/messaging';
import { ChatHeader } from './ChatHeader';
import { MessageThread } from './MessageThread';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  open:            boolean;
  headerName:      string;
  headerImage?:    string | null;
  headerSubtitle?: string;
  menuItems:       ActionMenuItem[];
  onBack?:         () => void;

  messages:        Message[];
  msgLoading:      boolean;
  currentUserId?:  string;
  otherPartyId:    string;
  hasMore:         boolean;
  onLoadMore:      () => void;

  sending:         boolean;
  uploading:       boolean;
  onSend:          (payload: SendMessagePayload) => void;
  onUpload:        (file: File) => void;
  onEditMessage:   (id: string, text: string) => void;
  onDeleteMessage: (id: string) => void;
}

// The full right-hand pane: header, message thread, composer — the piece
// every role's messaging page mounts once a conversation is selected.
// Reply/edit/compose state lives here since it's pure UI state that
// resets per-conversation and doesn't need to leak into the page.
export function ChatWindow({
  open, headerName, headerImage, headerSubtitle, menuItems, onBack,
  messages, msgLoading, currentUserId, otherPartyId, hasMore, onLoadMore,
  sending, uploading, onSend, onUpload, onEditMessage, onDeleteMessage,
}: ChatWindowProps) {
  const [text,      setText]      = useState('');
  const [replyTo,   setReplyTo]   = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText,  setEditText]  = useState('');

  if (!open) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-3 bg-[#FAF9F5] text-center px-8">
        <div className="w-16 h-16 rounded-full bg-brand-pale-orange flex items-center justify-center">
          <MessageCircle size={28} className="text-brand-orange" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-charcoal">Your messages</p>
          <p className="text-[13px] text-slate mt-1">Select a conversation to start chatting.</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!text.trim()) return;
    onSend({ type: 'text', text: text.trim(), ...(replyTo ? { replyTo: { messageId: replyTo._id, text: replyTo.text, type: replyTo.type, senderId: replyTo.senderId, senderRole: replyTo.senderRole } } : {}) });
    setText('');
    setReplyTo(null);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editText.trim()) return;
    onEditMessage(editingId, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <ChatHeader name={headerName} image={headerImage} subtitle={headerSubtitle} menuItems={menuItems} onBack={onBack} />

      <MessageThread
        messages={messages}
        loading={msgLoading}
        currentUserId={currentUserId}
        otherPartyId={otherPartyId}
        otherPartyName={headerName}
        otherPartyImage={headerImage}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        editingId={editingId}
        editText={editText}
        onEditTextChange={setEditText}
        onStartEdit={m => { setEditingId(m._id); setEditText(m.text ?? ''); }}
        onCancelEdit={() => { setEditingId(null); setEditText(''); }}
        onSaveEdit={handleSaveEdit}
        onDelete={onDeleteMessage}
        onReply={setReplyTo}
      />

      <MessageInput
        value={text}
        onChange={setText}
        onSend={handleSend}
        onFileSelect={onUpload}
        uploading={uploading}
        sending={sending}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
