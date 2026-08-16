import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiVerifyOtp, AuthContext, TokenStorage } from '@/api/commerce/auth';

type AppRole = 'user' | 'seller' | 'admin';

function getRoleRedirect(role: AppRole): string {
  if (role === 'seller') return '/onboarding';
  if (role === 'admin')  return '/admin/dashboard';
  return '/';
}

export function useVerifyOtp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(otp: string) {
    const ctx = AuthContext.get();
    if (!ctx?.email) { setError('Session expired. Please register again.'); return; }

    setError('');
    setLoading(true);
    try {
      const res = await apiVerifyOtp({ email: ctx.email, role: ctx.role, otp });
      TokenStorage.save(res.data.token.accessToken, res.data.token.refreshToken);
      TokenStorage.saveUser(res.data.user);
      AuthContext.clear();
      navigate(getRoleRedirect(ctx.role as AppRole), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
