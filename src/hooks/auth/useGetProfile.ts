import { useState, useEffect } from 'react';
import { apiGetProfile, TokenStorage, type ProfileData } from '@/api/commerce/auth';

export function useGetProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(() => TokenStorage.isLoggedIn());
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!TokenStorage.isLoggedIn()) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiGetProfile()
      .then(res => { if (!cancelled) setProfile(res.data); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { profile, loading, error };
}
