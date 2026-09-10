import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pin, PinOff, Bell, BellOff, Archive, ArchiveRestore, Ban, Flag, Trash2, Package } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useConversations, useSearchConversations } from '@/hooks/messaging/useConversations';
import { useConversation } from '@/hooks/messaging/useConversation';
import { useMessages } from '@/hooks/messaging/useMessages';
import { useModeration } from '@/hooks/messaging/useModeration';
import { usePresence } from '@/hooks/messaging/usePresence';
import { useRecentSearches } from '@/hooks/messaging/useRecentSearches';
import {
  apiUploadAttachment, apiPinConversation, apiMuteConversation, apiArchiveConversation,
  apiRestoreConversation, apiDeleteConversation, type Conversation, type MessageType,
} from '@/api/services/messaging';
import { ChatList, ChatWindow, type ChatListEntry, type ChatListFilter } from '@/components/comman/messaging';
import type { ActionMenuItem } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';

const TYPE_PREVIEW: Partial<Record<MessageType, string>> = {
  voice: 'Voice note', image: 'Photo', video: 'Video', pdf: 'File', document: 'File', product_share: 'Product shared',
};

type FilterId = 'all' | 'unread' | 'pinned' | 'archived';

function toEntry(c: Conversation, online: Record<string, boolean>, typingIds: Set<string>, menuItems: ActionMenuItem[]): ChatListEntry {
  return {
    id:          c._id,
    name:        c.buyer?.name ?? `Buyer #${c.buyerId?.slice(-6).toUpperCase() ?? '——'}`,
    image:       c.buyer?.profileImage,
    preview:     c.lastMessage ? (c.lastMessage.type === 'text' ? (c.lastMessage.text ?? '') : (TYPE_PREVIEW[c.lastMessage.type] ?? 'Message')) : 'No messages yet',
    previewType: c.lastMessage?.type,
    time:        c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    unread:      c.sellerUnread,
    pinned:      c.isPinned,
    muted:       c.isMuted,
    archived:    c.isArchived,
    online:      online[c.buyerId],
    isTyping:    typingIds.has(c._id),
    menuItems,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerMessages() {
  usePageTitle('Messages');
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { profile } = useGetProfile();
  const toast = useToast();

  const [filter, setFilter] = useState<FilterId>('all');
  // "All" hides archived (matches WhatsApp/Telegram convention); "Archived" shows only those.
  const { conversations, loading: listLoading, error: listError, refetch: refetchList, typingIds } =
    useConversations(storeId ? { storeId, isArchived: filter === 'archived' } : undefined);
  const { results: searchResults, search, loading: searching } = useSearchConversations();
  const { recent, commit, clear } = useRecentSearches(`seller-inbox:${storeId ?? ''}`);
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length >= 2;
  const baseList = isSearching ? searchResults : conversations;
  const list = filter === 'unread' ? baseList.filter(c => c.sellerUnread > 0)
    : filter === 'pinned' ? baseList.filter(c => c.isPinned)
    : baseList;

  const unreadCount = conversations.filter(c => c.sellerUnread > 0).length;
  const pinnedCount = conversations.filter(c => c.isPinned).length;
  const filters: ChatListFilter[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'pinned', label: 'Pinned', count: pinnedCount },
    { id: 'archived', label: 'Archived' },
  ];

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const id = setTimeout(() => search(trimmed, storeId), 300);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, storeId]);

  const buyerIds = useMemo(() => conversations.map(c => c.buyerId), [conversations]);
  const online = usePresence(buyerIds);

  const [activeId, setActiveId] = useState<string | null>(null);
  const { conversation, pin, mute, archive, restore, remove } = useConversation(activeId);
  const {
    messages, loading: msgLoading, loadingMore, sending, send, retry, edit, remove: removeMessage, markSeen, hasMore, loadMore,
    otherOnline, otherTyping, sendTyping, error: msgError,
  } = useMessages(activeId);
  const { block, unblock, report } = useModeration();

  const [blockedBuyerId, setBlockedBuyerId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);

  const active = conversation ?? list.find(c => c._id === activeId) ?? null;

  // Mark the conversation as seen once it's open — driven by the
  // CONVERSATION's own unread counter/lastMessage pointer, not by "who sent
  // the last loaded message". That second approach silently broke the
  // moment the seller had already replied at some point: the last message
  // in the thread was then the seller's own, so the old check always
  // skipped calling markSeen — even though earlier buyer messages before
  // that reply had genuinely never been marked seen, leaving the unread
  // badge permanently stuck (confirmed against real data: sellerUnread > 0
  // with weeks-old messages still seenBy: []).
  //
  // Guarded on `conversation?._id === activeId` specifically (not just
  // `active`, which can briefly fall back to a stale `list` entry or a
  // previous conversation's still-cached data right after switching threads)
  // — using a lastMessageId that doesn't actually belong to the conversation
  // the request claims is a real, confirmed way for this call to silently
  // 400 server-side.
  useEffect(() => {
    if (!activeId || !conversation || conversation._id !== activeId) return;
    const lastMessageId = conversation.lastMessage?.messageId;
    if ((conversation.sellerUnread ?? 0) > 0 && lastMessageId) {
      // Don't rely solely on the 'conversation:update' socket echo to clear
      // this conversation's unread badge — refetch directly so it's correct
      // even if that event was missed (e.g. a socket reconnect gap).
      void markSeen(lastMessageId)
        .catch((err: unknown) => {
          // TEMPORARY diagnostic — surfaced visibly instead of swallowed,
          // specifically to pin down why this call isn't taking effect.
          toast.error('markSeen failed: ' + (err instanceof Error ? err.message : String(err)));
        })
        .then(refetchList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, conversation?._id, conversation?.sellerUnread, conversation?.lastMessage?.messageId]);

  const handleSearch = (v: string) => setQuery(v);

  const handleUpload = async (file: File) => {
    if (!activeId) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const attachment = await apiUploadAttachment(activeId, file, setUploadProgress);
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'voice' : file.type === 'application/pdf' ? 'pdf' : 'document';
      await send({ type: kind, attachments: [attachment] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload attachment.');
    } finally {
      setUploading(false);
      setUploadProgress(undefined);
    }
  };

  const handleFileTooLarge = (file: File, maxSizeBytes: number) => {
    toast.error(`"${file.name}" is too large — the limit is ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
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

  // Same actions as the open-chat header menu below, but reachable straight
  // from a list row's own dropdown arrow (WhatsApp-style) without opening
  // that conversation first — so these hit the API directly by that row's
  // own id rather than going through the `activeId`-scoped useConversation
  // hook, then just refetch the list to reflect the result.
  const buildRowMenu = (c: Conversation): ActionMenuItem[] => [
    {
      label: c.isPinned ? 'Unpin conversation' : 'Pin conversation',
      icon: c.isPinned ? <PinOff size={14} /> : <Pin size={14} />,
      onClick: () => void apiPinConversation(c._id, !c.isPinned).then(refetchList),
    },
    {
      label: c.isMuted ? 'Unmute notifications' : 'Mute notifications',
      icon: c.isMuted ? <Bell size={14} /> : <BellOff size={14} />,
      onClick: () => void apiMuteConversation(c._id, !c.isMuted).then(refetchList),
    },
    {
      label: c.isArchived ? 'Restore chat' : 'Archive chat',
      icon: c.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />,
      onClick: () => void (c.isArchived ? apiRestoreConversation(c._id) : apiArchiveConversation(c._id)).then(refetchList),
    },
    blockedBuyerId === c.buyerId
      ? { label: 'Unblock buyer', icon: <Ban size={14} />, onClick: () => void unblock(c.buyerId).then(ok => { if (ok) setBlockedBuyerId(null); }) }
      : { label: 'Block buyer', icon: <Ban size={14} />, onClick: () => void block({ targetId: c.buyerId, targetRole: 'user', reason: 'Blocked from seller inbox' }).then(ok => { if (ok) setBlockedBuyerId(c.buyerId); }) },
    {
      label: 'Report conversation',
      icon: <Flag size={14} />,
      onClick: () => void report({ targetType: 'conversation', targetId: c._id, reason: 'inappropriate', details: 'Reported from seller inbox' }),
    },
    {
      label: 'Delete chat',
      icon: <Trash2 size={14} />,
      onClick: () => void apiDeleteConversation(c._id).then(() => {
        if (activeId === c._id) setActiveId(null);
        refetchList();
      }),
      danger: true,
    },
  ];

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
    <div className="flex flex-col h-full">
      <SellerPageHeader
        title="Messages"
        subtitle="Respond to buyer questions and support requests."
        actions={
          <span className="px-3 py-1 bg-[#fdecea] rounded-[6px] text-xs font-semibold text-[#c0392b]">
            {conversations.reduce((n, c) => n + c.sellerUnread, 0)} Unread
          </span>
        }
      />

      {/* flex-1 + min-h-0 fills whatever space is actually left under the
          header instead of guessing its pixel height with a calc(100vh - Npx)
          — that guess was off from the header's real rendered height and
          left a blank gap under the whole chat panel, including under the
          composer at the very bottom. */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className={activeId ? 'hidden md:flex md:w-auto md:shrink-0' : 'flex w-full md:w-auto md:shrink-0'}>
          <ChatList
            title="Chats"
            entries={list.map(c => toEntry(c, online, typingIds, buildRowMenu(c)))}
            activeId={activeId}
            onSelect={setActiveId}
            query={query}
            onQueryChange={handleSearch}
            loading={isSearching ? searching : listLoading}
            error={listError}
            filters={filters}
            activeFilter={filter}
            onFilterChange={id => setFilter(id as FilterId)}
            recentSearches={recent}
            onSelectRecentSearch={q => { setQuery(q); }}
            onClearRecentSearches={clear}
            onCommitSearch={commit}
            resizeStorageKey="solvexo:seller-inbox-width"
          />
        </div>

        <ChatWindow
          open={!!active}
          headerName={active ? (active.buyer?.name ?? `Buyer #${active.buyerId?.slice(-6).toUpperCase() ?? '——'}`) : ''}
          headerImage={active?.buyer?.profileImage}
          subtitleOverride={active ? (active.isArchived ? 'Archived' : active.isMuted ? 'Muted' : undefined) : undefined}
          menuItems={menuItems}
          onBack={() => setActiveId(null)}
          shortcuts={storeId ? [{ icon: <Package size={17} />, label: 'View Orders', onClick: () => navigate(`/store/${storeId}/orders`) }] : []}
          messages={messages}
          msgLoading={msgLoading}
          loadingMore={loadingMore}
          currentUserId={profile?._id}
          otherPartyId={active?.buyerId ?? ''}
          hasMore={hasMore}
          onLoadMore={loadMore}
          sending={sending}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onSend={payload => void send(payload)}
          onUpload={file => void handleUpload(file)}
          onFileTooLarge={handleFileTooLarge}
          onEditMessage={(id, text) => void edit(id, text)}
          onDeleteMessage={id => void removeMessage(id)}
          onRetry={(m, payload) => m._tempId && retry(m._tempId, payload)}
          otherOnline={otherOnline}
          otherTyping={otherTyping}
          onTyping={sendTyping}
          conversationId={activeId}
          storeId={storeId}
          error={msgError}
        />
      </div>
    </div>
  );
}
