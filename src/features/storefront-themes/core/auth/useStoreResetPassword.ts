import { useState } from 'react';
import { apiResetPassword, AuthContext } from '@/api/services/auth';
import { ts } from '@/utils/tStatic';

/**
 * Password reset for a buyer of THIS store. Same call as the shared hook, but it also sends the store id kept in
 * `AuthContext` - buyer accounts are per store, so without it the server looks up the legacy global account and
 * answers "invalid code" for every real customer.
 */
export function useStoreResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function execute(otp: string, newPassword: string) {
    const ctx = AuthContext.get();
    if (!ctx?.email) { setError(ts('pg.session_expired_please_start_again', 'Session expired. Please start again.')); return; }
    setError(''); setLoading(true);
    try {
      await apiResetPassword({ email: ctx.email, role: ctx.role, otp, newPassword, storeId: ctx.storeId });
      AuthContext.clear();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : ts('pg.invalid_or_expired_code_please_try_again', 'Invalid or expired code. Please try again.'));
    } finally { setLoading(false); }
  }

  return { execute, loading, error, success };
}
