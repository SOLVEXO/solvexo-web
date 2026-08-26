import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRegister } from '@/hooks/auth/useRegister';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { Input } from '@/components/comman/ui/Input';
import { Button } from '@/components/comman/ui/Button';
import { useStorefront } from './StorefrontContext';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

// A store's own sign-up — creates an account scoped to THIS store
// (`storeId`), a genuinely separate identity from the same email registered
// at any other store or on the apex (see User.storeId). Mirrors
// StorefrontLoginPage's minimal, no-branding style.
export function StorefrontRegisterPage() {
  usePageTitle('Create Account');
  const { store } = useStorefront();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirect')) ?? '/';
  const register = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.execute({ name, email, password, phone, address, role: 'user', storeId: store.storeId });
  };

  return (
    <div className="max-w-[400px] mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-7">
        <p className="text-[20px] font-bold text-carbon">Create your {store.name} account</p>
        <p className="text-[13px] text-slate mt-1">Track orders, save your details, and check out faster.</p>
      </div>

      {register.error && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-error-border bg-error-bg px-4 py-3">
          <AlertTriangle size={14} className="text-error shrink-0" />
          <span className="text-[13px] text-error">{register.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white border border-bone rounded-2xl p-6">
        <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" required />
        <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} autoComplete="street-address" required />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          rightIcon={
            <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="text-slate cursor-pointer">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />
        <Button type="submit" variant="primary" fullWidth loading={register.loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-[13px] text-slate mt-4">
        Already have an account? <a href={`login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-brand-orange font-semibold no-underline">Sign in</a>
      </p>
    </div>
  );
}
