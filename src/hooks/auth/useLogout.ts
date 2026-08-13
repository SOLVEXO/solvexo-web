import { useNavigate } from 'react-router-dom';
import { TokenStorage, apiLogout } from '@/api/services/auth';
import { useToast } from '@/contexts/ToastContext';

/** Shared by ProfileAvatar and the Seller/Store/Admin dashboard sidebars. */
export function useLogout() {
  const navigate = useNavigate();
  const toast = useToast();

  // Admin has its own login route, so its sidebar passes '/admin/login'
  // instead of the default '/' (public homepage) that buyer/seller land on.
  return async (redirectTo: string = '/') => {
    try { await apiLogout(); } catch { /* best-effort — clear local session regardless */ }
    TokenStorage.clear();
    toast.success('Logged out');
    navigate(redirectTo);
    // Give the toast a beat to actually paint before the reload wipes it.
    setTimeout(() => window.location.reload(), 400);
  };
}
