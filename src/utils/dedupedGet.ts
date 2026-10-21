/**
 * Short-lived promise cache for public storefront GETs. Lets StorefrontLayout start several requests in parallel
 * the moment the store resolves and lets the components that need the same data (e.g. the page list, which the
 * navbar and footer both ask for) reuse the in-flight request instead of firing it again. TTL is deliberately tiny
 * so a seller's edit is never visibly stale; a failed request is dropped immediately so it can be retried.
 */
const entries = new Map<string, { promise: Promise<unknown>; at: number }>();

/** Pre-fill a key with a value already in hand (e.g. from a bundled response), so the next dedupedGet for it makes no request. */
export function seedDedupedGet<T>(key: string, value: T, ttlMs = 5000): void {
  entries.set(key, { promise: Promise.resolve(value), at: Date.now() - 5000 + ttlMs });
}

export function dedupedGet<T>(key: string, load: () => Promise<T>, ttlMs = 5000): Promise<T> {
  const hit = entries.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise as Promise<T>;
  const promise = load();
  entries.set(key, { promise, at: Date.now() });
  promise.catch(() => { if (entries.get(key)?.promise === promise) entries.delete(key); });
  return promise;
}
