import { useEffect, useRef, useState } from 'react';
import { acquireMessagingSocket, releaseMessagingSocket } from '@/api/messagingSocket';

/**
 * Live online/offline map for a batch of userIds (conversation list rows).
 * Reuses the same `presence:check` / `presence:status` / `presence:{id}`
 * events the thread-level presence already relies on — no new backend work.
 */
export function usePresence(userIds: string[]): Record<string, boolean> {
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const idsKey = userIds.slice().sort().join(',');
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split(',').filter(Boolean);
    if (ids.length === 0) return;

    const socket = acquireMessagingSocket();

    function handleStatus(list: { userId: string; online: boolean }[]) {
      setOnline(prev => {
        const next = { ...prev };
        list.forEach(s => { next[s.userId] = s.online; });
        return next;
      });
    }

    const perUserHandlers: Record<string, (p: { online: boolean }) => void> = {};
    ids.forEach(id => {
      const handler = (p: { online: boolean }) => setOnline(prev => ({ ...prev, [id]: p.online }));
      perUserHandlers[id] = handler;
      socket.on(`presence:${id}`, handler);
      knownIds.current.add(id);
    });

    socket.on('presence:status', handleStatus);
    socket.emit('presence:check', ids);

    return () => {
      ids.forEach(id => socket.off(`presence:${id}`, perUserHandlers[id]));
      socket.off('presence:status', handleStatus);
      releaseMessagingSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return online;
}
