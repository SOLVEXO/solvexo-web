import { useState } from 'react';
import { MessageCircle, Search, X } from 'lucide-react';
import type { ActionMenuItem } from '@/components/comman/ui';
import type { Message, SendMessagePayload } from '@/api/services/messaging';
import { useSearchMessages } from '@/hooks/messaging/useMessages';
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

  otherOnline?:    boolean;
  otherTyping?:    boolean;
  onTyping?:       (isTyping: boolean) => void;
  conversationId?: string | null;
}

// The full right-hand pane: header, message thread, composer — the piece
// every role's messaging page mounts once a conversation is selected.
// Reply/edit/compose state lives here since it's pure UI state that
// resets per-conversation and doesn't need to leak into the page.
export function ChatWindow({
  open, headerName, headerImage, headerSubtitle, menuItems, onBack,
  messages, msgLoading, currentUserId, otherPartyId, hasMore, onLoadMore,
  sending, uploading, onSend, onUpload, onEditMessage, onDeleteMessage,
  otherOnline, otherTyping, onTyping, conversationId,
}: ChatWindowProps) {
  const [text,      setText]      = useState('');
  const [replyTo,   setReplyTo]   = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText,  setEditText]  = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const { results, search, loading: searching } = useSearchMessages(conversationId ?? null);

  if (!open) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-3 bg-cream text-center px-8">
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
    onTyping?.(false);
  };

  const handleChangeText = (v: string) => {
    setText(v);
    onTyping?.(v.trim().length > 0);
  };

  const subtitle = otherTyping
    ? 'Typing…'
    : headerSubtitle ?? (otherOnline !== undefined ? (otherOnline ? 'Online' : 'Offline') : undefined);

  const handleSaveEdit = () => {
    if (!editingId || !editText.trim()) return;
    onEditMessage(editingId, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  function handleSearchChange(v: string) {
    setQuery(v);
    if (v.trim().length >= 2) search(v.trim());
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <div className="relative">
        <ChatHeader name={headerName} image={headerImage} subtitle={subtitle} menuItems={menuItems} onBack={onBack} />
        {conversationId && (
          <button onClick={() => setShowSearch(s => !s)} aria-label="Search messages"
            className="absolute right-[52px] top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-cream cursor-pointer bg-transparent border-none text-slate">
            <Search size={16} />
          </button>
        )}
      </div>

      {showSearch && conversationId && (
        <div className="border-b border-[#EEECE4] bg-white px-4 py-[10px]">
          <div className="flex items-center gap-2 bg-cream rounded-full px-3.5 py-2">
            <Search size={14} className="text-slate shrink-0" />
            <input autoFocus value={query} onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search messages…" className="flex-1 bg-transparent border-none outline-none text-[13px] text-charcoal" />
            <button onClick={() => { setShowSearch(false); setQuery(''); }} className="bg-transparent border-none cursor-pointer text-slate shrink-0">
              <X size={13} />
            </button>
          </div>
          {query.trim().length >= 2 && (
            <div className="mt-2 max-h-[200px] overflow-y-auto flex flex-col gap-1.5">
              {searching ? (
                <p className="text-[12px] text-slate px-1">Searching…</p>
              ) : results.length === 0 ? (
                <p className="text-[12px] text-slate px-1">No messages found.</p>
              ) : results.map(m => (
                <div key={m._id} className="text-[12.5px] text-graphite bg-cream rounded-lg px-3 py-2">
                  {m.text}
                  <span className="block text-[10.5px] text-slate mt-0.5">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
        onChange={handleChangeText}
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
