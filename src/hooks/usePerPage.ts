import { useState } from 'react';

export const PER_PAGE_OPTIONS = [25, 50, 100] as const;

/** Rows-per-page for an admin list, remembered per list in this browser (falls back to the default when storage is unavailable). */
export function usePerPage(storageKey: string, fallback: number = PER_PAGE_OPTIONS[0]): [number, (n: number) => void] {
  const key = `solvexo_per_page:${storageKey}`;
  const [perPage, setPerPageState] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(key));
      return (PER_PAGE_OPTIONS as readonly number[]).includes(saved) ? saved : fallback;
    } catch { return fallback; }
  });
  const setPerPage = (n: number) => {
    setPerPageState(n);
    try { localStorage.setItem(key, String(n)); } catch { /* storage unavailable: keep it for this visit only */ }
  };
  return [perPage, setPerPage];
}
