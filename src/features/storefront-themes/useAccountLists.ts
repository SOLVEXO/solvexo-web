import { useState, useEffect, useCallback } from 'react';
import { apiGetMyAddresses, type Address } from '@/api/services/address';
import { apiGetMyReviews, type MyReviewEntry } from '@/api/services/rating';
import { sortAddresses } from './accountUi';

/** Loads the buyer's saved addresses; `reload` refetches (old rows stay on screen meanwhile). */
export function useMyAddresses() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetMyAddresses()
      .then(res => { if (!cancelled) setAddresses(sortAddresses(res.data ?? [])); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your addresses.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);

  return { addresses, loading, error, reload };
}

/** Loads one page of the buyer's own reviews. */
export function useMyReviews() {
  const [reviews, setReviews] = useState<MyReviewEntry[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetMyReviews(page)
      .then(res => {
        if (cancelled) return;
        setReviews(res.data.reviews ?? []);
        setTotalPages(Math.max(1, res.data.pagination?.totalPages ?? 1));
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your reviews.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, attempt]);

  return { reviews, totalPages, page, setPage, loading, error, reload };
}

export type { Address };
