import { useState, useEffect, useCallback } from 'react';
import {
  apiGetConversationById, apiArchiveConversation, apiRestoreConversation,
  apiPinConversation, apiMuteConversation, apiDeleteConversation,
  type Conversation,
} from '@/api/commerce/messaging';

export function useConversation(id: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(() => !!id);
  const [error,   setError]   = useState('');
  const [acting,  setActing]  = useState(false);

  const refetch = useCallback(() => {
    if (!id) return Promise.resolve();
    setLoading(true);
    return apiGetConversationById(id)
      .then(res => setConversation(res))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load conversation.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  async function runAction<T>(action: () => Promise<T>) {
    setActing(true);
    setError('');
    try {
      await action();
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActing(false);
    }
  }

  const archive = () => id ? runAction(() => apiArchiveConversation(id)) : Promise.resolve();
  const restore = () => id ? runAction(() => apiRestoreConversation(id)) : Promise.resolve();
  const pin     = (pin: boolean = true)  => id ? runAction(() => apiPinConversation(id, pin))   : Promise.resolve();
  const mute    = (mute: boolean = true) => id ? runAction(() => apiMuteConversation(id, mute)) : Promise.resolve();
  const remove  = () => id ? apiDeleteConversation(id) : Promise.resolve(undefined);

  return { conversation, loading, error, acting, refetch, archive, restore, pin, mute, remove };
}
