import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotification } from '@/contexts/NotificationContext';
import { apiGetStoreBadges, type StoreBadgeCounts } from '@/api/services/storeBadges';

/** Sidebar item id -> the unread notification types it counts (new orders: "new since you last looked"). */
const BADGE_TYPES: Record<string, string[]> = {
  orders: ['order_placed'],
};

// ── Server counts (returns, disputes, payment proofs, messages, contact messages, reviews) ──
// One small shared store so the sidebar, the mobile bar and the group headers read the same numbers
// from a single request.
const serverCounts = new Map<string, StoreBadgeCounts>();
const listeners = new Set<() => void>();
const EMPTY: StoreBadgeCounts = {};
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

const lastFetch = new Map<string, number>();
const MIN_GAP_MS = 15_000;

/** `force` skips the 15 s spacing (used by the timer); page changes and notifications are spaced so browsing stays cheap. */
async function refreshServerCounts(storeId: string, force = false) {
  const now = Date.now();
  if (!force && now - (lastFetch.get(storeId) ?? 0) < MIN_GAP_MS) return;
  lastFetch.set(storeId, now);
  try {
    const res = await apiGetStoreBadges(storeId);
    const next = res.data ?? {};
    if (JSON.stringify(serverCounts.get(storeId) ?? {}) !== JSON.stringify(next)) {
      serverCounts.set(storeId, next);
      emit();
    }
  } catch {
    /* badges are a convenience: keep the last numbers */
  }
}

/** Keeps the server counts fresh: on entering the store, on every page change, when a notification arrives, every minute, and when the tab is shown again. */
export function useRefreshServerBadges(storeId: string): void {
  const { pathname } = useLocation();
  const { notifications } = useNotification();
  const newest = notifications[0]?._id ?? '';
  useEffect(() => {
    if (!storeId) return;
    void refreshServerCounts(storeId);
  }, [storeId, pathname, newest]);
  useEffect(() => {
    if (!storeId) return;
    const tick = () => { if (document.visibilityState === 'visible') void refreshServerCounts(storeId, true); };
    const id = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [storeId]);
}

/** Counts per sidebar item id for one store: new orders from notifications, the rest from the server. */
export function useNavBadgeCounts(storeId: string): Record<string, number> {
  const { notifications } = useNotification();
  const server = useSyncExternalStore(subscribe, () => serverCounts.get(storeId) ?? EMPTY, () => EMPTY);
  return useMemo(() => {
    const counts: Record<string, number> = { ...server };
    for (const [itemId, types] of Object.entries(BADGE_TYPES)) {
      const n = notifications.filter(x => !x.isRead && x.storeId === storeId && types.includes(x.type)).length;
      if (n > 0) counts[itemId] = n;
    }
    return counts;
  }, [notifications, storeId, server]);
}

/** Opening a page clears its badge: marks that page's unread notifications as read once the seller is on it. */
export function useClearViewedBadges(storeId: string): void {
  const { pathname } = useLocation();
  const { notifications, markAsRead } = useNotification();
  const asked = useRef(new Set<string>());
  useEffect(() => {
    if (!storeId) return;
    for (const [itemId, types] of Object.entries(BADGE_TYPES)) {
      const base = `/store/${storeId}/${itemId}`;
      // Only the list page itself counts as "looked" (opening one order from a notification marks just that one).
      if (pathname !== base) continue;
      for (const n of notifications) {
        if (n.isRead || n.storeId !== storeId || !types.includes(n.type) || asked.current.has(n._id)) continue;
        asked.current.add(n._id);
        markAsRead(n._id);
      }
    }
  }, [pathname, notifications, storeId, markAsRead]);
}
