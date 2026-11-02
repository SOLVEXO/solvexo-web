import { Eye, EyeOff, Lock } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useAuthGateForm } from '@/hooks/auth/useAuthGateForm';
import { SocialLoginRow } from '@/components/comman/ui/SocialIcons';
import { fashionTheme as t } from '../theme.config';
import { Dialog } from '../ui/Dialog';
import { Notice, PillButton, TextInput } from '../ui/primitives';

const WIDTHS = { compact: 440, standard: 500, large: 580 } as const;

/** Maison's own "sign in to continue" pop-up (opened when a guest taps wishlist / follow / message ...). Looks and sizes follow the theme; the seller can change the heading, button text, width and social buttons in Theme Settings -> Login popup. */
export function FashionAuthGateModal() {
  const { pending, close, goRegister, form, submitting, submitError, showPass, setShowPass, social } = useAuthGateForm();
  const { values, errors, set, blur, handleSubmit } = form;
  if (!pending) return null;
  const cfg = t.authGate;
  const title = cfg.title || ts('pg.auth_gate_title', 'Sign in to continue');
  const button = cfg.button || ts('auth.signInBtn', 'Sign In');

  return (
    <Dialog title={title} size={WIDTHS[cfg.size]} onClose={close}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5" style={{ background: t.colors.bgAlt }}>
          <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: t.colors.bg, color: t.colors.accent }}><Lock size={17} aria-hidden /></span>
          <p className="m-0 text-sm leading-relaxed" style={{ color: t.colors.ink }}>{pending.reason}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <TextInput type="email" placeholder={ts('auth.email', 'Email')} value={values.email} onChange={set('email')} onBlur={blur('email')} invalid={!!errors.email} autoComplete="email" autoFocus aria-label={ts('auth.email', 'Email')} />
          {errors.email && <p className="m-0 -mt-1 text-xs" style={{ color: t.colors.danger }}>{errors.email}</p>}
          <div className="relative">
            <TextInput type={showPass ? 'text' : 'password'} placeholder={ts('auth.password', 'Password')} value={values.password} onChange={set('password')} onBlur={blur('password')} invalid={!!errors.password} autoComplete="current-password" aria-label={ts('auth.password', 'Password')} style={{ paddingRight: 46 }} />
            <button type="button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? ts('pg.hide_password', 'Hide password') : ts('pg.show_password', 'Show password')} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent" style={{ color: t.colors.inkMuted }}>
              {showPass ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
            </button>
          </div>
          {errors.password && <p className="m-0 -mt-1 text-xs" style={{ color: t.colors.danger }}>{errors.password}</p>}
          {submitError && <Notice tone="error">{submitError}</Notice>}
          <PillButton type="submit" full loading={submitting}>{button}</PillButton>
        </form>

        {cfg.social && (
          <>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1" style={{ background: t.colors.border }} />
              <span className="text-xs" style={{ color: t.colors.inkMuted }}>{ts('pg.or_continue_with', 'or continue with')}</span>
              <span className="h-px flex-1" style={{ background: t.colors.border }} />
            </div>
            <SocialLoginRow mount={social.mount} disabled={submitting} />
            {social.error && <Notice tone="info">{social.error}</Notice>}
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={close} className="cursor-pointer border-0 bg-transparent p-0 text-sm" style={{ color: t.colors.inkMuted }}>{ts('common.cancel', 'Cancel')}</button>
          <button type="button" onClick={goRegister} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold" style={{ color: t.colors.accent }}>{ts('auth.createAccountBtn', 'Create Account')}</button>
        </div>
      </div>
    </Dialog>
  );
}
