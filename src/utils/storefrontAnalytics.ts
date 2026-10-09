import { API_BASE_URL } from '@/api/client';

/**
 * First-party online-store analytics (Shopify-style sessions). A visit ("session") ends after 30 minutes without
 * activity or at local midnight; a visitor id is kept across visits so returning visitors can be told apart.
 * Only page views are sent from here — add-to-cart / checkout / purchase are recorded by the server when they
 * really happen (the visit id travels in those request bodies via `analyticsSessionFields`).
 *
 * Only runs after the visitor allowed analytics where the store shows a cookie banner (see StorefrontLayout).
 * Ids are random; no personal data or query strings are sent. Storage failures (private mode) just mean no tracking.
 */

const VISITOR_KEY = 'sx_vid';
const SESSION_KEY = (storeId: string) => `sx_sess_${storeId}`;
const IDLE_MS = 30 * 60 * 1000;

interface StoredSession { id: string; lastAt: number; day: string; storeId: string }

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

const localDay = (t: number) => new Date(t).toDateString();

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch { /* storage blocked */ }
}

function visitorId(): string {
  let id: string | null = null;
  try { id = localStorage.getItem(VISITOR_KEY); } catch { /* storage blocked */ }
  if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    id = randomId();
    write(VISITOR_KEY, id);
  }
  return id;
}

/** Current visit for this store, starting a new one after 30 idle minutes or a new day. */
function touchSession(storeId: string): { id: string; isNew: boolean } {
  const now = Date.now();
  const stored = readJson<StoredSession>(SESSION_KEY(storeId));
  const valid = stored && stored.storeId === storeId && now - stored.lastAt < IDLE_MS && stored.day === localDay(now);
  const id = valid ? stored!.id : randomId();
  write(SESSION_KEY(storeId), { id, lastAt: now, day: localDay(now), storeId } satisfies StoredSession);
  return { id, isNew: !valid };
}

/** Only an active visit (no new one is started) — for the server-side funnel steps. */
function currentSessionId(storeId: string): string | null {
  const stored = readJson<StoredSession>(SESSION_KEY(storeId));
  if (!stored || stored.storeId !== storeId || Date.now() - stored.lastAt >= IDLE_MS) return null;
  return stored.id;
}

let consented = false;
/** Set by StorefrontLayout once the visitor's analytics consent is known. */
export function setStorefrontAnalyticsConsent(allowed: boolean) {
  consented = allowed;
}

/** Spread into add-to-cart / create-checkout bodies: `{ analyticsSessionId }` when tracking is on, else nothing. */
export function analyticsSessionFields(storeId: string | null | undefined): { analyticsSessionId?: string } {
  if (!consented || !storeId) return {};
  const id = currentSessionId(storeId);
  return id ? { analyticsSessionId: id } : {};
}

/** Records one page view (fire-and-forget; survives page unload via keepalive). */
export function trackStorefrontPageView(storeId: string, path: string) {
  if (!consented || !storeId || !API_BASE_URL) return;
  try {
    const { id, isNew } = touchSession(storeId);
    const body: Record<string, string> = { storeId, sessionId: id, visitorId: visitorId(), path };
    if (isNew) {
      // First page of a visit: where it came from (an internal link is not a referrer).
      const ref = document.referrer;
      if (ref) {
        try { if (new URL(ref).host !== window.location.host) body.referrer = ref; } catch { /* ignore */ }
      }
      const params = new URLSearchParams(window.location.search);
      for (const [param, field] of [['utm_source', 'utmSource'], ['utm_medium', 'utmMedium'], ['utm_campaign', 'utmCampaign']] as const) {
        const v = params.get(param);
        if (v) body[field] = v.slice(0, 100);
      }
      try { body.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* ignore */ }
    }
    void fetch(`${API_BASE_URL}/api/storefront-analytics/page-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
      credentials: 'omit',
    }).catch(() => { /* analytics never breaks the storefront */ });
  } catch {
    /* analytics never breaks the storefront */
  }
}
