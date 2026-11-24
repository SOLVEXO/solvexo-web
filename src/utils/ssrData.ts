/**
 * Data a page needs for its FIRST render, already in hand: filled on the server before rendering (so the HTML contains the
 * real content, not a skeleton) and handed to the browser inside the page (`window.__SX_DATA__`) so hydration paints
 * exactly the same markup. Public storefront data only - never anything that depends on who the visitor is.
 *
 * An entry is used ONCE (`takeSsr`): the browser's first render consumes it, later renders and navigations fetch normally.
 * Keys are the same strings the API layer already uses for its short-lived request cache (`home:<storeId>`, ...).
 */
declare global { interface Window { __SX_DATA__?: Record<string, unknown> } }

const entries = new Map<string, unknown>();
let loadedFromWindow = false;

function loadFromWindow() {
  if (loadedFromWindow || typeof window === 'undefined') return;
  loadedFromWindow = true;
  const data = window.__SX_DATA__;
  if (!data || typeof data !== 'object') return;
  for (const [key, value] of Object.entries(data)) entries.set(key, value);
}

/** Read an entry without using it up (server render and the first client render both look at it). */
export function peekSsr<T>(key: string | undefined): T | undefined {
  if (!key) return undefined;
  loadFromWindow();
  return entries.has(key) ? (entries.get(key) as T) : undefined;
}

/** Store an entry (server: before rendering; tests). */
export function putSsr(key: string, value: unknown): void {
  entries.set(key, value);
}

/** Everything stored so far, ready to be written into the HTML. */
export function dumpSsr(): Record<string, unknown> {
  return Object.fromEntries(entries);
}

/**
 * Server only. While a render pass is being COLLECTED, a component that wanted data it does not have yet (`useLoad` with
 * an `ssrKey`) registers the loader here. The server then runs every registered loader, stores the results with `putSsr`
 * and renders again, until a pass asks for nothing new (data that depends on data, like a section's products).
 */
type Loader = () => Promise<unknown>;
let collecting: Map<string, Loader> | null = null;

export function beginCollect(): Map<string, Loader> {
  collecting = new Map();
  return collecting;
}

export function endCollect(): void {
  collecting = null;
}

/** Called from render. Does nothing in the browser and outside a collecting pass. */
export function wantSsr(key: string | undefined, loader: Loader): void {
  if (!key || !collecting || entries.has(key) || failed.has(key) || collecting.has(key)) return;
  collecting.set(key, loader);
}

/** Server: a loader that failed or timed out is not asked for again in the next pass (the browser will load it itself). */
const failed = new Set<string>();
export function failSsr(key: string): void {
  failed.add(key);
}

/** Forget one entry (the browser calls this once the first render used it) or everything (server, between requests). */
export function dropSsr(key?: string): void {
  if (key === undefined) { entries.clear(); failed.clear(); loadedFromWindow = false; return; }
  entries.delete(key);
}
