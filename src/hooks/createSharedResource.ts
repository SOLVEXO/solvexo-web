import { useCallback, useEffect, useState } from 'react';

interface ResourceState<T> {
  data:    T | null;
  loading: boolean;
  error:   string;
}

interface SharedResourceOptions {
  /** When set, the last-fetched result is persisted to localStorage under
   *  this key and re-hydrated synchronously on the NEXT page load — so a
   *  hard browser refresh (which wipes this module's own in-memory `cache`
   *  along with everything else) shows the previously-known data instantly
   *  instead of an empty skeleton, while a real fetch still runs right
   *  after to silently replace it with the current truth. Same
   *  stale-while-revalidate idea `TokenStorage` already relies on for
   *  session persistence — just for read-only "my profile"/"my stores"
   *  shaped data instead of auth tokens. */
  storageKey?: string;
}

// A tiny shared-cache/request-dedup primitive: every component calling the hook
// this factory returns shares one in-flight request and one cached result,
// instead of each mount independently re-fetching the same global resource
// (e.g. "my profile", "my stores") on its own.
export function createSharedResource<T>(fetcher: () => Promise<T>, options: SharedResourceOptions = {}) {
  const { storageKey } = options;

  let cache: T | null      = null;
  let hasFetched           = false;
  let inflight: Promise<T> | null = null;
  const listeners = new Set<(state: ResourceState<T>) => void>();

  // Synchronous hydration — runs once, at module load, before any component
  // even mounts. Never trusted as the final answer (a real fetch always
  // follows), so a stale/corrupted/missing value here just falls back to
  // the normal empty-loading-state behavior, not a crash.
  if (storageKey && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) cache = JSON.parse(raw) as T;
    } catch {
      cache = null;
    }
  }

  function persist(result: T) {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(result));
    } catch {
      // Storage full/blocked (private browsing, quota) — non-critical,
      // the in-memory cache for this tab's session still works fine.
    }
  }

  function currentState(loading: boolean, error = ''): ResourceState<T> {
    return { data: cache, loading, error };
  }

  function notify(state: ResourceState<T>) {
    listeners.forEach(l => l(state));
  }

  function load(force = false): Promise<T> {
    if (!force && hasFetched && cache !== null) return Promise.resolve(cache);
    if (!force && inflight) return inflight;

    // Only actually show a blocking "loading" state when there's nothing
    // at all to display yet — a hydrated-from-storage value means this is
    // a silent background refresh over already-known data, which should
    // never blank out what's already on screen.
    notify(currentState(cache === null));
    inflight = fetcher()
      .then(result => {
        cache = result;
        hasFetched = true;
        inflight = null;
        persist(result);
        notify(currentState(false));
        return result;
      })
      .catch((err: unknown) => {
        inflight = null;
        notify(currentState(false, err instanceof Error ? err.message : 'Failed to load.'));
        throw err;
      });
    return inflight;
  }

  function invalidate() {
    cache = null;
    hasFetched = false;
    inflight = null;
    if (storageKey && typeof window !== 'undefined') {
      try { window.localStorage.removeItem(storageKey); } catch { /* non-critical */ }
    }
  }

  function useSharedResource() {
    const [state, setState] = useState<ResourceState<T>>(() => currentState(cache === null && !inflight));

    useEffect(() => {
      listeners.add(setState);
      load().catch(() => {});
      return () => { listeners.delete(setState); };
    }, []);

    const refetch = useCallback(() => { load(true).catch(() => {}); }, []);

    return { ...state, refetch };
  }

  return { useSharedResource, invalidate };
}
