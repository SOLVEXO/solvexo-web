import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSocialLogin, TokenStorage, getRoleRedirect, LastRolePreference, RememberedAccount, type SocialLoginPayload, type AppRole } from '@/api/services/auth';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import type { SocialProvider } from '@/components/comman/ui/SocialIcons';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// `role` defaults to 'seller' — the web login form only offers seller sign-in
// today (see LoginPage's hidden buyer toggle), so Google should resolve to a
// Seller account, not a buyer one. Callers pass their own `role` state so a
// future re-enabled buyer toggle just flows through unchanged.
export function useSocialLogin(role: AppRole = 'seller') {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function execute(payload: SocialLoginPayload) {
    setError('');
    setLoading(true);
    try {
      const res = await apiSocialLogin({ ...payload, role });
      const { token, user } = res.data;
      const serverRole = (user.role ?? role) as AppRole;
      TokenStorage.save(token.accessToken, token.refreshToken);
      TokenStorage.saveUser(user);
      LastRolePreference.set(serverRole);
      RememberedAccount.set({ name: user.name, email: user.email, role: serverRole, image: user.image ?? null, authMethod: 'google' });
      const destination = serverRole === 'seller' ? await resolveSellerDestinationRemote() : getRoleRedirect(serverRole);
      navigate(destination, { replace: true });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google login is not configured. Please use email and password.');
      return;
    }

    setError('');
    setLoading(true);

    if (!window.google) {
      // Load Google Identity Services script dynamically
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => initGoogle();
      script.onerror = () => {
        setError('Failed to load Google login. Please try again.');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initGoogle();
    }
  }

  function initGoogle() {
    window.google!.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID!,
      callback: async (response: { credential: string }) => {
        try {
          // Decode the JWT to get basic user info
          const parts = response.credential.split('.');
          const payload = JSON.parse(atob(parts[1]));
          await execute({
            authProvider: 'google',
            token: response.credential,
            socialId: payload.sub,
            email: payload.email,
            name: payload.name,
            image: payload.picture,
          });
        } catch {
          setError('Google login failed. Please try again.');
          setLoading(false);
        }
      },
      use_fedcm_for_prompt: true,
    });
    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError('Google sign-in was cancelled or blocked. Please try again.');
        setLoading(false);
      }
    });
  }

  function onSelect(provider: SocialProvider) {
    if (provider === 'google') {
      handleGoogleLogin();
    }
  }

  // Keep notConfigured for backward compatibility
  function notConfigured(provider: SocialProvider) {
    onSelect(provider);
  }

  return { execute, notConfigured, onSelect, loading, error };
}
