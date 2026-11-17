import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, User, LogOut } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { apiLogin, TokenStorage, LastRolePreference, type AppRole } from '@/api/services/auth';
import { useLogout } from '@/hooks/auth/useLogout';
import { getCurrentStorefrontStoreId } from '@/utils/currentStorefront';

/** Header account popover: sign in without leaving the page, or jump to the account when already signed in. */
export function LedupAuthPopover({ isOpen, onClose, inline = false }: { isOpen: boolean; onClose: () => void; /** Drawn in the flow (mobile menu) instead of floating under the header. */ inline?: boolean }) {
  const logout = useLogout();
  const [signedIn, setSignedIn] = useState(() => TokenStorage.isLoggedIn());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-read the session each time the popover opens
    setSignedIn(TokenStorage.isLoggedIn());
    const onDown = (e: MouseEvent) => {
      if (inline) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, inline]);

  if (!isOpen) return null;

  const user = signedIn ? TokenStorage.getUser<{ name?: string; email?: string }>() : null;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin({ email, password, role: 'user', storeId: getCurrentStorefrontStoreId() });
      const { token, user: u } = res.data;
      TokenStorage.save(token.accessToken, token.refreshToken);
      TokenStorage.saveUser(u);
      LastRolePreference.set((u.role ?? 'user') as AppRole);
      setPassword('');
      setSignedIn(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : ts('ld.invalidCredentials', 'Invalid credentials. Check your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout('/');
    setSignedIn(false);
  };

  const row = 'flex items-center justify-between rounded-lg px-2 py-2 text-sm text-stone-700 no-underline transition hover:bg-stone-50 hover:text-stone-900';
  const input = 'h-10 w-full rounded-[10px] border border-[#e6e3e0] bg-white px-3 text-[13px] text-[#4b423b] placeholder:text-stone-400 focus:border-[#9b8b80] focus:outline-none';

  return (
    <div ref={popoverRef} className={inline ? 'ld-pop mt-3 w-full text-[#4b423b]' : 'ld-pop absolute end-0 top-full z-50 mt-3 w-[250px] rounded-2xl bg-white p-3 text-[#4b423b] shadow-[0_8px_30px_rgba(75,66,59,.14)]'}>
      {signedIn ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-700"><User size={20} aria-hidden /></div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">{user?.name || user?.email}</p>
              {user?.name && <p className="truncate text-xs text-stone-500"><bdi>{user.email}</bdi></p>}
            </div>
          </div>
          <Link to="/account" onClick={onClose} className={row}>{ts('nav.account', 'Account')}</Link>
          <Link to="/orders" onClick={onClose} className={row}>{ts('account.orders', 'Orders')}</Link>
          <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 py-2.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900">
            <LogOut size={14} aria-hidden /> {ts('account.logout', 'Log out')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-3 text-start">
          {error && <div role="alert" className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
          <div>
            <label htmlFor="ld-pop-email" className="mb-1 block text-xs font-medium text-stone-600">{ts('auth.email', 'Email')}</label>
            <input id="ld-pop-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className={input} />
          </div>
          <div>
            <label htmlFor="ld-pop-pass" className="mb-1 block text-xs font-medium text-stone-600">{ts('auth.password', 'Password')}</label>
            <div className="relative">
              <input id="ld-pop-pass" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className={`${input} pe-10`} />
              <button type="button" aria-label={showPassword ? ts('auth.hidePassword', 'Hide password') : ts('auth.showPassword', 'Show password')} onClick={() => setShowPassword(s => !s)} className="absolute end-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex h-9 w-full cursor-pointer items-center justify-center rounded-full border-0 bg-[#9b8b80] text-sm font-medium text-white transition hover:bg-[#4b423b] disabled:opacity-50">
            {loading ? ts('auth.signingIn', 'Signing in…') : ts('auth.signIn', 'Sign in')}
          </button>
          <div className="flex flex-col items-center gap-1 text-xs text-[#8c847e]">
            <Link to="/forgot-password" onClick={onClose} className="underline hover:text-[#4b423b]">{ts('auth.forgotPassword', 'Forgot your password?')}</Link>
            <Link to="/register" onClick={onClose} className="underline hover:text-[#4b423b]">{ts('auth.createAccount', 'Create account')}</Link>
          </div>
        </form>
      )}
    </div>
  );
}
