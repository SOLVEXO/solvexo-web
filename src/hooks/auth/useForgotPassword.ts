import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiForgotPassword, AuthContext, type AppRole } from '@/api/auth';

export function useForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(email: string, role: AppRole = 'user') {
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword({ email, role });
      AuthContext.set({ email, role, flow: 'forgot' });
      navigate('/new-password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
