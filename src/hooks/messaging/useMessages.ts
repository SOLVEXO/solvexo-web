import { useState, useEffect, useCallback, useRef } from 'react';
import {
  apiGetMessages, apiSendMessage, apiSearchMessages, apiEditMessage,
  apiDeleteMessage, apiMarkMessageSeen,
  type Message, type SendMessagePayload,
} from '@/api/services/messaging';
import { acquireMessagingSocket, releaseMessagingSocket, getMessagingSocket } from '@/api/messagingSocket';

export type OptimisticMessage = Message & { _tempId?: string; _pending?: boolean; _failed?: boolean };

const TYPING_IDLE_MS = 3000;

export function useMessages(conversationId: string | null) {
  const [messages,   setMessages]   = useState<OptimisticMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore,    setHasMore]    = useState(false);
  const [loading,    setLoading]    = useState(() => !!conversationId);
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState('');
  const [otherUserId,  setOtherUserId]  = useState<string | null>(null);
  const [otherOnline,  setOtherOnline]  = useState(false);
  const [otherTyping,  setOtherTyping]  = useState(false);
  const requestId = useRef(0);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(() => {
    if (!conversationId) return Promise.resolve();
    const thisRequest = ++requestId.current;
    setLoading(true);
    return apiGetMessages(conversationId)
      .then(res => {
        if (requestId.current !== thisRequest) return;
        setMessages(res.messages ?? []);
        setNextCursor(res.nextCursor ?? null);
        setHasMore(res.hasMore ?? false);
      })
      .catch((err: unknown) => { if (requestId.current === thisRequest) setError(err instanceof Error ? err.message : 'Failed to load messages.'); })
      .finally(() => { if (requestId.current === thisRequest) setLoading(false); });
  }, [conversationId]);

  useEffect(() => { refetch(); }, [refetch]);

  // Realtime: join the thread room, sync new/edited/deleted messages, typing, presence.
  useEffect(() => {
    if (!conversationId) return;
    const socket = acquireMessagingSocket();
    setOtherOnline(false);
    setOtherTyping(false);

    function handleJoined(info: { conversationId: string; otherUserId: string; otherOnline: boolean }) {
      if (info.conversationId !== conversationId) return;
      setOtherUserId(info.otherUserId);
      setOtherOnline(info.otherOnline);
    }

    // Emitted by the gateway when `join-conversation` is rejected (e.g. no
    // longer a participant — removed mid-session, or a stale deep link).
    // Previously had no listener at all, so this failed completely silently:
    // no messaging:joined ever arrived, but nothing told the user why.
    function handleMessagingError(message: string) {
      setError(message || 'You no longer have access to this conversation.');
    }

    function handleNew(message: Message) {
      if (message.conversationId !== conversationId) return;
      setMessages(prev => prev.some(m => m._id === message._id) ? prev : [...prev, message]);
    }

    function handleEdited(message: Message) {
      if (message.conversationId !== conversationId) return;
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
    }

    function handleDeleted({ messageId }: { messageId: string }) {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, text: null } : m));
    }

    function handleTyping(body: { conversationId: string; userId: string; isTyping: boolean }) {
      if (body.conversationId !== conversationId) return;
      setOtherTyping(body.isTyping);
    }

    // Live read-receipt sync: the other participant just marked messages as
    // seen up to lastMessageId — flip our checkmarks without a refetch.
    function handleSeen(body: { conversationId: string; userId: string; lastMessageId: string }) {
      if (body.conversationId !== conversationId) return;
      setMessages(prev => prev.map(m => {
        if (m._id > body.lastMessageId) return m;
        if (m.seenBy.some(s => s.userId === body.userId)) return m;
        return { ...m, status: 'seen', seenBy: [...m.seenBy, { userId: body.userId, seenAt: new Date().toISOString() }] };
      }));
    }

    socket.emit('join-conversation', conversationId);
    socket.on('messaging:joined', handleJoined);
    socket.on('messaging:error', handleMessagingError);
    socket.on('message:new', handleNew);
    socket.on('message:edited', handleEdited);
    socket.on('message:deleted', handleDeleted);
    socket.on('typing', handleTyping);
    socket.on('message:seen', handleSeen);

    return () => {
      socket.emit('leave-conversation', conversationId);
      socket.off('messaging:joined', handleJoined);
      socket.off('messaging:error', handleMessagingError);
      socket.off('message:new', handleNew);
      socket.off('message:edited', handleEdited);
      socket.off('message:deleted', handleDeleted);
      socket.off('typing', handleTyping);
      socket.off('message:seen', handleSeen);
      releaseMessagingSocket();
    };
  }, [conversationId]);

  // Subscribe to the other participant's presence once known.
  useEffect(() => {
    if (!otherUserId) return;
    const socket = acquireMessagingSocket();
    function handlePresence(p: { online: boolean }) { setOtherOnline(p.online); }
    socket.on(`presence:${otherUserId}`, handlePresence);
    socket.emit('presence:check', [otherUserId]);
    function handleStatus(list: { userId: string; online: boolean }[]) {
      const found = list.find(s => s.userId === otherUserId);
      if (found) setOtherOnline(found.online);
    }
    socket.on('presence:status', handleStatus);
    return () => {
      socket.off(`presence:${otherUserId}`, handlePresence);
      socket.off('presence:status', handleStatus);
      releaseMessagingSocket();
    };
  }, [otherUserId]);

  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMore() {
    if (!conversationId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await apiGetMessages(conversationId, { before: nextCursor });
      // Older page arrives oldest-first for itself, but it's older than
      // everything currently in `messages` — prepend, don't append.
      setMessages(prev => [...(res.messages ?? []), ...prev]);
      setNextCursor(res.nextCursor ?? null);
      setHasMore(res.hasMore ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function send(payload: SendMessagePayload, tempIdOverride?: string): Promise<Message | null> {
    if (!conversationId) return null;
    setError('');
    setSending(true);

    const tempId = tempIdOverride ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (!tempIdOverride) {
      const optimistic: OptimisticMessage = {
        _id: tempId,
        _tempId: tempId,
        _pending: true,
        conversationId,
        senderId: '',
        senderRole: 'user',
        type: payload.type,
        text: 'text' in payload ? payload.text : null,
        attachments: 'attachments' in payload ? payload.attachments : [],
        productShare: null,
        replyTo: payload.replyTo ?? null,
        status: 'sent',
        seenBy: [],
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        isFlagged: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
    } else {
      // Retrying a previously failed message — clear the failed flag, keep its place.
      setMessages(prev => prev.map(m => m._tempId === tempId ? { ...m, _pending: true, _failed: false } : m));
    }

    try {
      const res = await apiSendMessage(conversationId, payload);
      setMessages(prev => {
        // The server echoes 'message:new' back to the sender's own socket too,
        // so the real doc may already be in the list by the time this resolves —
        // replace the optimistic entry, then dedupe by real _id either way.
        const replaced = prev.map(m => m._tempId === tempId ? res : m);
        const seen = new Set<string>();
        return replaced.filter(m => (seen.has(m._id) ? false : (seen.add(m._id), true)));
      });
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
      setMessages(prev => prev.map(m => m._tempId === tempId ? { ...m, _pending: false, _failed: true } : m));
      return null;
    } finally {
      setSending(false);
    }
  }

  // Re-attempt a failed optimistic send, reusing its temp id so it stays in place.
  function retry(tempId: string, payload: SendMessagePayload) {
    return send(payload, tempId);
  }

  async function edit(messageId: string, text: string) {
    const res = await apiEditMessage(messageId, { text });
    setMessages(prev => prev.map(m => m._id === messageId ? res : m));
    return res;
  }

  async function remove(messageId: string) {
    setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, text: null } : m));
    await apiDeleteMessage(messageId);
  }

  async function markSeen(messageId: string) {
    if (!conversationId) return;
    await apiMarkMessageSeen(messageId, conversationId);
  }

  function sendTyping(isTyping: boolean) {
    if (!conversationId) return;
    getMessagingSocket()?.emit('typing', { conversationId, isTyping });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (isTyping) {
      typingTimeout.current = setTimeout(() => {
        getMessagingSocket()?.emit('typing', { conversationId, isTyping: false });
      }, TYPING_IDLE_MS);
    }
  }

  return {
    messages, loading, sending, error, hasMore, loadingMore, refetch, loadMore, send, retry, edit, remove, markSeen,
    otherOnline, otherTyping, sendTyping,
  };
}

export function useSearchMessages(conversationId: string | null) {
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const requestId = useRef(0);

  async function search(q: string) {
    if (!conversationId) return;
    const thisRequest = ++requestId.current;
    setError('');
    setLoading(true);
    try {
      const res = await apiSearchMessages(conversationId, { q });
      if (requestId.current === thisRequest) setResults(res ?? []);
    } catch (err) {
      if (requestId.current === thisRequest) setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      if (requestId.current === thisRequest) setLoading(false);
    }
  }

  return { results, search, loading, error };
}
