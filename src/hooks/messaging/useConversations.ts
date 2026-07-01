import { useState, useEffect, useCallback } from 'react';
import {
  apiListConversations, apiSearchConversations, apiStartConversation,
  type Conversation, type ListConversationsParams, type StartConversationPayload,
} from '@/api/commerce/messaging';

export function useConversations(params?: ListConversationsParams) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const storeId = params?.storeId;

  const refetch = useCallback(() => {
    setLoading(true);
    return apiListConversations(storeId ? { storeId } : undefined)
      .then(res => setConversations(res.conversations ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load conversations.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { conversations, loading, error, refetch };
}

export function useSearchConversations() {
  const [results, setResults] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function search(q: string, storeId?: string) {
    setError('');
    setLoading(true);
    try {
      const res = await apiSearchConversations({ q, storeId });
      setResults(res ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
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
