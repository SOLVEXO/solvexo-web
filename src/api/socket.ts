import { io, type Socket } from 'socket.io-client';
import { getAuthCookie } from '@/utils/authCookie';

/** One socket per call — caller owns its lifecycle (connect on mount, disconnect on cleanup). */
export function connectActivityLogSocket(): Socket {
  const token = getAuthCookie('accessToken');
  const base = (import.meta.env.VITE_API_URL as string) ?? '';
  return io(`${base}/activity-log`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}
