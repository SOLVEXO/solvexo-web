/* eslint-disable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions -- the pop-up opens from a user action and focus moves to its first field; the backdrop click is a mouse shortcut, Esc and the close button are the keyboard paths */
import { useEffect } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useAuthGateForm } from '@/hooks/auth/useAuthGateForm';
import { SocialLoginRow } from '@/components/comman/ui/SocialIcons';
import { ledupTheme as t } from '../theme.config';

/** "Sign in to continue" pop-up (opened when a guest taps wishlist / follow / message ...). Only visible while a gated action is pending. */
export function LedupAuthGateModal() {
  const { pending, close, goRegister, form, submitting, submitError, showPass, setShowPass, social } = useAuthGateForm();
  const { values, errors, set, blur, handleSubmit } = form;

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending, close]);

  if (!pending) return null;
  const input = 'w-full rounded-full border border-stone-300 bg-stone-50/50 px-5 py-3 text-sm text-stone-900 focus:border-[#8C7355] focus:outline-none';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div role="dialog" aria-modal="true" aria-label={ts('pg.auth_gate_title', 'Sign in to continue')} className="ld-pop relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <button type="button" onClick={close} aria-label={ts('common.close', 'Close')} className="absolute end-4 top-4 cursor-pointer border-0 bg-transparent p-1 text-stone-400 hover:text-stone-700"><X size={18} aria-hidden /></button>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8C7355]/10 text-[#8C7355]"><Lock size={24} aria-hidden /></div>
        <h2 className="mb-2 text-center text-xl font-bold text-stone-900" style={{ fontFamily: t.fonts.display }}>{ts('pg.auth_gate_title', 'Sign in to continue')}</h2>
        {pending.reason && <p className="mb-6 text-center text-sm text-stone-500">{pending.reason}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="email" autoFocus autoComplete="email" placeholder={ts('auth.email', 'Email')} aria-label={ts('auth.email', 'Email')} value={values.email} onChange={set('email')} onBlur={blur('email')} className={input} />
          {errors.email && <p className="m-0 -mt-1 text-xs text-red-600">{errors.email}</p>}
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} autoComplete="current-password" placeholder={ts('auth.password', 'Password')} aria-label={ts('auth.password', 'Password')} value={values.password} onChange={set('password')} onBlur={blur('password')} className={`${input} pe-12`} />
            <button type="button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? ts('pg.hide_password', 'Hide password') : ts('pg.show_password', 'Show password')} className="absolute end-3 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-1 text-stone-400 hover:text-stone-600">
              {showPass ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
            </button>
          </div>
          {errors.password && <p className="m-0 -mt-1 text-xs text-red-600">{errors.password}</p>}
          {submitError && <p role="alert" className="m-0 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{submitError}</p>}
          <button type="submit" disabled={submitting} className="mt-1 flex h-12 w-full cursor-pointer items-center justify-center rounded-full border-0 bg-[#8C7355] text-sm font-medium text-white transition hover:bg-[#796247] disabled:opacity-50">
            {submitting ? ts('auth.signingIn', 'Signing in…') : ts('auth.signInBtn', 'Sign In')}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" />{ts('pg.or_continue_with', 'or continue with')}<span className="h-px flex-1 bg-stone-200" /></div>
        <SocialLoginRow mount={social.mount} disabled={submitting} />
        {social.error && <p className="mt-2 text-xs text-stone-500">{social.error}</p>}

        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={close} className="cursor-pointer border-0 bg-transparent p-0 text-sm text-stone-500">{ts('common.cancel', 'Cancel')}</button>
          <button type="button" onClick={goRegister} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-[#8C7355]">{ts('auth.createAccountBtn', 'Create Account')}</button>
        </div>
      </div>
    </div>
  );
}
