import { useState, useEffect, useCallback } from 'react';
import {
  apiAdminListConversations, apiAdminGetConversationById, apiAdminGetReports,
  type Conversation, type Report, type GetReportsParams, type AdminListConversationsParams,
} from '@/api/commerce/messaging';

export function useAdminConversations(params?: AdminListConversationsParams) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    return apiAdminListConversations(params)
      .then(res => setConversations(res.conversations ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load conversations.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.storeId, params?.buyerId, params?.sellerId, params?.isArchived, params?.page, params?.limit]);

  useEffect(() => { refetch(); }, [refetch]);

  return { conversations, loading, error, refetch };
}

export function useAdminConversationDetail(id: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(() => !!id);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiAdminGetConversationById(id)
      .then(res => { if (!cancelled) setConversation(res); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load conversation.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { conversation, loading, error };
}

export function useAdminReports(params?: GetReportsParams) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    return apiAdminGetReports(params)
      .then(res => setReports(res.reports ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load reports.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.status, params?.targetType, params?.page, params?.limit]);

  useEffect(() => { refetch(); }, [refetch]);

  return { reports, loading, error, refetch };
}
