import { useNavigate } from 'react-router-dom';
import { TokenStorage, apiLogout } from '@/api/services/auth';

/** Shared by ProfileAvatar and the Seller/Store/Admin dashboard sidebars. */
export function useLogout() {
  const navigate = useNavigate();

  // Admin has its own login route, so its sidebar passes '/admin/login'
  // instead of the default '/' (public homepage) that buyer/seller land on.
  return async (redirectTo: string = '/') => {
    try { await apiLogout(); } catch { /* best-effort — clear local session regardless */ }
    TokenStorage.clear();
    navigate(redirectTo);
    window.location.reload();
  };
}
