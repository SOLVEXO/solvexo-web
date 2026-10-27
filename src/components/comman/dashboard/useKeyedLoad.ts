import { useEffect, useState } from 'react';

/**
 * Loads one resource and ties the result to the request that produced it (`key` + retry counter), so changing the key or
 * pressing retry shows the loading state again without setting state inside the effect. `load` is deliberately not a
 * dependency: callers pass an inline arrow, the `key` says when the request really changes.
 */
export function useKeyedLoad<T>(load: () => Promise<T>, key: string, enabled = true) {
  const [bump, setBump] = useState(0);
  const fullKey = `${key}:${bump}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load()
      .then(data => { if (!cancelled) setResult({ key: fullKey, data }); })
      .catch(err => { if (!cancelled) setResult({ key: fullKey, error: err instanceof Error ? err.message : 'Could not load this data.' }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey, enabled]);

  const current = result?.key === fullKey ? result : null;
  return { data: current?.data ?? null, error: current?.error ?? '', loading: enabled && !current, retry: () => setBump(b => b + 1) };
}
