import { useState, useEffect, useCallback } from 'react';
import { apiGetAllFaqs, type Faq, type FaqStats } from '@/api/services/faq';

export function useAdminFaqs() {
  const [faqs, setFaqs]   = useState<Faq[]>([]);
  const [stats, setStats] = useState<FaqStats>({ active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    return apiGetAllFaqs()
      .then(res => { setFaqs(res.data ?? []); setStats(res.stats ?? { active: 0, inactive: 0 }); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load FAQs.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { faqs, stats, loading, error, refetch };
}
