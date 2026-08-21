import { useState, useEffect, useCallback } from 'react';
import { apiAdminListThemeCatalog, type ThemeDefinition, type AdminListThemeCatalogParams } from '@/api/services/themeCatalog';

export function useAdminThemeCatalog(params: AdminListThemeCatalogParams = {}) {
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    return apiAdminListThemeCatalog(params)
      .then(res => setThemes(res.data ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load themes.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.category, params.status, params.search]);

  useEffect(() => { refetch(); }, [refetch]);

  return { themes, loading, error, refetch };
}
