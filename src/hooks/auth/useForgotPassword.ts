import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiForgotPassword, AuthContext, type AppRole } from '@/api/services/auth';
import { ts } from '@/utils/tStatic';

export function useForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(email: string, role: AppRole = 'user', storeId?: string) {
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword({ email, role, storeId });
      AuthContext.set({ email, role, flow: 'forgot', storeId });
      navigate('/verify-otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : ts('pg.something_went_wrong_please_try_again', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
