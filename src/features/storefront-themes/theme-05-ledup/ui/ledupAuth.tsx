import { useEffect, useRef, useState, type ClipboardEvent, type CSSProperties, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import PhoneInputWithCountrySelect, { isSupportedCountry, type Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { apiForgotPassword, apiResendOtp } from '@/api/services/auth';
import type { SocialProviderKey } from '@/api/services/customerSocialLogin';
import { useToast } from '@/contexts/ToastContext';
import { OTP_LENGTH } from '../../core/auth/authLinks';
import { ledupTheme as t } from '../theme.config';
import { Field, TextInput } from './ledupForm';
import { ledupControlStyle } from './ledupStylePort';
import { LedupBox, LedupBreadcrumbs } from './ledupUiPort';

/** Page frame for the customer pages: breadcrumb, big title, then the panels. */
export function LedupPageFrame({ crumb, title, children, narrow }: { crumb: string; title: string; children: ReactNode; narrow?: boolean }) {
  return (
    <LedupBox narrow={narrow}>
      <div className="ld-copper-gradient mb-6 rounded-[28px] px-6 py-8 md:px-10 md:py-10">
        <LedupBreadcrumbs onDark items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: crumb }]} />
        <h1 className="m-0 text-[clamp(26px,3.6vw,40px)] font-semibold leading-tight text-white" style={{ fontFamily: t.fonts.display }}>{title}</h1>
      </div>
      {children}
    </LedupBox>
  );
}

/** Soft-blue panel with its own heading, as in the design's login page. */
export function LedupPanel({ heading, intro, children, className = '' }: { heading?: string; intro?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`p-6 md:p-9 ${className}`} style={{ background: t.colors.bgAlt, borderRadius: t.cardRadiusPx }}>
      {heading && <h2 className="m-0 text-xl font-semibold" style={{ fontFamily: t.fonts.display }}>{heading}</h2>}
      {intro && <p className="m-0 mt-3 text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>{intro}</p>}
      <div className={heading || intro ? 'mt-6' : ''}>{children}</div>
    </section>
  );
}

/** Password box with its own show/hide eye (each box toggles independently). */
export function LedupPasswordInput({ invalid, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextInput {...rest} invalid={invalid} type={show ? 'text' : 'password'} style={{ paddingInlineEnd: 48 }} />
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? ts('auth.hidePassword', 'Hide password') : ts('auth.showPassword', 'Show password')} aria-pressed={show}
        className="absolute inset-y-0 end-0 flex w-12 cursor-pointer items-center justify-center border-0 bg-transparent" style={{ color: t.colors.inkMuted }}>
        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}

/** Phone field: country picker + number in one control. Emits E.164. `defaultCountry` only seeds the first flag. */
export function LedupPhoneField({ label = ts('checkout.phoneNumber', 'Phone number'), value, onChange, defaultCountry, error, required, disabled, name }: {
  label?: string; value: string; onChange: (value: string) => void; defaultCountry?: string | null; error?: string | null; required?: boolean; disabled?: boolean; name?: string;
}) {
  const seed: Country | undefined = defaultCountry && isSupportedCountry(defaultCountry) ? (defaultCountry as Country) : undefined;
  return (
    <Field label={label} required={required} error={error}>
      {p => (
        <PhoneInputWithCountrySelect id={p.id} name={name} international defaultCountry={seed} value={value || undefined} onChange={v => onChange(v ?? '')}
          placeholder={ts('pg.enter_your_phone_number', 'Enter your phone number')} disabled={disabled} autoComplete="tel" aria-invalid={p['aria-invalid']} aria-describedby={p['aria-describedby']}
          style={{ ...ledupControlStyle(p['aria-invalid']), display: 'flex', alignItems: 'center', gap: 8, '--PhoneInputCountrySelectArrow-color': t.colors.inkMuted } as CSSProperties}
          numberInputProps={{ required, style: { border: 'none', outline: 'none', background: 'transparent', padding: 0, minWidth: 0, fontFamily: t.fonts.body, fontSize: 14, color: t.colors.ink } }} />
      )}
    </Field>
  );
}

/** Six single-digit boxes: auto-advance, backspace/arrow navigation, paste of the whole code. */
export function LedupOtpBoxes({ values, onChange, invalid }: { values: string[]; onChange: (i: number, v: string) => void; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const change = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    onChange(i, val);
    if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };
  const keyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };
  const paste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    pasted.split('').forEach((ch, i) => onChange(i, ch));
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };
  return (
    <div role="group" aria-label={ts('otp.codeAria', '{{count}}-digit verification code', { count: OTP_LENGTH })} className="flex justify-center gap-2" dir="ltr">
      {values.map((val, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} aria-label={ts('otp.digitAria', 'Digit {{n}} of {{total}}', { n: i + 1, total: OTP_LENGTH })} aria-invalid={invalid || undefined}
          type="text" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1} value={val}
          onChange={e => change(i, e.target.value)} onKeyDown={e => keyDown(i, e)} onPaste={paste}
          className="text-center font-semibold" style={{ ...ledupControlStyle(invalid), width: 'clamp(40px, 12vw, 52px)', minHeight: 56, padding: 0, fontSize: 20, background: t.colors.bg, borderColor: val ? t.colors.accent : undefined }} />
      ))}
    </div>
  );
}

const WAIT = 59;

/** "Resend in 59s" then "Resend code". A forgot-password code is resent through the forgot-password endpoint. */
export function LedupResendTimer({ email, storeId, isForgot }: { email: string; storeId?: string; isForgot: boolean }) {
  const toast = useToast();
  const [seconds, setSeconds] = useState(WAIT);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => (s <= 1 ? (clearInterval(timer), 0) : s - 1)), 1000);
    return () => clearInterval(timer);
  }, [round]);
  const resend = async () => {
    setSending(true); setError('');
    try {
      if (isForgot) await apiForgotPassword({ email, role: 'user', storeId });
      else await apiResendOtp({ email, role: 'user', storeId });
      setSeconds(WAIT); setRound(r => r + 1);
      toast.success(ts('otp.resent', 'Code resent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : ts('otp.err.resend', 'Failed to resend code.'));
    } finally { setSending(false); }
  };
  if (seconds > 0) return <span className="text-sm" style={{ color: t.colors.inkMuted }}>{ts('auth.resendIn', 'Resend code in {{seconds}}s', { seconds })}</span>;
  return (
    <span className="flex flex-col items-center gap-1">
      <button type="button" onClick={resend} disabled={sending} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold underline disabled:opacity-50" style={{ color: t.colors.accent }}>{sending ? ts('otp.sending', 'Sending...') : ts('otp.resend', 'Resend code')}</button>
      {error && <span role="alert" className="text-[13px]" style={{ color: t.colors.danger }}>{error}</span>}
    </span>
  );
}

function GoogleMark() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
function FacebookMark() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.52c-1.49 0-1.96.93-1.96 1.88V12h3.34l-.53 3.47h-2.81v8.38A12 12 0 0 0 24 12Z" />
    </svg>
  );
}

/** "Continue with Google / Facebook" buttons under a divider. Renders nothing when the store connected no provider. */
export function LedupSocialSignIn({ providers, onStart, loading, disabled, dividerText }: { providers: SocialProviderKey[]; onStart: (p: SocialProviderKey) => void; loading: boolean; disabled?: boolean; dividerText: string }) {
  if (providers.length === 0) return null;
  const blocked = disabled || loading;
  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3" role="separator">
        <div className="h-px flex-1" style={{ background: t.colors.border }} />
        <span className="text-xs" style={{ color: t.colors.inkMuted }}>{dividerText}</span>
        <div className="h-px flex-1" style={{ background: t.colors.border }} />
      </div>
      <div className="flex flex-col gap-2.5" aria-busy={loading || undefined}>
        {providers.map(p => (
          <button key={p} type="button" disabled={blocked} onClick={() => onStart(p)} className="tx-btn tx-btn-block"
            style={{ background: t.colors.bg, color: t.colors.ink, borderColor: t.colors.borderStrong, borderRadius: t.buttonRadiusPx, opacity: blocked ? 0.6 : 1 }}>
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : p === 'google' ? <GoogleMark /> : <FacebookMark />}
            {ts('pg.continue_with_provider', 'Continue with {{provider}}', { provider: p === 'google' ? 'Google' : 'Facebook' })}
          </button>
        ))}
      </div>
    </div>
  );
}

export const PhoneField = LedupPhoneField;
