import { useCallback, useState } from 'react';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import {
  apiGetAdminUsersStats,
  apiListAdminUsers,
  apiSuspendAccount,
  apiUnsuspendAccount,
  type AccountRole,
  type AdminUsersQuery,
} from '@/api/services/users/adminUsers';

export function useAdminUsersStats() {
  return useAnalyticsQuery(() => apiGetAdminUsersStats(), {});
}

export function useAdminUsersList(query: AdminUsersQuery) {
  return useAnalyticsQuery(apiListAdminUsers, query);
}

export function useAdminUserActions() {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const suspend = useCallback(async (role: AccountRole, id: string) => {
    setProcessingId(id);
    setError('');
    try {
      await apiSuspendAccount(role, id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend account.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const unsuspend = useCallback(async (role: AccountRole, id: string) => {
    setProcessingId(id);
    setError('');
    try {
      await apiUnsuspendAccount(role, id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsuspend account.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  return { suspend, unsuspend, processingId, error };
}
