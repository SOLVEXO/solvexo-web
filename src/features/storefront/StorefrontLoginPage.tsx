import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLogin } from '@/hooks/auth/useLogin';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { Input } from '@/components/comman/ui/Input';
import { Button } from '@/components/comman/ui/Button';
import { useStorefront } from './StorefrontContext';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

// A store's own sign-in — no marketplace branding, no buyer/seller toggle
// (a storefront login is always a buyer), no RememberedAccount picker.
// On success, lands back on this same store's subdomain (never an apex-app
// path like /account/dashboard, which doesn't exist in this router tree).
export function StorefrontLoginPage() {
  usePageTitle('Sign In');
  const { store } = useStorefront();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirect')) ?? '/';
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.execute({ email, password, role: 'user' }, redirectTo);
  };

  return (
    <div className="max-w-[400px] mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-7">
        <p className="text-[20px] font-bold text-carbon">Sign in to {store.name}</p>
        <p className="text-[13px] text-slate mt-1">Track orders, save your details, and check out faster.</p>
      </div>

      {login.error && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-error-border bg-error-bg px-4 py-3">
          <AlertTriangle size={14} className="text-error shrink-0" />
          <span className="text-[13px] text-error">{login.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white border border-bone rounded-2xl p-6">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          rightIcon={
            <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="text-slate cursor-pointer">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />
        <Button type="submit" variant="primary" fullWidth loading={login.loading}>
          Sign In
        </Button>
      </form>
    </div>
  );
}
