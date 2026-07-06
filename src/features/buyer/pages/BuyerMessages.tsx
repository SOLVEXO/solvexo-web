import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Archive, ArchiveRestore, Flag, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useConversations, useSearchConversations } from '@/hooks/messaging/useConversations';
import { useConversation } from '@/hooks/messaging/useConversation';
import { useMessages } from '@/hooks/messaging/useMessages';
import { useModeration } from '@/hooks/messaging/useModeration';
import { apiUploadAttachment, type Conversation } from '@/api/services/messaging';
import { ChatList, ChatWindow, type ChatListEntry } from '@/components/comman/messaging';
import type { ActionMenuItem } from '@/components/comman/ui';

function toEntry(c: Conversation): ChatListEntry {
  return {
    id:      c._id,
    name:    c.store?.name ?? `Store #${c.storeId.slice(-6).toUpperCase()}`,
    image:   c.store?.logo ?? null,
    preview: c.lastMessage
      ? (c.lastMessage.type === 'text' ? c.lastMessage.text ?? '' : `📎 ${c.lastMessage.type}`)
      : 'No messages yet',
    time:    c.lastMessage
      ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    unread:  c.buyerUnread,
    pinned:  c.isPinned,
    muted:   c.isMuted,
  };
}

export function BuyerMessages() {
  usePageTitle('Messages');
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { profile } = useGetProfile();

  const { conversations, loading: listLoading, error: listError, refetch: refetchList } = useConversations();
  const { results: searchResults, search, loading: searching } = useSearchConversations();
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length >= 2;
  const list = isSearching ? searchResults : conversations;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const id = setTimeout(() => search(trimmed), 300);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);

  // If URL has conversationId, auto-open it
  useEffect(() => {
    if (conversationId) setActiveId(conversationId);
  }, [conversationId]);

  const { conversation, archive, restore, remove } = useConversation(activeId);
  const { messages, loading: msgLoading, sending, send, edit, remove: removeMessage, markSeen, hasMore, loadMore } = useMessages(activeId);
  const { report } = useModeration();
  const [uploading, setUploading] = useState(false);

  const active = conversation ?? list.find(c => c._id === activeId) ?? null;

  // Mark latest message as seen
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== profile?._id) void markSeen(last._id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, messages.length]);

  const handleSearch = (v: string) => setQuery(v);

  const handleSelect = (id: string) => {
    setActiveId(id);
    navigate(`/messages/${id}`, { replace: true });
  };

  const handleUpload = async (file: File) => {
    if (!activeId) return;
    setUploading(true);
    try {
      const attachment = await apiUploadAttachment(activeId, file);
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';
      await send({ type: kind, attachments: [attachment] });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeId) return;
    await remove();
    setActiveId(null);
    navigate('/messages', { replace: true });
    refetchList();
  };

  const menuItems: ActionMenuItem[] = active ? [
    {
      label:   active.isArchived ? 'Restore chat' : 'Archive chat',
      icon:    active.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />,
      onClick: () => void (active.isArchived ? restore() : archive()),
    },
    {
      label:   'Report conversation',
      icon:    <Flag size={14} />,
      onClick: () => void report({ targetType: 'conversation', targetId: active._id, reason: 'inappropriate', details: 'Reported from buyer inbox' }),
    },
    {
      label:   'Delete chat',
      icon:    <Trash2 size={14} />,
      onClick: () => void handleDelete(),
      danger:  true,
    },
  ] : [];

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-bone bg-white shrink-0">
        <div>
          <h1 className="text-[17px] font-bold text-carbon">Messages</h1>
          <p className="text-[12px] text-slate mt-[2px]">Your conversations with sellers</p>
        </div>
        <span className="px-3 py-1 bg-brand-pale-orange rounded-[6px] text-xs font-semibold text-brand-deep-orange">
          {conversations.reduce((n, c) => n + c.buyerUnread, 0)} Unread
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat list */}
        <div className={clsx('md:flex', activeId ? 'hidden' : 'flex')}>
          <ChatList
            title="Stores"
            entries={list.map(toEntry)}
            activeId={activeId}
            onSelect={handleSelect}
            query={query}
            onQueryChange={handleSearch}
            loading={isSearching ? searching : listLoading}
            error={listError}
          />
        </div>

        {/* Chat window */}
        <ChatWindow
          open={!!active}
          headerName={active ? (active.store?.name ?? `Store #${active.storeId.slice(-6).toUpperCase()}`) : ''}
          headerImage={active?.store?.logo ?? null}
          headerSubtitle={active ? (active.isArchived ? 'Archived' : active.isMuted ? 'Muted' : 'Active store') : undefined}
          menuItems={menuItems}
          onBack={() => { setActiveId(null); navigate('/messages', { replace: true }); }}
          messages={messages}
          msgLoading={msgLoading}
          currentUserId={profile?._id}
          otherPartyId={active?.sellerId ?? ''}
          hasMore={hasMore}
          onLoadMore={loadMore}
          sending={sending}
          uploading={uploading}
          onSend={payload => void send(payload)}
          onUpload={file => void handleUpload(file)}
          onEditMessage={(id, text) => void edit(id, text)}
          onDeleteMessage={id => void removeMessage(id)}
        />
      </div>
    </div>
  );
}
