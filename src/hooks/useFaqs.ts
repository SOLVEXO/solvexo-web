import { useState, useEffect, useCallback } from 'react';
import { apiGetActiveFaqs, apiSearchFaqs, apiGetFaqCategories, type Faq } from '@/api/services/faq';

export function useFaqs(category?: string, query?: string) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    const req = query?.trim() ? apiSearchFaqs(query.trim()) : apiGetActiveFaqs(category);
    return req
      .then(res => setFaqs(res.data ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load FAQs.'))
      .finally(() => setLoading(false));
  }, [category, query]);

  useEffect(() => { refetch(); }, [refetch]);

  return { faqs, loading, error };
}

export function useFaqCategories() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiGetFaqCategories()
      .then(res => { if (!cancelled) setCategories(res.data ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return categories;
}
