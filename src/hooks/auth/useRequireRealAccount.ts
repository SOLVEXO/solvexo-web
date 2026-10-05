import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isGuestUser } from '@/api/services/auth';

/**
 * Account-area pages (orders, addresses, loyalty, wishlist, ...) need a real account. A guest-checkout session
 * has no email/password, so those pages would be half-broken for it — send it to /login and bring it back after.
 * Returns true while a guest is being redirected.
 */
export function useRequireRealAccount(): boolean {
  const navigate = useNavigate();
  const location = useLocation();
  const guest = isGuestUser();
  useEffect(() => {
    if (guest) navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
  }, [guest, navigate, location.pathname, location.search]);
  return guest;
}
