import { useState, useEffect, useCallback, useRef } from 'react';
import {
  apiGetMessages, apiSendMessage, apiSearchMessages, apiEditMessage,
  apiDeleteMessage, apiMarkMessageSeen,
  type Message, type SendMessagePayload,
} from '@/api/services/messaging';

export function useMessages(conversationId: string | null) {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore,    setHasMore]    = useState(false);
  const [loading,    setLoading]    = useState(() => !!conversationId);
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState('');
  const requestId = useRef(0);

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

  async function loadMore() {
    if (!conversationId || !nextCursor) return;
    try {
      const res = await apiGetMessages(conversationId, { cursor: nextCursor });
      setMessages(prev => [...prev, ...(res.messages ?? [])]);
      setNextCursor(res.nextCursor ?? null);
      setHasMore(res.hasMore ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages.');
    }
  }

  async function send(payload: SendMessagePayload): Promise<Message | null> {
    if (!conversationId) return null;
    setError('');
    setSending(true);
    try {
      const res = await apiSendMessage(conversationId, payload);
      setMessages(prev => [...prev, res]);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
      return null;
    } finally {
      setSending(false);
    }
  }

  async function edit(messageId: string, text: string) {
    const res = await apiEditMessage(messageId, { text });
    setMessages(prev => prev.map(m => m._id === messageId ? res : m));
    return res;
  }

  async function remove(messageId: string) {
    await apiDeleteMessage(messageId);
    setMessages(prev => prev.filter(m => m._id !== messageId));
  }

  async function markSeen(messageId: string) {
    if (!conversationId) return;
    await apiMarkMessageSeen(messageId, conversationId);
  }

  return { messages, loading, sending, error, hasMore, refetch, loadMore, send, edit, remove, markSeen };
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
