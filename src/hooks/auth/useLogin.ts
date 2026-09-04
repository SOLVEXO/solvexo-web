import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin, TokenStorage, getRoleRedirect, LastRolePreference, RememberedAccount, type LoginPayload, type AppRole } from '@/api/services/auth';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import { useToast } from '@/contexts/ToastContext';

export function useLogin() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // `redirectTo` is the page the user was trying to reach before being
  // bounced to login (see client.ts's 401 interceptor / RequireRole guards,
  // which both append `?redirect=`) — only ever a same-origin relative path
  // (validated by the caller), so a successful login returns them to where
  // they actually were instead of always the role's default dashboard.
  async function execute(payload: LoginPayload, redirectTo?: string | null) {
    setError('');
    setLoading(true);
    try {
      const res        = await apiLogin(payload);
      const { token, user } = res.data;
      // Cookie scope is decided by the current hostname, not this payload —
      // see `TokenStorage`'s own doc comment in `api/services/auth.ts` for
      // the real bug this fixed (a seller/admin apex session leaking onto
      // their own store's subdomain).
      TokenStorage.save(token.accessToken, token.refreshToken);
      TokenStorage.saveUser(user);
      const serverRole = (user.role ?? payload.role) as AppRole;
      LastRolePreference.set(serverRole);
      RememberedAccount.set({ name: user.name, email: user.email, role: serverRole, image: user.image ?? null, authMethod: 'password' });
      toast.success('Logged in successfully');
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
        return;
      }
      // An existing seller's own real store state (not a hardcoded guess)
      // decides where they land — onboarding if they never finished setup,
      // verification if a store is pending/rejected, dashboard once active.
      const destination = serverRole === 'seller' ? await resolveSellerDestinationRemote() : getRoleRedirect(serverRole);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
