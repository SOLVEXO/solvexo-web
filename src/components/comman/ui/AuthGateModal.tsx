import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Info, Lock } from 'lucide-react';
import { apiLogin, TokenStorage, LastRolePreference, type AppRole } from '@/api/services/auth';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { SocialLoginRow } from './SocialIcons';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

// Renders the "sign in to continue" prompt whenever a guest-only action
// (add to cart, wishlist, follow, message) gets gated by useAuthGate(). Signs
// in without ever navigating away — the gated action itself carries the user
// back to what they were doing, so browsing position is never lost and the
// intended action is never silently dropped.
export function AuthGateModal() {
  const navigate = useNavigate();
  const { pending, cancel, resolve } = useAuthGate();
  // Buyer-only surface (cart/wishlist/follow/message gate) — matches the
  // hardcoded role: 'user' in the email/password submit below. useSocialLogin
  // defaults to 'seller' for the (now seller-only) main LoginPage, so this
  // needs the buyer role explicitly.
  const social = useSocialLogin('user');

  // Local rather than reusing useLogin()'s loading/error — useLogin() also
  // navigates on success, which is exactly the "lose your position" behavior
  // this modal exists to avoid, so the submit here is handled by hand instead.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { values, errors, set, blur, handleSubmit, reset } = useForm<LoginFormData>(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        setSubmitError('');
        setSubmitting(true);
        try {
          const res = await apiLogin({ email: data.email, password: data.password, role: 'user' });
          const { token, user } = res.data;
          TokenStorage.save(token.accessToken, token.refreshToken);
          TokenStorage.saveUser(user);
          LastRolePreference.set((user.role ?? 'user') as AppRole);
          reset();
          resolve();
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
        } finally {
          setSubmitting(false);
        }
      },
    },
  );

  if (!pending) return null;

  const close = () => {
    cancel();
    reset();
    setSubmitError('');
  };

  return (
    <Modal title="Sign in to continue" onClose={close} width={400}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] bg-brand-pale-orange">
          <span className="flex items-center justify-center size-9 rounded-full bg-white shrink-0">
            <Lock size={16} className="text-brand-orange" />
          </span>
          <p className="text-[12.5px] text-charcoal leading-[1.5]">{pending.reason}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <Input
            type="email"
            placeholder="Email address"
            value={values.email}
            onChange={set('email')}
            onBlur={blur('email')}
            error={errors.email}
            autoComplete="email"
            autoFocus
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

          {submitError && (
            <p className="text-[11.5px] text-error flex items-center gap-1"><AlertTriangle size={12} className="shrink-0" /> {submitError}</p>
          )}

          <Button type="submit" variant="primary" size="md" pill fullWidth loading={submitting} className="justify-center mt-1">
            Sign In
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-bone" />
          <span className="text-[10px] text-slate whitespace-nowrap">or continue with</span>
          <div className="flex-1 h-px bg-bone" />
        </div>
        <SocialLoginRow mount={social.mount} disabled={submitting} />
        {social.error && (
          <p className="text-[11.5px] text-info flex items-start gap-1">
            <Info size={12} className="shrink-0 mt-[1px]" /> {social.error}
          </p>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-bone -mx-5 px-5 -mb-4 pb-4">
          <button
            type="button"
            onClick={close}
            className="text-[12px] font-medium text-slate bg-transparent border-none cursor-pointer p-0 hover:text-charcoal transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { close(); navigate('/register'); }}
            className="text-[12px] font-medium text-brand-orange bg-transparent border-none cursor-pointer p-0 hover:text-brand-deep-orange transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>
    </Modal>
  );
}
