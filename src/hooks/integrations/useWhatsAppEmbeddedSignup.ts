import { useRef, useState } from 'react';

const META_APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined;

/** Same pattern as StripeCardPayment's isStripeConfigured() — the "Connect
 *  WhatsApp" button should render disabled with an explanatory message
 *  instead of a broken popup when the Meta app hasn't been created yet
 *  (VITE_META_APP_ID blank, matching the backend's own currently-blank
 *  META_APP_ID/META_APP_SECRET). Set both once real Meta App credentials
 *  exist to go live — no other code changes needed. */
export function isMetaConfigured() {
  return !!META_APP_ID;
}

let fbSdkPromise: Promise<void> | null = null;

/** Loads Meta's JS SDK exactly once, reused across every mount — same
 *  module-level-singleton-promise pattern useSocialLogin's loadGoogleScript()
 *  already uses for Google Identity Services, for the same reason (avoid a
 *  second script tag / re-init race if this hook mounts more than once). */
function loadFacebookSdk(): Promise<void> {
  if (fbSdkPromise) return fbSdkPromise;
  fbSdkPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('No window')); return; }
    if ((window as any).FB) { resolve(); return; }

    (window as any).fbAsyncInit = function fbAsyncInit() {
      (window as any).FB.init({ appId: META_APP_ID, autoLogAppEvents: true, xfbml: false, version: 'v21.0' });
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Meta SDK'));
    document.body.appendChild(script);
  });
  return fbSdkPromise;
}

export interface WhatsAppSignupResult {
  code: string;
  phoneNumberId: string;
  businessId: string | null;
}

/** WhatsApp's own Embedded Signup carries `phone_number_id`/`waba_id`/
 *  `business_id` on a SEPARATE `window.postMessage` event
 *  (`WA_EMBEDDED_SIGNUP`) from the `code` FB.login's own callback returns —
 *  Meta's documented flow requires listening for both and joining them by
 *  time, there's no single response object with everything in it. */
function waitForEmbeddedSignupMessage(timeoutMs = 60_000): Promise<{ phoneNumberId: string; businessId: string | null }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('Timed out waiting for WhatsApp Embedded Signup to complete'));
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') return;
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'WA_EMBEDDED_SIGNUP' || data.event !== 'FINALIZE') return;
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        resolve({
          phoneNumberId: data.data?.phone_number_id ?? '',
          businessId: data.data?.business_id ?? null,
        });
      } catch {
        // Not our message shape — ignore, keep listening.
      }
    }
    window.addEventListener('message', onMessage);
  });
}

/** Drives the whole "Connect WhatsApp" click: loads the SDK once, opens
 *  Meta's real Embedded Signup popup, and resolves with exactly the fields
 *  `apiConnectWhatsApp` needs. Never touches credentials/tokens itself —
 *  the backend exchanges `code` for a real access token server-side and
 *  independently re-verifies it actually has access to `phoneNumberId`
 *  before trusting anything the popup claimed (see StoreIntegrationsService.
 *  connectWhatsApp's Phase 8 security note) — this hook only relays what the
 *  popup returned, it is not itself a trust boundary. */
export function useWhatsAppEmbeddedSignup() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const resolvedRef = useRef<{ phoneNumberId: string; businessId: string | null } | null>(null);

  async function connect(): Promise<WhatsAppSignupResult | null> {
    if (!isMetaConfigured()) {
      setError('WhatsApp connect is not configured in this environment yet.');
      return null;
    }
    setConnecting(true);
    setError('');
    resolvedRef.current = null;
    try {
      await loadFacebookSdk();
      const messagePromise = waitForEmbeddedSignupMessage();

      const loginResponse = await new Promise<any>((resolve) => {
        (window as any).FB.login(
          (response: any) => resolve(response),
          {
            config_id: undefined, // set once a WhatsApp Embedded Signup configuration exists in Meta Business Manager
            response_type: 'code',
            override_default_response_type: true,
            extras: { feature: 'whatsapp_embedded_signup', sessionInfoVersion: 3 },
          },
        );
      });

      if (loginResponse?.authResponse?.code) {
        resolvedRef.current = await messagePromise;
      }

      const code = loginResponse?.authResponse?.code;
      if (!code || !resolvedRef.current?.phoneNumberId) {
        setError('WhatsApp connection was cancelled or did not complete.');
        return null;
      }
      return { code, phoneNumberId: resolvedRef.current.phoneNumberId, businessId: resolvedRef.current.businessId };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start WhatsApp connect.');
      return null;
    } finally {
      setConnecting(false);
    }
  }

  return { connect, connecting, error };
}
