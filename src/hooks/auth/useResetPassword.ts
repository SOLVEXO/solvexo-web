import { useState } from 'react';
import { apiResetPassword, AuthContext } from '@/api/commerce/auth';

export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  async function execute(otp: string, newPassword: string) {
    const ctx = AuthContext.get();
    if (!ctx?.email) { setError('Session expired. Please start again.'); return; }

    setError('');
    setLoading(true);
    try {
      await apiResetPassword({ email: ctx.email, role: ctx.role, otp, newPassword });
      AuthContext.clear();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error, success };
}
