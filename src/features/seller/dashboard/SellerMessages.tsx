import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Pin, PinOff, Bell, BellOff, Archive, ArchiveRestore, Ban, Flag, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useConversations, useSearchConversations } from '@/hooks/messaging/useConversations';
import { useConversation } from '@/hooks/messaging/useConversation';
import { useMessages } from '@/hooks/messaging/useMessages';
import { useModeration } from '@/hooks/messaging/useModeration';
import { apiUploadAttachment, type Conversation } from '@/api/commerce/messaging';
import { ChatList, ChatWindow, type ChatListEntry } from '@/components/comman/messaging';
import type { ActionMenuItem } from '@/components/comman/ui';

function toEntry(c: Conversation): ChatListEntry {
  return {
    id:      c._id,
    name:    c.buyer?.name ?? `Buyer #${c.buyerId.slice(-6).toUpperCase()}`,
    image:   c.buyer?.profileImage,
    preview: c.lastMessage ? (c.lastMessage.type === 'text' ? c.lastMessage.text ?? '' : `📎 ${c.lastMessage.type}`) : 'No messages yet',
    time:    c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    unread:  c.sellerUnread,
    pinned:  c.isPinned,
    muted:   c.isMuted,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerMessages() {
  usePageTitle('Messages');
  const { storeId } = useParams<{ storeId: string }>();
  const { profile } = useGetProfile();

  const { conversations, loading: listLoading, error: listError, refetch: refetchList } =
    useConversations(storeId ? { storeId } : undefined);
  const { results: searchResults, search, loading: searching } = useSearchConversations();
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length >= 2;
  const list = isSearching ? searchResults : conversations;

  const [activeId, setActiveId] = useState<string | null>(null);
  const { conversation, pin, mute, archive, restore, remove } = useConversation(activeId);
  const { messages, loading: msgLoading, sending, send, edit, remove: removeMessage, markSeen, hasMore, loadMore } = useMessages(activeId);
  const { block, unblock, report } = useModeration();

  const [blockedBuyerId, setBlockedBuyerId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const active = conversation ?? list.find(c => c._id === activeId) ?? null;

  // Mark the latest incoming message as seen once the thread is open.
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== profile?._id) void markSeen(last._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, messages.length]);

  const handleSearch = (v: string) => {
    setQuery(v);
    if (v.trim().length >= 2) search(v.trim(), storeId);
  };

  const handleUpload = async (file: File) => {
    if (!activeId) return;
    setUploading(true);
    try {
      const attachment = await apiUploadAttachment(activeId, file);
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
      await send({ type: kind, attachments: [attachment] });
    } finally {
      setUploading(false);
    }
  };

  const handleBlock = () => {
    if (!active) return;
    void block({ targetId: active.buyerId, targetRole: 'user', reason: 'Blocked from seller inbox' }).then(ok => {
      if (ok) setBlockedBuyerId(active.buyerId);
    });
  };
  const handleUnblock = () => {
    if (!blockedBuyerId) return;
    void unblock(blockedBuyerId).then(ok => { if (ok) setBlockedBuyerId(null); });
  };
  const handleReport = () => {
    if (!active) return;
    void report({ targetType: 'conversation', targetId: active._id, reason: 'inappropriate', details: 'Reported from seller inbox' });
  };
  const handleDelete = async () => {
    if (!activeId) return;
    await remove();
    setActiveId(null);
    refetchList();
  };

  const menuItems: ActionMenuItem[] = active ? [
    { label: active.isPinned ? 'Unpin conversation' : 'Pin conversation', icon: active.isPinned ? <PinOff size={14} /> : <Pin size={14} />, onClick: () => void pin(!active.isPinned) },
    { label: active.isMuted  ? 'Unmute notifications' : 'Mute notifications', icon: active.isMuted ? <Bell size={14} /> : <BellOff size={14} />, onClick: () => void mute(!active.isMuted) },
    { label: active.isArchived ? 'Restore chat' : 'Archive chat', icon: active.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />, onClick: () => void (active.isArchived ? restore() : archive()) },
    blockedBuyerId === active.buyerId
      ? { label: 'Unblock buyer', icon: <Ban size={14} />, onClick: handleUnblock }
      : { label: 'Block buyer',   icon: <Ban size={14} />, onClick: handleBlock },
    { label: 'Report conversation', icon: <Flag size={14} />, onClick: handleReport },
    { label: 'Delete chat', icon: <Trash2 size={14} />, onClick: () => void handleDelete(), danger: true },
  ] : [];

  return (
    <>
      <SellerPageHeader
        title="Messages"
        subtitle="Respond to buyer questions and support requests."
        actions={
          <span className="px-3 py-1 bg-[#FDECEA] rounded-[6px] text-xs font-semibold text-[#C0392B]">
            {conversations.reduce((n, c) => n + c.sellerUnread, 0)} Unread
          </span>
        }
      />

      <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 108px)' }}>
        <div className={clsx('md:flex', activeId ? 'hidden' : 'flex')}>
          <ChatList
            title="Chats"
            entries={list.map(toEntry)}
            activeId={activeId}
            onSelect={setActiveId}
            query={query}
            onQueryChange={handleSearch}
            loading={isSearching ? searching : listLoading}
            error={listError}
          />
        </div>

        <ChatWindow
          open={!!active}
          headerName={active ? (active.buyer?.name ?? `Buyer #${active.buyerId.slice(-6).toUpperCase()}`) : ''}
          headerImage={active?.buyer?.profileImage}
          headerSubtitle={active ? (active.isArchived ? 'Archived' : active.isMuted ? 'Muted' : 'Active buyer') : undefined}
          menuItems={menuItems}
          onBack={() => setActiveId(null)}
          messages={messages}
          msgLoading={msgLoading}
          currentUserId={profile?._id}
          otherPartyId={active?.buyerId ?? ''}
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
    </>
  );
}
