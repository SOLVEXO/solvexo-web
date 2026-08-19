import { useState, useEffect, useCallback } from 'react';
import { apiGetAllTestimonials, type AdminTestimonial, type TestimonialStats } from '@/api/services/testimonials';

export function useAdminTestimonials() {
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [stats, setStats] = useState<TestimonialStats>({ active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    return apiGetAllTestimonials()
      .then(res => { setTestimonials(res.data ?? []); setStats(res.stats ?? { active: 0, inactive: 0 }); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load testimonials.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { testimonials, stats, loading, error, refetch };
}
