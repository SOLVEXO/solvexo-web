import { useState } from 'react';
import { apiChangePassword, type ChangePasswordPayload } from '@/api/services/users';

export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  async function execute(payload: ChangePasswordPayload): Promise<boolean> {
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await apiChangePassword(payload);
      setSuccess(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error, success };
}
