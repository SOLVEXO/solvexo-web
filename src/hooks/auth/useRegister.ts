import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRegister, AuthContext, LastRolePreference, RememberedAccount, type RegisterPayload } from '@/api/services/auth';

export function useRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(payload: RegisterPayload) {
    setError('');
    setLoading(true);
    try {
      const res = await apiRegister(payload);
      AuthContext.set({ email: payload.email, role: payload.role, userId: res.data.userId, flow: 'register', storeId: payload.storeId });
      LastRolePreference.set(payload.role);
      // Remember this account from the moment registration is submitted, not
      // only after OTP verification completes — someone who fills the form
      // and then abandons before verifying (closes the tab, doesn't get the
      // email, etc.) should still get a "Continue as X" chooser next time
      // they land back on Register, same as Shopify recognizing an
      // in-progress signup. useVerifyOtp re-sets the same data once the
      // account is actually confirmed, which is harmless.
      RememberedAccount.set({ name: payload.name, email: payload.email, role: payload.role, image: null });
      navigate('/verify-otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
