import { AlertTriangle, Info, Lock } from 'lucide-react';
import { PasswordToggleButton } from './PasswordField';
import { useAuthGateForm } from '@/hooks/auth/useAuthGateForm';
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
//
// A storefront theme that ships its own prompt (NewThemeImpl.AuthGateModal)
// flips `themed` on while it is mounted; this platform version then steps aside.
export function AuthGateModal() {
  const { themed } = useAuthGate();
  const { pending, close, goRegister, form, submitting, submitError, showPass, setShowPass, social } = useAuthGateForm();
  const { values, errors, set, blur, handleSubmit } = form;

  if (!pending || themed) return null;

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
            type={showPass ? 'text' : 'password'}
            rightIcon={<PasswordToggleButton visible={showPass} onToggle={() => setShowPass(v => !v)} />}
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
            onClick={goRegister}
            className="text-[12px] font-medium text-brand-orange bg-transparent border-none cursor-pointer p-0 hover:text-brand-deep-orange transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>
    </Modal>
  );
}
