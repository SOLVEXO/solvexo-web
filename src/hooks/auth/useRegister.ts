import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRegister, AuthContext, type RegisterPayload } from '@/api/auth';

export function useRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(payload: RegisterPayload) {
    setError('');
    setLoading(true);
    try {
      const res = await apiRegister(payload);
      AuthContext.set({ email: payload.email, role: payload.role, userId: res.data.userId, flow: 'register' });
      navigate('/verify-otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
