import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSocialLogin, TokenStorage, getRoleRedirect, RememberedAccount, type SocialLoginPayload } from '@/api/services/auth';
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
      RememberedAccount.set({ name: user.name, email: user.email, role: 'user', image: user.image ?? null });
      navigate(getRoleRedirect('user'), { replace: true });
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
