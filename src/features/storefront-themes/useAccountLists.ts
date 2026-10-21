import { useState, useEffect, useCallback } from 'react';
import { apiGetMyAddresses, type Address } from '@/api/services/address';
import { apiGetMyReviews, type MyReviewEntry } from '@/api/services/rating';
import { sortAddresses } from './accountUi';
import { ts } from '@/utils/tStatic';

/** Loads the buyer's saved addresses; `reload` refetches (old rows stay on screen meanwhile). */
export function useMyAddresses() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  // which request has finished (and how): loading/error are derived from it, never set synchronously inside the effect
  const [done, setDone] = useState<{ attempt: number; error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    let cancelled = false;
    apiGetMyAddresses()
      .then(res => { if (!cancelled) { setAddresses(sortAddresses(res.data ?? [])); setDone({ attempt, error: '' }); } })
      .catch(err => { if (!cancelled) setDone({ attempt, error: err instanceof Error ? err.message : ts('pg.could_not_load_your_addresses', 'Could not load your addresses.') }); });
    return () => { cancelled = true; };
  }, [attempt]);

  const settled = done?.attempt === attempt;
  return { addresses, loading: !settled, error: settled ? done.error : '', reload };
}

/** Loads one page of the buyer's own reviews. */
export function useMyReviews() {
  const [reviews, setReviews] = useState<MyReviewEntry[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [done, setDone] = useState<{ key: string; error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(a => a + 1), []);
  const key = `${page}:${attempt}`;

  useEffect(() => {
    let cancelled = false;
    apiGetMyReviews(page)
      .then(res => {
        if (cancelled) return;
        setReviews(res.data.reviews ?? []);
        setTotalPages(Math.max(1, res.data.pagination?.totalPages ?? 1));
        setDone({ key, error: '' });
      })
      .catch(err => { if (!cancelled) setDone({ key, error: err instanceof Error ? err.message : ts('pg.could_not_load_your_reviews', 'Could not load your reviews.') }); });
    return () => { cancelled = true; };
  }, [page, key]);

  const settled = done?.key === key;
  return { reviews, totalPages, page, setPage, loading: !settled, error: settled ? done.error : '', reload };
}

export type { Address };
