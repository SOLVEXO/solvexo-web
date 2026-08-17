import { useEffect, useRef, useState } from 'react';
import { connectActivityLogSocket } from '@/api/socket';
import type { ActivityLogEntry } from '@/api/services/activityLog';

/** Joins the store's room and calls onEvent for every new activity log entry. */
export function useActivityLogLive(storeId: string, onEvent: (entry: ActivityLogEntry) => void) {
  const [live, setLive] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!storeId) return;
    const socket = connectActivityLogSocket();

    socket.on('connect', () => socket.emit('join-store', storeId));
    socket.on('activity:joined', () => setLive(true));
    socket.on('activity:error', () => setLive(false));
    socket.on('disconnect', () => setLive(false));
    socket.on('activity:new', (entry: ActivityLogEntry) => onEventRef.current(entry));

    return () => { socket.disconnect(); setLive(false); };
  }, [storeId]);

  return live;
}
