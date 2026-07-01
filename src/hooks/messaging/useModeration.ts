import { useState } from 'react';
import { apiBlockUser, apiUnblockUser, apiReportEntity, type BlockUserPayload, type ReportPayload } from '@/api/commerce/messaging';

export function useModeration() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function run(action: () => Promise<unknown>) {
    setError('');
    setLoading(true);
    try {
      await action();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  const block   = (payload: BlockUserPayload) => run(() => apiBlockUser(payload));
  const unblock = (targetId: string)          => run(() => apiUnblockUser(targetId));
  const report  = (payload: ReportPayload)    => run(() => apiReportEntity(payload));

  return { block, unblock, report, loading, error };
}
