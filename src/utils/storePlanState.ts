/** Per-store plan state helpers shared by login routing, the store switcher and the trial-expired gate.
 *  A seller owns many stores and each store has its OWN plan, so one store whose trial ended must never trap the seller. */

/** Plan states in which the store cannot sell until the owner chooses / pays for a plan. */
const BLOCKED = new Set(['trial_ended', 'locked']);

/** True while the store can be worked in normally (no plan gate). A store with no known plan state counts as usable. */
export function isPlanUsable(planStatus?: string | null): boolean {
  return !planStatus || !BLOCKED.has(planStatus);
}

export interface PlanBadge { label: string; tone: 'bad' | 'warn' | 'info' }

/** Short label shown next to a store in the switcher; null when nothing needs saying. */
export function planBadge(planStatus?: string | null): PlanBadge | null {
  switch (planStatus) {
    case 'trial_ended': return { label: 'Trial ended', tone: 'bad' };
    case 'locked':      return { label: 'Locked', tone: 'bad' };
    case 'past_due':    return { label: 'Payment due', tone: 'warn' };
    case 'canceled':    return { label: 'Canceled', tone: 'warn' };
    case 'trialing':    return { label: 'Trial', tone: 'info' };
    default:            return null;
  }
}

export const RECENT_STORES_KEY = 'solvexo:storeSwitchRecent';

/** Stores the seller used most recently, newest first. Unreadable storage only costs the "last used" preference. */
export function readRecentStoreIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Puts a store at the front of the recent list (called when the seller opens a store). Returns the new list. */
export function rememberStore(storeId: string): string[] {
  const next = [storeId, ...readRecentStoreIds().filter(id => id !== storeId)].slice(0, 5);
  try { localStorage.setItem(RECENT_STORES_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  return next;
}
