import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, User, ShoppingBag, Heart, MessageSquare,
} from 'lucide-react';
import { useLogin } from '@/hooks/auth/useLogin';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { Input } from './Input';
import { Button } from './Button';

/* ── Minimal inline brand marks — same simplified style used across auth ────── */
function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
function AppleGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      <path d="M14.044 9.52c-.02-2.22 1.815-3.293 1.897-3.348-1.033-1.511-2.638-1.718-3.207-1.736-1.363-.14-2.665.806-3.354.806-.69 0-1.755-.788-2.885-.766-1.482.022-2.853.866-3.614 2.197-1.54 2.674-.395 6.633 1.107 8.8.737 1.062 1.61 2.253 2.758 2.21 1.11-.044 1.527-.714 2.868-.714 1.34 0 1.713.714 2.884.69 1.193-.02 1.946-1.082 2.677-2.147.845-1.23 1.19-2.42 1.208-2.482-.027-.012-2.316-.888-2.339-3.51ZM11.78 3.06c.613-.742 1.026-1.773.912-2.8-.883.035-1.95.587-2.582 1.33-.567.655-1.063 1.703-.93 2.707 1 .077 2.02-.508 2.6-1.237Z" fill="#141413"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      <rect width="18" height="18" rx="4" fill="#1877F2"/>
      <path d="M12.25 11.5l.375-2.5H10.25V7.5c0-.694.344-1.25 1.313-1.25H12.75V4.062S11.875 3.75 10.938 3.75c-1.875 0-3.063 1.156-3.063 3.25V9H5.75v2.5H7.875V18h2.375v-6.5h2Z" fill="white"/>
    </svg>
  );
}

type Provider = 'google' | 'apple' | 'facebook';
const SOCIALS: { Icon: () => React.JSX.Element; label: string; provider: Provider }[] = [
  { Icon: GoogleIcon,   label: 'Google',   provider: 'google'   },
  { Icon: AppleGlyph,   label: 'Apple',    provider: 'apple'    },
  { Icon: FacebookIcon, label: 'Facebook', provider: 'facebook' },
];

const QUICK_LINKS = [
  { Icon: ShoppingBag,   label: 'Orders'   },
  { Icon: Heart,         label: 'Wishlist' },
  { Icon: MessageSquare, label: 'Messages' },
];

// Alibaba-style hover preview: hovering "Sign In" opens a quick-login panel
// (desktop only — touch devices have no hover, so mobile keeps the plain link).
// Closes only on an actual outside click, never on mouse-leave — a validation
// message appearing while typing shifts the panel's layout under the cursor,
// which used to fire a spurious mouseleave and close the panel mid-keystroke.
export function SignInPreview() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(true);

  const login  = useLogin();
  const social = useSocialLogin();

  const { values, errors, set, blur, handleSubmit } = useForm(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        await login.execute({ email: data.email, password: data.password, role: 'user' });
      },
    },
  );

  const openNow = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative hidden md:block" onMouseEnter={openNow}>
      <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
        Sign In
      </Button>

      {open && (
        <div className="dropdown-enter absolute right-0 top-[calc(100%+10px)] z-[100] w-[320px] max-w-[calc(100vw-2rem)] bg-white border border-bone rounded-[18px] overflow-hidden">

          {/* Header — avatar + welcome */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 bg-gradient-to-br from-cream to-white border-b border-bone">
            <div className="w-11 h-11 rounded-full bg-brand-pale-orange border-2 border-white flex items-center justify-center shrink-0">
              <User size={19} className="text-brand-deep-orange" />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-carbon leading-tight">Welcome to Solvexo</p>
              <p className="text-[11px] text-slate mt-[2px]">Sign in to unlock your account</p>
            </div>
          </div>

          {/* Quick account links — preview of what's behind sign-in */}
          <div className="grid grid-cols-3 gap-1 px-3 pt-3">
            {QUICK_LINKS.map(({ Icon, label }) => (
              <button
                key={label}
                onClick={() => navigate('/login')}
                className="flex flex-col items-center gap-1 py-2 rounded-[10px] bg-transparent border-none cursor-pointer text-slate hover:bg-cream hover:text-brand-orange transition-colors"
              >
                <Icon size={16} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="h-px bg-bone mx-4 my-3" />

          {/* Mini login form */}
          <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-2.5">
            <Input
              type="email"
              placeholder="Email address"
              value={values.email}
              onChange={set('email')}
              onBlur={blur('email')}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={values.password}
              onChange={set('password')}
              onBlur={blur('password')}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between -mt-1">
              <label className="flex items-center gap-[6px] text-[11px] text-slate cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-[13px] h-[13px] accent-brand-orange cursor-pointer"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[11px] font-medium text-brand-orange bg-transparent border-none cursor-pointer p-0 hover:text-brand-deep-orange transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {login.error && (
              <p className="text-[11px] text-error flex items-center gap-1"><AlertTriangle size={11} className="shrink-0" /> {login.error}</p>
            )}

            <Button type="submit" variant="primary" size="sm" fullWidth loading={login.loading} className="justify-center mt-1">
              Sign In
            </Button>
          </form>

          {/* Social login */}
          <div className="flex items-center gap-2 px-4 my-3">
            <div className="flex-1 h-px bg-bone" />
            <span className="text-[10px] text-slate whitespace-nowrap">or continue with</span>
            <div className="flex-1 h-px bg-bone" />
          </div>
          <div className="flex items-center gap-2 px-4 pb-2">
            {SOCIALS.map(({ Icon, label, provider }) => (
              <button
                key={provider}
                onClick={() => social.notConfigured(provider)}
                aria-label={`Continue with ${label}`}
                title={label}
                className="flex-1 h-9 rounded-[9px] border border-bone bg-white flex items-center justify-center cursor-pointer hover:bg-cream hover:border-slate/30 transition-colors"
              >
                <Icon />
              </button>
            ))}
          </div>

          {social.error && (
            <p className="text-[11px] text-error px-4 pb-3 flex items-start gap-1">
              <AlertTriangle size={11} className="shrink-0 mt-[1px]" /> {social.error}
            </p>
          )}

          {/* Footer */}
          <div className="px-4 pb-4 pt-3 border-t border-bone flex items-center justify-between">
            <button
              onClick={() => navigate('/register')}
              className="text-[11.5px] font-medium text-brand-orange bg-transparent border-none cursor-pointer p-0 hover:text-brand-deep-orange transition-colors"
            >
              Create account
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-[11.5px] font-medium text-slate bg-transparent border-none cursor-pointer p-0 hover:text-charcoal transition-colors flex items-center gap-1"
            >
              Full sign in <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
