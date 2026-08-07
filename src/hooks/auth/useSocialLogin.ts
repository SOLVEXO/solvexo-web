import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSocialLogin, TokenStorage, getRoleRedirect, type SocialLoginPayload } from '@/api/services/auth';

// No real provider SDK is wired into the frontend yet (no Google Identity Services,
// Facebook JS SDK, or Sign in with Apple JS) — clicking a social button used to open a
// fake account-picker modal, which is misleading in a QA build. Surface the real gap
// honestly, but as a plain-language "not available yet" notice — the env-var/config
// detail belongs in code comments for whoever wires this up, never in a message a
// real visitor sees (an env var name in a user-facing banner reads as broken, not
// "temporarily unavailable", and undermines trust on the exact screen meant to build it).
const NOT_CONFIGURED_MESSAGE: Record<SocialLoginPayload['authProvider'], string> = {
  google:   'Sign in with Google isn\'t available yet — please continue with your email and password.',
  facebook: 'Sign in with Facebook isn\'t available yet — please continue with your email and password.',
  apple:    'Sign in with Apple isn\'t available yet — please continue with your email and password.',
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
