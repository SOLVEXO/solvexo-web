import { apiSaveVisit, type VisitInput, type VisitSaved } from '@/api/services/salesVisits';

/**
 * Visits saved with no signal wait here, in this browser's storage, and upload by themselves when the phone is back
 * online. Each visit carries its own clientId, so a visit that reached the server just before the connection dropped
 * is stored once even if it is sent again. Storage can be missing or full (private window, old phone): every read and
 * write is guarded, and a full storage keeps the visit without its photo rather than losing it.
 */
export interface QueuedVisit {
  input: VisitInput;
  queuedAt: string;
  attempts: number;
  /** Set when the server refused the visit (not a network problem); it then waits for the rep to fix or discard it. */
  error: string | null;
}

const KEY = 'solvexo.salesVisits.queue.v1';
const DRAFT_KEY = 'solvexo.salesVisits.draft.v1';
const AREAS_KEY = 'solvexo.salesVisits.areas.v1';
export const QUEUE_EVENT = 'solvexo:visit-queue';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
const announce = () => { try { window.dispatchEvent(new Event(QUEUE_EVENT)); } catch { /* no window in tests */ } };

export const queuedVisits = (): QueuedVisit[] => read<QueuedVisit[]>(KEY, []);
export const pendingCount = () => queuedVisits().length;

/** Keeps a visit for later. Returns 'saved', 'saved_without_photo' (storage full) or 'failed' (no storage at all). */
export function enqueueVisit(input: VisitInput): 'saved' | 'saved_without_photo' | 'failed' {
  const list = queuedVisits().filter(q => q.input.clientId !== input.clientId);
  const entry: QueuedVisit = { input, queuedAt: new Date().toISOString(), attempts: 0, error: null };
  if (write(KEY, [...list, entry])) { announce(); return 'saved'; }
  if (input.photoDataUrl && write(KEY, [...list, { ...entry, input: { ...input, photoDataUrl: null } }])) { announce(); return 'saved_without_photo'; }
  return 'failed';
}

export function discardQueued(clientId: string) {
  write(KEY, queuedVisits().filter(q => q.input.clientId !== clientId));
  announce();
}

type Send = (input: VisitInput) => Promise<{ data: VisitSaved }>;
export interface SyncResult { sent: number; failed: number; waiting: number }

let running: Promise<SyncResult> | null = null;

/**
 * Sends waiting visits oldest first. A network failure stops the run (still no signal) and leaves the rest waiting;
 * a server refusal marks that visit with the reason and moves on. Only one run at a time.
 */
export function syncQueuedVisits(send: Send = apiSaveVisit): Promise<SyncResult> {
  if (running) return running;
  running = (async () => {
    let sent = 0, failed = 0;
    for (const item of queuedVisits()) {
      if (item.error) continue;
      try {
        await send(item.input);
        discardQueued(item.input.clientId);
        sent++;
      } catch (e) {
        const err = e as { isNetworkError?: boolean; status?: number; message?: string };
        const retryLater = err.isNetworkError || !err.status || err.status >= 500 || err.status === 429 || err.status === 401;
        write(KEY, queuedVisits().map(q => (q.input.clientId === item.input.clientId
          ? { ...q, attempts: q.attempts + 1, error: retryLater ? null : (err.message || 'The server refused this visit.') }
          : q)));
        announce();
        if (retryLater) break;
        failed++;
      }
    }
    return { sent, failed, waiting: pendingCount() };
  })().finally(() => { running = null; });
  return running;
}

/** Puts a refused visit back in line after the rep has read why (e.g. after the server was fixed). */
export function retryQueued(clientId: string) {
  write(KEY, queuedVisits().map(q => (q.input.clientId === clientId ? { ...q, error: null } : q)));
  announce();
}

// ── Draft and areas (conveniences: losing them loses nothing important) ──────

export const loadDraft = <T>(): T | null => read<T | null>(DRAFT_KEY, null);
export const saveDraft = (draft: unknown) => write(DRAFT_KEY, draft);
export const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

export const cachedAreas = (): string[] => read<string[]>(AREAS_KEY, []);
export const cacheAreas = (areas: string[]) => write(AREAS_KEY, areas.slice(0, 200));

/** A random id for a new visit (crypto.randomUUID where available). */
export function newClientId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
