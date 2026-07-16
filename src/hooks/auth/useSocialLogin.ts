import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSocialLogin, TokenStorage, getRoleRedirect, type SocialLoginPayload } from '@/api/services/auth';

export function useSocialLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(payload: SocialLoginPayload) {
    setError('');
    setLoading(true);
    try {
      const res = await apiSocialLogin(payload);
      const { token, user } = res.data;
      TokenStorage.save(token.accessToken, token.refreshToken);
      TokenStorage.saveUser(user);
      navigate(getRoleRedirect('user'), { replace: true });
      window.location.reload(); // reload to reinitialize sockets/contexts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
