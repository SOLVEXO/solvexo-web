import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Ban, Flag, Trash2 } from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useConversations, useSearchConversations, useStartConversation } from '@/hooks/messaging/useConversations';
import { useConversation } from '@/hooks/messaging/useConversation';
import { useMessages } from '@/hooks/messaging/useMessages';
import { useModeration } from '@/hooks/messaging/useModeration';
import { usePresence } from '@/hooks/messaging/usePresence';
import { useRecentSearches } from '@/hooks/messaging/useRecentSearches';
import { apiUploadAttachment, apiDeleteConversation, type Conversation, type MessageType } from '@/api/services/messaging';
import { ChatList, ChatWindow, NewChatModal, type ChatListEntry, type ChatListFilter } from '@/components/comman/messaging';
import { Card, PageHeader, type ActionMenuItem } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';

const TYPE_PREVIEW: Partial<Record<MessageType, string>> = {
  voice: 'Voice note', image: 'Photo', video: 'Video', pdf: 'File', document: 'File', product_share: 'Product shared',
};

// NOTE: buyer role has no archive/pin/mute — those messaging actions are
// seller-only per the API. Buyer can start/search/delete conversations,
// send/edit/delete messages, and block/report a seller.
function toBuyerEntry(c: Conversation, online: Record<string, boolean>, typingIds: Set<string>, menuItems: ActionMenuItem[]): ChatListEntry {
  return {
    id:          c._id,
    name:        c.store?.name ?? `Seller #${c.sellerId?.slice(-6).toUpperCase() ?? '——'}`,
    image:       c.store?.logo,
    preview:     c.lastMessage ? (c.lastMessage.type === 'text' ? (c.lastMessage.text ?? '') : (TYPE_PREVIEW[c.lastMessage.type] ?? 'Message')) : 'No messages yet',
    previewType: c.lastMessage?.type,
    time:        c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    unread:      c.buyerUnread,
    online:      online[c.sellerId],
    verified:    c.store?.badges?.includes('verified'),
    isTyping:    typingIds.has(c._id),
    menuItems,
  };
}

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConversationId = searchParams.get('conversation');

  const toast = useToast();
  const { profile } = useGetProfile();
  const { conversations, loading: listLoading, error: listError, refetch: refetchList, typingIds } = useConversations();
  const { results: searchResults, search, loading: searching } = useSearchConversations();
  const { recent, commit, clear } = useRecentSearches('buyer-inbox');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>(() => (searchParams.get('filter') === 'unread' ? 'unread' : 'all'));

  const isSearching = query.trim().length >= 2;
  const baseList = isSearching ? searchResults : conversations;
  const list = filter === 'unread' ? baseList.filter(c => c.buyerUnread > 0) : baseList;
  const unreadCount = conversations.filter(c => c.buyerUnread > 0).length;

  const filters: ChatListFilter[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
  ];

  const sellerIds = useMemo(() => conversations.map(c => c.sellerId), [conversations]);
  const online = usePresence(sellerIds);

  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const { conversation } = useConversation(activeId);
  const active = conversation ?? list.find(c => c._id === activeId) ?? conversations.find(c => c._id === activeId) ?? null;

  useEffect(() => {
    if (initialConversationId) setActiveId(initialConversationId);
  }, [initialConversationId]);

  // Keep the open conversation + filter tab reflected in the URL so a
  // refresh/share/back-button reproduces the same view — same convention
  // used across the other buyer pages.
  useEffect(() => {
    const next = new URLSearchParams();
    if (activeId) next.set('conversation', activeId);
    if (filter === 'unread') next.set('filter', filter);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, filter]);

  const {
    messages, loading: msgLoading, loadingMore, sending, send, retry, edit, remove, markSeen, hasMore, loadMore,
    otherOnline, otherTyping, sendTyping, error: msgError,
  } = useMessages(activeId);
  const { block, unblock, report } = useModeration();
  const { execute: startConversation, loading: startingConversation } = useStartConversation();

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [blockedSellerId, setBlockedSellerId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  // Mark the conversation as seen once it's open — driven by the
  // CONVERSATION's own unread counter/lastMessage pointer, not by "who sent
  // the last loaded message". That second approach silently broke the
  // moment the buyer had already replied at some point: the last message
  // in the thread was then the buyer's own, so the old check always
  // skipped calling markSeen — even though earlier seller messages before
  // that reply had genuinely never been marked seen, leaving the unread
  // badge permanently stuck (confirmed against real data on the seller side
  // of this same bug).
  //
  // Guarded on `conversation?._id === activeId` specifically (not just
  // `active`, which can briefly fall back to a stale `list`/`conversations`
  // entry right after switching threads) — same fix applied to the seller's
  // inbox, kept consistent here.
  useEffect(() => {
    if (!activeId || !conversation || conversation._id !== activeId) return;
    const lastMessageId = conversation.lastMessage?.messageId;
    if ((conversation.buyerUnread ?? 0) > 0 && lastMessageId) {
      // Don't rely solely on the 'conversation:update' socket echo to clear
      // this conversation's unread badge — refetch directly so it's correct
      // even if that event was missed (e.g. a socket reconnect gap).
      void markSeen(lastMessageId).catch(() => {}).then(refetchList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, conversation?._id, conversation?.buyerUnread, conversation?.lastMessage?.messageId]);

  const handleSearch = (v: string) => {
    setQuery(v);
    if (v.trim().length >= 2) search(v.trim());
  };

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
    void block({ targetId: active.sellerId, targetRole: 'seller', reason: 'Blocked from buyer inbox' }).then(ok => {
      if (ok) { setBlockedSellerId(active.sellerId); toast.success('Seller blocked'); }
      else toast.error('Failed to block seller');
    });
  };
  const handleUnblock = () => {
    if (!blockedSellerId) return;
    void unblock(blockedSellerId).then(ok => {
      if (ok) { setBlockedSellerId(null); toast.success('Seller unblocked'); }
      else toast.error('Failed to unblock seller');
    });
  };
  const handleReport = () => {
    if (!active) return;
    void report({ targetType: 'conversation', targetId: active._id, reason: 'inappropriate', details: 'Reported from buyer inbox' }).then(ok => {
      toast[ok ? 'success' : 'error'](ok ? 'Conversation reported' : 'Failed to report conversation');
    });
  };
  const handleStartNewChat = async (storeId: string) => {
    if (!storeId) return;
    const conv = await startConversation({ storeId });
    if (conv) {
      setShowNewChat(false);
      refetchList();
      setActiveId(conv._id);
    } else {
      toast.error('Failed to start conversation — check the store ID and try again.');
    }
  };

  const handleDelete = async () => {
    if (!active) return;
    try {
      await apiDeleteConversation(active._id);
      setActiveId(null);
      refetchList();
      toast.success('Chat deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete chat');
    }
  };

  const menuItems: ActionMenuItem[] = active ? [
    blockedSellerId === active.sellerId
      ? { label: 'Unblock seller', icon: <Ban size={14} />, onClick: handleUnblock }
      : { label: 'Block seller',   icon: <Ban size={14} />, onClick: handleBlock },
    { label: 'Report conversation', icon: <Flag size={14} />, onClick: handleReport },
    { label: 'Delete chat', icon: <Trash2 size={14} />, onClick: () => void handleDelete(), danger: true },
  ] : [];

  // Same actions as the open-chat header menu above, but reachable straight
  // from a list row's own dropdown arrow (WhatsApp-style) without opening
  // that conversation first — hits the API by that row's own id directly
  // instead of going through the `active`-scoped handlers above.
  const buildRowMenu = (c: Conversation): ActionMenuItem[] => [
    blockedSellerId === c.sellerId
      ? { label: 'Unblock seller', icon: <Ban size={14} />, onClick: () => void unblock(c.sellerId).then(ok => { if (ok) { setBlockedSellerId(null); toast.success('Seller unblocked'); } else toast.error('Failed to unblock seller'); }) }
      : { label: 'Block seller', icon: <Ban size={14} />, onClick: () => void block({ targetId: c.sellerId, targetRole: 'seller', reason: 'Blocked from buyer inbox' }).then(ok => { if (ok) { setBlockedSellerId(c.sellerId); toast.success('Seller blocked'); } else toast.error('Failed to block seller'); }) },
    {
      label: 'Report conversation',
      icon: <Flag size={14} />,
      onClick: () => void report({ targetType: 'conversation', targetId: c._id, reason: 'inappropriate', details: 'Reported from buyer inbox' }).then(ok => {
        toast[ok ? 'success' : 'error'](ok ? 'Conversation reported' : 'Failed to report conversation');
      }),
    },
    {
      label: 'Delete chat',
      icon: <Trash2 size={14} />,
      onClick: () => {
        void apiDeleteConversation(c._id).then(() => {
          if (activeId === c._id) setActiveId(null);
          refetchList();
          toast.success('Chat deleted');
        }).catch(err => toast.error(err instanceof Error ? err.message : 'Failed to delete chat'));
      },
      danger: true,
    },
  ];

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Desktop only — on mobile, AccountLayout's own top bar already shows
         "Messages" with a back arrow, and ChatList below has its own title
         too, so this would be a third repeat of the same word on one screen. */}
      <div className="hidden lg:block">
        <PageHeader eyebrow="Account" title="Messages" description="Chat with sellers about your orders and questions." />
      </div>
      <Card padding="none" className="flex-1 min-h-0 min-h-[560px] -mx-4 rounded-none border-x-0 lg:mx-0 lg:rounded-xl lg:border-x">
        <div className="flex overflow-hidden h-full">
          {/* This wrapper had no width of its own — a plain flex item with
             no flex-grow shrinks to content, so ChatList's `w-full` below
             was resolving against an undefined/shrunk parent instead of
             the actual screen width. `w-full` here (mobile) fixes that;
             `md:w-auto md:shrink-0` lets ChatList's own fixed/resizable
             width (`md:w-[var(--list-w)]`) take over at the two-pane
             breakpoint instead of stretching further than that. */}
          <div className={clsx(activeId ? 'hidden md:flex' : 'flex', 'w-full md:w-auto md:shrink-0')}>
            <ChatList
              title="Messages"
              entries={list.map(c => toBuyerEntry(c, online, typingIds, buildRowMenu(c)))}
              activeId={activeId}
              onSelect={setActiveId}
              onNew={() => setShowNewChat(true)}
              query={query}
              onQueryChange={handleSearch}
              loading={isSearching ? searching : listLoading}
              error={listError}
              filters={filters}
              activeFilter={filter}
              onFilterChange={id => setFilter(id as 'all' | 'unread')}
              recentSearches={recent}
              onSelectRecentSearch={q => { setQuery(q); handleSearch(q); }}
              onClearRecentSearches={clear}
              onCommitSearch={commit}
              resizeStorageKey="solvexo:buyer-inbox-width"
            />
          </div>

          <ChatWindow
            open={!!active}
            headerName={active ? (active.store?.name ?? `Seller #${active.sellerId?.slice(-6).toUpperCase() ?? '——'}`) : ''}
            headerImage={active?.store?.logo}
            headerVerified={active?.store?.badges?.includes('verified')}
            menuItems={menuItems}
            onBack={() => setActiveId(null)}
            messages={messages}
            msgLoading={msgLoading}
            loadingMore={loadingMore}
            currentUserId={profile?._id}
            otherPartyId={active?.sellerId ?? ''}
            hasMore={hasMore}
            onLoadMore={loadMore}
            sending={sending}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onSend={payload => void send(payload)}
            onUpload={file => void handleUpload(file)}
            onFileTooLarge={handleFileTooLarge}
            onEditMessage={(id, text) => void edit(id, text)}
            onDeleteMessage={id => void remove(id)}
            onRetry={(m, payload) => m._tempId && retry(m._tempId, payload)}
            otherOnline={otherOnline}
            otherTyping={otherTyping}
            onTyping={sendTyping}
            conversationId={activeId}
            storeId={active?.storeId}
            error={msgError}
          />
        </div>
      </Card>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onStart={handleStartNewChat}
          starting={startingConversation}
        />
      )}
    </div>
  );
}
