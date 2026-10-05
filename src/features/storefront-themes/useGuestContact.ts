import { useCallback, useEffect, useRef, useState } from 'react';
import { apiSetGuestContact, isGuestUser, TokenStorage } from '@/api/services/auth';
import { ensureGuestSession } from '@/utils/guestSession';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Session state for a checkout page. Starts a guest session silently when there is none and the store allows it.
 *  `denied` = no session and none could be started (store requires accounts) -> the page sends the buyer to /login. */
export function useCheckoutSession() {
  const [, bump] = useState(0);
  const [preparing, setPreparing] = useState(() => !TokenStorage.isLoggedIn());
  const [denied, setDenied] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (TokenStorage.isLoggedIn()) { setPreparing(false); return; }
    if (started.current) return;
    started.current = true;
    void ensureGuestSession().then(ok => {
      if (!ok) setDenied(true);
      setPreparing(false);
      bump(n => n + 1); // cookies changed outside React state — re-read them
    });
  }, []);

  const loggedIn = TokenStorage.isLoggedIn();
  return { loggedIn, guest: loggedIn && isGuestUser(), preparing, denied };
}

/** Email the guest checks out with (Shopify "Contact" step). `commit` pushes it to the backend only when changed. */
export function useGuestContact(active: boolean) {
  const [email, setEmail] = useState(() => (active ? (TokenStorage.getUser<{ email?: string | null }>()?.email ?? '') : ''));
  const [committed, setCommitted] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inFlight = useRef<Promise<boolean> | null>(null);

  const trimmed = email.trim();
  const valid = EMAIL_RE.test(trimmed);
  const dirty = active && trimmed !== committed;

  const commit = useCallback(async (name?: string): Promise<boolean> => {
    if (!active) return true;
    if (!EMAIL_RE.test(trimmed)) { setError('Enter a valid email address.'); return false; }
    if (trimmed === committed) return true;
    if (inFlight.current) return inFlight.current;
    setSaving(true); setError('');
    const p = apiSetGuestContact({ email: trimmed, ...(name?.trim() ? { name: name.trim() } : {}) })
      .then(() => { setCommitted(trimmed); return true; })
      .catch(err => { setError(err instanceof Error ? err.message : 'Could not save your email.'); return false; })
      .finally(() => { setSaving(false); inFlight.current = null; });
    inFlight.current = p;
    return p;
  }, [active, trimmed, committed]);

  return { email, setEmail, valid, dirty, saving, error, setError, commit, committedEmail: committed };
}
