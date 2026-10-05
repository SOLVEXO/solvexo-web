import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiExchangeSocialCode, TokenStorage, LastRolePreference } from '@/api/services/auth';
import { apiGetStoreSocialProviders, customerSocialStartUrl, type SocialProviderKey } from '@/api/services/customerSocialLogin';
import { safeRedirectPath } from '@/utils/safeRedirect';

const REDIRECT_KEY = 'solvexo.storefrontSocialRedirect';

function rememberRedirect(path: string) {
  try { sessionStorage.setItem(REDIRECT_KEY, path); } catch { /* storage blocked — falls back to the home page */ }
}
function takeRedirect(): string {
  try {
    const v = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    return safeRedirectPath(v) ?? '/';
  } catch {
    return '/';
  }
}

/**
 * A store's own "Sign in with Google / Facebook" (Shopify Customer accounts → Authentication). Shows only the
 * providers this store's owner connected. Clicking one sends the buyer to the provider's own page; the provider
 * returns them to this same `/login` with `?social_code=` (swapped here for the real session) or `?social_error=`.
 */
export function useStorefrontSocialLogin(storeId: string | undefined, redirectTo: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState<SocialProviderKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handledCode = useRef<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    apiGetStoreSocialProviders(storeId)
      .then(res => { if (!cancelled) setProviders(res.data.providers ?? []); })
      // Optional extra: if the list can't load, the email form still works — just no social buttons.
      .catch(() => { if (!cancelled) setProviders([]); });
    return () => { cancelled = true; };
  }, [storeId]);

  const code = searchParams.get('social_code');
  const providerError = searchParams.get('social_error');

  useEffect(() => {
    if (!providerError) return;
    setError(providerError);
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('social_error'); return next; }, { replace: true });
  }, [providerError, setSearchParams]);

  useEffect(() => {
    if (!code || handledCode.current === code) return;
    handledCode.current = code;
    setLoading(true);
    setError('');
    apiExchangeSocialCode(code)
      .then(res => {
        const { token, user } = res.data;
        TokenStorage.save(token.accessToken, token.refreshToken);
        TokenStorage.saveUser(user);
        LastRolePreference.set('user');
        // Full reload (same as the platform's own social login) so cart/wishlist/auth contexts pick up the new session.
        window.location.replace(takeRedirect());
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
        setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('social_code'); return next; }, { replace: true });
        setLoading(false);
      });
  }, [code, setSearchParams]);

  const start = useCallback((provider: SocialProviderKey) => {
    if (!storeId) return;
    rememberRedirect(redirectTo);
    window.location.href = customerSocialStartUrl(provider, storeId, window.location.origin);
  }, [storeId, redirectTo]);

  return { providers, start, loading, error };
}
