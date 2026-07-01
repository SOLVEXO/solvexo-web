import { useState, useEffect, useCallback } from 'react';
import {
  apiGetMessages, apiSendMessage, apiSearchMessages, apiEditMessage,
  apiDeleteMessage, apiMarkMessageSeen,
  type Message, type SendMessagePayload,
} from '@/api/commerce/messaging';

export function useMessages(conversationId: string | null) {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore,    setHasMore]    = useState(false);
  const [loading,    setLoading]    = useState(() => !!conversationId);
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState('');

  const refetch = useCallback(() => {
    if (!conversationId) return Promise.resolve();
    setLoading(true);
    return apiGetMessages(conversationId)
      .then(res => { setMessages(res.messages ?? []); setNextCursor(res.nextCursor ?? null); setHasMore(res.hasMore ?? false); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load messages.'))
      .finally(() => setLoading(false));
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

  async function search(q: string) {
    if (!conversationId) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiSearchMessages(conversationId, { q });
      setResults(res ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  return { results, search, loading, error };
}
