import { useState, useEffect, useCallback, useRef } from 'react';
import {
  apiGetConversationById, apiArchiveConversation, apiRestoreConversation,
  apiPinConversation, apiMuteConversation, apiDeleteConversation,
  type Conversation,
} from '@/api/services/messaging';
import { acquireMessagingSocket, releaseMessagingSocket } from '@/api/messagingSocket';

export function useConversation(id: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(() => !!id);
  const [error,   setError]   = useState('');
  const [acting,  setActing]  = useState(false);
  const requestId = useRef(0);

  const refetch = useCallback(() => {
    if (!id) return Promise.resolve();
    const thisRequest = ++requestId.current;
    setLoading(true);
    return apiGetConversationById(id)
      .then(res => { if (requestId.current === thisRequest) setConversation(res); })
      .catch((err: unknown) => { if (requestId.current === thisRequest) setError(err instanceof Error ? err.message : 'Failed to load conversation.'); })
      .finally(() => { if (requestId.current === thisRequest) setLoading(false); });
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  // Join the conversation room so read receipts / unread resets / archive-pin-mute
  // done from another tab or the other participant reflect here instantly.
  useEffect(() => {
    if (!id) return;
    const socket = acquireMessagingSocket();

    function handleUpdate(updated: Conversation) {
      if (updated._id === id) setConversation(prev => prev ? { ...prev, ...updated } : updated);
    }

    socket.emit('join-conversation', id);
    socket.on('conversation:update', handleUpdate);
    return () => {
      socket.emit('leave-conversation', id);
      socket.off('conversation:update', handleUpdate);
      releaseMessagingSocket();
    };
  }, [id]);

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
