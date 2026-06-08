import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin, TokenStorage, getRoleRedirect, type LoginPayload, type AppRole } from '@/api/auth';

export function useLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(payload: LoginPayload) {
    setError('');
    setLoading(true);
    try {
      const res        = await apiLogin(payload);
      const { token, user } = res.data;
      TokenStorage.save(token.accessToken, token.refreshToken);
      TokenStorage.saveUser(user);
      const serverRole = (user.role ?? payload.role) as AppRole;
      navigate(getRoleRedirect(serverRole), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
