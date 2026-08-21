import { useCallback, useRef, useState } from 'react';
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
          renderButton: (parent: HTMLElement, options: object) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Shared across every hook instance/component on the page — the GSI script
// only ever needs to be fetched once, regardless of how many "Continue with
// Google" slots end up mounted.
let googleScriptPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => {
        googleScriptPromise = null;
        reject(new Error('Failed to load Google Identity Services script'));
      };
      document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
}

// `role` defaults to 'seller' — the web login form only offers seller sign-in
// today (see LoginPage's hidden buyer toggle), so Google should resolve to a
// Seller account, not a buyer one. Callers pass their own `role` state so a
// future re-enabled buyer toggle just flows through unchanged — buyer-only
// call sites (AuthGateModal, SignInPreview) pass 'user' explicitly.
export function useSocialLogin(role: AppRole = 'seller') {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const initializedRef = useRef(false);

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

  const handleCredential = useCallback((response: { credential: string }) => {
    (async () => {
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
        setError('Google sign-in failed. Please try again.');
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Mounts a provider's own real sign-in widget into `container` (called by
  // SocialLoginRow's ProviderSlot once its DOM node exists) — for Google,
  // Identity Services' actual `renderButton`. Clicking it opens Google's own
  // account-chooser/popup flow directly.
  //
  // This replaces the old approach of a custom-styled button whose onClick
  // called Google's One Tap `prompt()` — that silently fails on Safari/
  // mobile/Incognito, where One Tap is suppressed under ITP-style
  // third-party-storage restrictions (confirmed via a live repro: the FedCM
  // status check Google's script fires came back with `is_itp=true`, and the
  // prompt never displayed, landing on "Google sign-in was cancelled or
  // blocked" every time). A real, directly user-clicked provider button
  // reliably falls back to a proper popup sign-in flow everywhere instead.
  const mount = useCallback((provider: SocialProvider, container: HTMLElement) => {
    if (provider !== 'google') return;
    if (!GOOGLE_CLIENT_ID) {
      setError('Google login is not configured. Please use email and password.');
      return;
    }
    loadGoogleScript()
      .then(() => {
        if (!initializedRef.current) {
          window.google!.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredential,
            use_fedcm_for_prompt: true,
          });
          initializedRef.current = true;
        }
        // Google clamps this to [200, 400]px itself, but clamping here too
        // avoids relying on that undocumented behavior.
        const width = Math.min(400, Math.max(200, container.clientWidth || 300));
        window.google!.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width,
        });
      })
      .catch(() => setError('Failed to load Google login. Please try again.'));
  }, [handleCredential]);

  return { execute, mount, loading, error };
}
