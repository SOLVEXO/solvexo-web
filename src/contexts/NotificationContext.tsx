import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { TokenStorage } from '@/api/services/auth';
import {
  apiListNotifications,
  apiGetUnreadCount,
  apiGetPreferences,
  apiUpdatePreferences,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiDeleteNotification,
  type NotificationItem,
  type NotificationPreferenceData,
  type NotificationPreferenceFlags,
} from '@/api/services/notifications';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount:   number;
  /** @deprecated use notificationsLoading */
  loading:       boolean;
  notificationsLoading: boolean;
  preferences:   NotificationPreferenceData | null;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead:    (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (dto: Partial<NotificationPreferenceFlags> & { pushEnabled?: boolean; emailEnabled?: boolean }) => Promise<void>;
  toast:         NotificationItem | null;
  clearToast:    () => void;
  /**
   * The store currently "in view" — set by the store dashboard (see
   * `useNotificationStoreScope`), null everywhere else (cross-store seller
   * pages, the public website). While set, every read here (list/unread
   * count/mark-all-read) is scoped to just that store's own notifications
   * instead of the seller's full cross-store inbox.
   */
  activeStoreId: string | null;
  setActiveStoreId: (storeId: string | null) => void;
}

const NotificationCtx = createContext<NotificationContextValue | null>(null);

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationCtx);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
}

/**
 * Scopes the shared notification bell/inbox to one store for as long as the
 * calling component is mounted — call once, near the top of a store
 * workspace (e.g. `StoreWorkspaceProvider`). Automatically un-scopes back to
 * the account-wide view (every store) on unmount, so leaving the store's
 * dashboard restores the normal cross-store bell everywhere else in the app
 * (the seller-wide `/seller/*` pages, the public website's profile dropdown).
 */
export function useNotificationStoreScope(storeId: string | null): void {
  const { setActiveStoreId } = useNotification();
  useEffect(() => {
    setActiveStoreId(storeId || null);
    return () => setActiveStoreId(null);
  }, [storeId, setActiveStoreId]);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [preferences,   setPreferences]   = useState<NotificationPreferenceData | null>(null);
  const [toast,         setToast]         = useState<NotificationItem | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  // Read inside socket callbacks (registered once, on mount) without making
  // the socket effect below re-run/reconnect on every store switch.
  const activeStoreIdRef = useRef<string | null>(null);
  activeStoreIdRef.current = activeStoreId;

  const clearToast = useCallback(() => setToast(null), []);

  const fetchUnreadCount = useCallback(async (storeId?: string | null) => {
    if (!TokenStorage.isLoggedIn()) return;
    try {
      const res = await apiGetUnreadCount(storeId ?? undefined);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // Ignore count fetch errors
    }
  }, []);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (!TokenStorage.isLoggedIn()) return;
    setNotificationsLoading(true);
    try {
      const res = await apiListNotifications({ unreadOnly, limit: 50, storeId: activeStoreId ?? undefined });
      setNotifications(res.data?.items ?? []);
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch {
      // Ignore list fetch errors
    } finally {
      setNotificationsLoading(false);
    }
  }, [activeStoreId]);

  const fetchPreferences = useCallback(async () => {
    if (!TokenStorage.isLoggedIn()) return;
    try {
      const res = await apiGetPreferences();
      setPreferences(res.data);
    } catch {
      // Ignore preferences fetch errors
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications(prev =>
        prev.map(item => item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore errors
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllNotificationsRead(activeStoreId ?? undefined);
      // Scoped to the active store — only mark that store's items as read
      // locally too, so a background cross-store item doesn't get silently
      // marked read by an action taken while viewing a different store.
      setNotifications(prev =>
        prev.map(item => (!activeStoreId || item.storeId === activeStoreId)
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item)
      );
      if (activeStoreId) {
        await fetchUnreadCount(activeStoreId);
      } else {
        setUnreadCount(0);
      }
    } catch {
      // Ignore errors
    }
  }, [activeStoreId, fetchUnreadCount]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiDeleteNotification(id);
      setNotifications(prev => {
        const item = prev.find(i => i._id === id);
        if (item && !item.isRead) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(i => i._id !== id);
      });
    } catch {
      // Ignore errors
    }
  }, []);

  const updatePrefs = useCallback(async (dto: Partial<NotificationPreferenceFlags> & { pushEnabled?: boolean; emailEnabled?: boolean }) => {
    let snapshot: NotificationPreferenceData | null = null;

    setPreferences(prev => {
      snapshot = prev;
      if (!prev) return prev;

      const next: NotificationPreferenceData = {
        ...prev,
        prefs: { ...prev.prefs },
      };

      if (dto.pushEnabled !== undefined) next.pushEnabled = dto.pushEnabled;
      if (dto.emailEnabled !== undefined) next.emailEnabled = dto.emailEnabled;

      (['orders', 'messages', 'promotions', 'loyalty', 'subscriptions'] as const).forEach(key => {
        if (dto[key] !== undefined) next.prefs[key] = dto[key]!;
      });

      return next;
    });

    try {
      const res = await apiUpdatePreferences(dto);
      setPreferences(res.data);
    } catch (err) {
      if (snapshot) setPreferences(snapshot);
      throw err;
    }
  }, []);

  // Fetch initial stats when logged in, and again whenever the active store
  // scope changes (e.g. the seller switches stores via the dashboard's store
  // switcher, or navigates into/out of a store's own workspace).
  useEffect(() => {
    if (TokenStorage.isLoggedIn()) {
      fetchUnreadCount(activeStoreId);
      fetchPreferences();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
    }
  }, [fetchUnreadCount, fetchPreferences, activeStoreId]);

  // Real-time Sockets
  useEffect(() => {
    if (!TokenStorage.isLoggedIn()) return;

    const token = TokenStorage.getToken();
    const base = (import.meta.env.VITE_API_URL as string) ?? '';
    const socket = io(`${base}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to notifications socket');
    });

    socket.on('notification:unread-count', (data: { unreadCount: number }) => {
      // This push is always the recipient's account-wide total across every
      // store — only trust it while unscoped. While a store scope is active,
      // `notification:new` below increments the scoped count locally instead.
      if (!activeStoreIdRef.current) setUnreadCount(data.unreadCount);
    });

    socket.on('notification:new', (notification: NotificationItem) => {
      const scope = activeStoreIdRef.current;
      if (scope && notification.storeId !== scope) return;
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      setToast(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <NotificationCtx.Provider
      value={{
        notifications,
        unreadCount,
        loading: notificationsLoading,
        notificationsLoading,
        preferences,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchPreferences,
        updatePreferences: updatePrefs,
        toast,
        clearToast,
        activeStoreId,
        setActiveStoreId,
      }}
    >
      {children}
    </NotificationCtx.Provider>
  );
}
