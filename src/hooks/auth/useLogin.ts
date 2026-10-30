import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin, apiVerifyAdminTwoFactor, isTwoFactorChallenge, TokenStorage, getRoleRedirect, LastRolePreference, RememberedAccount, type LoginPayload, type AppRole } from '@/api/services/auth';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import { useToast } from '@/contexts/ToastContext';
import { ts } from '@/utils/tStatic';

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
  // Resolves to a challenge token when the account (admins only) has two-factor on: the caller then asks for a code
  // and calls `verifyTwoFactor`. Otherwise the session is saved and the user is sent on, exactly as before.
  async function execute(payload: LoginPayload, redirectTo?: string | null): Promise<{ challengeToken: string } | void> {
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(payload);
      if (isTwoFactorChallenge(res.data)) return { challengeToken: res.data.challengeToken };
      await finish(res.data, payload.role, redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : ts('pg.invalid_credentials_please_try_again', 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function verifyTwoFactor(challengeToken: string, code: string, redirectTo?: string | null): Promise<void> {
    setError('');
    setLoading(true);
    try {
      const res = await apiVerifyAdminTwoFactor(challengeToken, code);
      if (res.data.twoFactor?.usedRecoveryCode) {
        toast.info(`Recovery code used — ${res.data.twoFactor.recoveryCodesLeft} left. Make new ones in Settings → Two-factor sign-in.`);
      }
      await finish(res.data, 'admin', redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't match.");
    } finally {
      setLoading(false);
    }
  }

  async function finish(data: Awaited<ReturnType<typeof apiLogin>>['data'], role: LoginPayload['role'], redirectTo?: string | null) {
    const { token, user } = data;
    // Cookie scope is decided by the current hostname, not this payload —
    // see `TokenStorage`'s own doc comment in `api/services/auth.ts` for
    // the real bug this fixed (a seller/admin apex session leaking onto
    // their own store's subdomain).
    TokenStorage.save(token.accessToken, token.refreshToken);
    TokenStorage.saveUser(user);
    const serverRole = (user.role ?? role) as AppRole;
    LastRolePreference.set(serverRole);
    RememberedAccount.set({ name: user.name, email: user.email, role: serverRole, image: user.image ?? null, authMethod: 'password' });
    toast.success(ts('pg.logged_in_successfully', 'Logged in successfully'));
    if (redirectTo) {
      navigate(redirectTo, { replace: true });
      return;
    }
    // An existing seller's own real store state (not a hardcoded guess)
    // decides where they land — onboarding if they never finished setup,
    // verification if a store is pending/rejected, dashboard once active.
    const destination = serverRole === 'seller' ? await resolveSellerDestinationRemote() : getRoleRedirect(serverRole);
    navigate(destination, { replace: true });
  }

  return { execute, verifyTwoFactor, loading, error };
}
