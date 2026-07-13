import { useState, useEffect, useCallback, useRef } from 'react';
import {
  apiListConversations, apiSearchConversations, apiStartConversation,
  type Conversation, type ListConversationsParams, type StartConversationPayload,
} from '@/api/services/messaging';
import { acquireMessagingSocket, releaseMessagingSocket } from '@/api/messagingSocket';

export function useConversations(params?: ListConversationsParams) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const requestId = useRef(0);

  const storeId = params?.storeId;

  const refetch = useCallback(() => {
    const thisRequest = ++requestId.current;
    setLoading(true);
    return apiListConversations(storeId ? { storeId } : undefined)
      .then(res => { if (requestId.current === thisRequest) setConversations(res.conversations ?? []); })
      .catch((err: unknown) => { if (requestId.current === thisRequest) setError(err instanceof Error ? err.message : 'Failed to load conversations.'); })
      .finally(() => { if (requestId.current === thisRequest) setLoading(false); });
  }, [storeId]);

  useEffect(() => { refetch(); }, [refetch]);

  // Instant inbox updates: new message / read state bumps the conversation to
  // the top with fresh unread + lastMessage, no manual refresh needed.
  useEffect(() => {
    const socket = acquireMessagingSocket();

    function handleUpdate(updated: Conversation) {
      if (storeId && updated.storeId !== storeId) return;
      setConversations(prev => {
        const rest = prev.filter(c => c._id !== updated._id);
        return [{ ...prev.find(c => c._id === updated._id), ...updated }, ...rest];
      });
    }

    socket.on('conversation:update', handleUpdate);
    return () => {
      socket.off('conversation:update', handleUpdate);
      releaseMessagingSocket();
    };
  }, [storeId]);

  return { conversations, loading, error, refetch };
}

export function useSearchConversations() {
  const [results, setResults] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const requestId = useRef(0);

  async function search(q: string, storeId?: string) {
    const thisRequest = ++requestId.current;
    setError('');
    setLoading(true);
    try {
      const res = await apiSearchConversations({ q, storeId });
      if (requestId.current === thisRequest) setResults(res ?? []);
    } catch (err) {
      if (requestId.current === thisRequest) setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      if (requestId.current === thisRequest) setLoading(false);
    }
  }

  return { results, search, loading, error };
}

export function useStartConversation() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(payload: StartConversationPayload): Promise<Conversation | null> {
    setError('');
    setLoading(true);
    try {
      return await apiStartConversation(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
