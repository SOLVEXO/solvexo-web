import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSocialLogin, TokenStorage, getRoleRedirect, type SocialLoginPayload } from '@/api/services/auth';

// No real provider SDK is wired into the frontend yet (no Google Identity Services,
// Facebook JS SDK, or Sign in with Apple JS) — clicking a social button used to open a
// fake account-picker modal, which is misleading in a QA build. Surface the real gap
// instead: which backend key is still missing so it's clear this just needs config,
// not a rebuild.
const NOT_CONFIGURED_MESSAGE: Record<SocialLoginPayload['authProvider'], string> = {
  google:   'Google Sign-In isn\'t wired up yet — backend needs GOOGLE_CLIENT_ID configured and a real Google auth flow added to the frontend.',
  facebook: 'Facebook Login isn\'t wired up yet — backend needs FACEBOOK_APP_ID/FACEBOOK_APP_SECRET configured and a real Facebook auth flow added to the frontend.',
  apple:    'Sign in with Apple isn\'t wired up yet — backend needs APPLE_CLIENT_ID configured and a real Apple auth flow added to the frontend.',
};

export function useSocialLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function notConfigured(provider: SocialLoginPayload['authProvider']) {
    setError(NOT_CONFIGURED_MESSAGE[provider]);
  }

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

  return { execute, notConfigured, loading, error };
}
