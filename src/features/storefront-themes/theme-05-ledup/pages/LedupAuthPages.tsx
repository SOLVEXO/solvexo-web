import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CheckCircle2 } from 'lucide-react';
import { ts, tsNodes } from '@/utils/tStatic';
import { AuthContext } from '@/api/services/auth';
import { useLogin } from '@/hooks/auth/useLogin';
import { useRegister } from '@/hooks/auth/useRegister';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { useStorefrontSocialLogin } from '@/hooks/auth/useStorefrontSocialLogin';
import { useDetectedCountry } from '@/hooks/auth/useDetectedCountry';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { OTP_LENGTH, withRedirect } from '../../core/auth/authLinks';
import { useStoreResetPassword } from '../../core/auth/useStoreResetPassword';
import { Field, Notice, PillButton, TextInput } from '../ui/ledupForm';
import { LedupOtpBoxes, LedupPageFrame, LedupPanel, LedupPasswordInput, LedupPhoneField, LedupResendTimer, LedupSocialSignIn } from '../ui/ledupAuth';
import { WithPageSections } from '../ui/ledupPageSections';
import { ledupTheme as t } from '../theme.config';

const linkStyle = { color: t.colors.accent } as const;

/** Why an account is worth having: every line is something the store really does (checkout, address book, order tracking). */
function Benefits() {
  const items = [ts('auth.benefitCheckout', 'Check out faster'), ts('auth.benefitAddresses', 'Keep more than one address'), ts('auth.benefitTrack', 'Track orders and more')];
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">
      {items.map(i => <li key={i} className="flex items-center gap-2.5"><Check size={15} aria-hidden style={{ color: t.colors.accent }} />{i}</li>)}
    </ul>
  );
}

/** `/login` (`?redirect=`, `?social_code=` / `?social_error=` come back from Google/Facebook). Two panels, like the design: sign in, and why to create an account. */
export function LedupLoginPage() {
  return <WithPageSections pageKey="login"><LoginContent /></WithPageSections>;
}
function LoginContent() {
  useStorefrontSeo({ title: ts('auth.signInLink', 'Sign in'), noindex: true });
  const { store } = useStorefront();
  const [params] = useSearchParams();
  const redirectTo = safeRedirectPath(params.get('redirect')) ?? '/';
  const login = useLogin();
  const social = useStorefrontSocialLogin(store.storeId, redirectTo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const error = login.error || social.error;
  const submit = (e: FormEvent) => { e.preventDefault(); void login.execute({ email: email.trim(), password, role: 'user', storeId: store.storeId }, redirectTo); };
  return (
    <LedupPageFrame crumb={ts('auth.signInLink', 'Sign in')} title={ts('auth.customerLogin', 'Customer login')}>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <LedupPanel heading={ts('auth.registeredCustomers', 'Registered customers')} intro={ts('auth.registeredIntro', 'If you have an account, sign in with your email address.')}>
          {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label={ts('auth.email', 'Email')} required>{p => <TextInput {...p} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />}</Field>
            <Field label={ts('auth.password', 'Password')} required>{p => <LedupPasswordInput {...p} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />}</Field>
            <div className="flex flex-wrap items-center gap-5">
              <PillButton type="submit" loading={login.loading}>{ts('auth.signInLink', 'Sign in')}</PillButton>
              <Link to="/forgot-password" className="text-sm font-medium no-underline hover:underline" style={linkStyle}>{ts('auth.forgotPassword', 'Forgot password?')}</Link>
            </div>
          </form>
          <LedupSocialSignIn providers={social.providers} onStart={social.start} loading={social.loading} disabled={login.loading} dividerText={ts('auth.or', 'or')} />
        </LedupPanel>
        <LedupPanel heading={ts('auth.newCustomer', 'New customer?')} intro={ts('auth.newCustomerIntro', 'Creating an account has many benefits:')}>
          <Benefits />
          <div className="mt-6"><Link to={withRedirect('/register', redirectTo)} className="tx-btn no-underline" style={{ background: t.colors.accent, color: t.colors.accentInk, borderColor: t.colors.accent, borderRadius: t.buttonRadiusPx }}>{ts('auth.createAnAccount', 'Create an account')}</Link></div>
        </LedupPanel>
      </div>
    </LedupPageFrame>
  );
}

/** `/register` (`?redirect=`). Creates an account scoped to THIS store, then continues at /verify-otp. */
export function LedupRegisterPage() {
  return <WithPageSections pageKey="register"><RegisterContent /></WithPageSections>;
}
function RegisterContent() {
  useStorefrontSeo({ title: ts('orders.createAccountBtn', 'Create account'), noindex: true });
  const { store } = useStorefront();
  const [params] = useSearchParams();
  const redirectTo = safeRedirectPath(params.get('redirect')) ?? '/';
  const register = useRegister();
  const social = useStorefrontSocialLogin(store.storeId, redirectTo);
  const country = useDetectedCountry();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [phoneError, setPhoneError] = useState('');
  const set = (patch: Partial<typeof form>) => setForm(f => ({ ...f, ...patch }));
  const error = register.error || social.error;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.phone) { setPhoneError(ts('pg.enter_your_phone_number_2', 'Enter your phone number.')); return; }
    setPhoneError('');
    void register.execute({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone, address: form.address.trim(), role: 'user', storeId: store.storeId });
  };
  return (
    <LedupPageFrame crumb={ts('orders.createAccountBtn', 'Create account')} title={ts('auth.createYourAccount', 'Create your account')}>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <LedupPanel intro={ts('pg.join_store_to_track_orders_and_check', 'Join {{store}} to track orders and check out faster.', { store: store.name })}>
          {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ts('checkout.fullName', 'Full name')} required>{p => <TextInput {...p} required autoComplete="name" value={form.name} onChange={e => set({ name: e.target.value })} />}</Field>
              <Field label={ts('auth.email', 'Email')} required>{p => <TextInput {...p} type="email" required autoComplete="email" value={form.email} onChange={e => set({ email: e.target.value })} />}</Field>
            </div>
            <LedupPhoneField required value={form.phone} onChange={v => set({ phone: v })} defaultCountry={country} error={phoneError} />
            <Field label={ts('auth.address', 'Address')} required>{p => <TextInput {...p} required autoComplete="street-address" value={form.address} onChange={e => set({ address: e.target.value })} />}</Field>
            <Field label={ts('auth.password', 'Password')} required>{p => <LedupPasswordInput {...p} required autoComplete="new-password" value={form.password} onChange={e => set({ password: e.target.value })} />}</Field>
            <div><PillButton type="submit" loading={register.loading}>{ts('orders.createAccountBtn', 'Create account')}</PillButton></div>
          </form>
          <LedupSocialSignIn providers={social.providers} onStart={social.start} loading={social.loading} disabled={register.loading} dividerText={ts('auth.orSignUpWith', 'or sign up with')} />
        </LedupPanel>
        <LedupPanel heading={ts('auth.haveAccountHeading', 'Already registered?')} intro={ts('auth.haveAccountIntro', 'Sign in to use your saved details.')}>
          <Benefits />
          <div className="mt-6"><Link to={withRedirect('/login', redirectTo)} className="tx-btn no-underline" style={{ background: 'transparent', color: t.colors.accent, borderColor: t.colors.accent, borderRadius: t.buttonRadiusPx }}>{ts('auth.signInLink', 'Sign in')}</Link></div>
        </LedupPanel>
      </div>
    </LedupPageFrame>
  );
}

/** `/verify-otp`: the code step of registration (verifies + signs in) and of password reset (carries the code to /new-password). Needs the email stored in `AuthContext` by the previous step. */
export function LedupVerifyOtpPage() {
  return <WithPageSections pageKey="verify-otp"><VerifyContent /></WithPageSections>;
}
function VerifyContent() {
  const ctx = AuthContext.get();
  const isForgot = ctx?.flow === 'forgot';
  const email = ctx?.email ?? '';
  useStorefrontSeo({ title: isForgot ? ts('pg.verify_identity', 'Verify identity') : ts('pg.verify_email', 'Verify email'), noindex: true });
  const { store } = useStorefront();
  const navigate = useNavigate();
  const verify = useVerifyOtp();
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const code = otp.join('');
  const complete = code.length === OTP_LENGTH;
  const shownError = error || verify.error;

  if (!email) {
    return (
      <LedupPageFrame narrow crumb={ts('pg.verify_email', 'Verify email')} title={ts('auth.detailsMissing', 'Details missing')}>
        <LedupPanel intro={isForgot ? ts('pg.we_could_not_find_your_verification', 'We could not find your verification details. Please restart the password reset again.') : ts('auth.noSignupDetails', 'We could not find your sign-up details. Please create your account again.')}>
          <PillButton onClick={() => navigate(isForgot ? '/forgot-password' : '/register')}>{isForgot ? ts('pg.reset_password', 'Reset password') : ts('orders.createAccountBtn', 'Create account')}</PillButton>
        </LedupPanel>
      </LedupPageFrame>
    );
  }
  const change = (i: number, v: string) => { setOtp(prev => { const next = [...prev]; next[i] = v; return next; }); setError(''); };
  const submit = async () => {
    const errs = runSchema(otpSchema, { otp: code });
    if (errs.otp) { setError(errs.otp); return; }
    if (isForgot) {
      // There is no standalone "check this reset code" endpoint: the code is sent together with the new password on the next step.
      AuthContext.set({ email, role: ctx?.role ?? 'user', flow: 'forgot', storeId: ctx?.storeId, otp: code });
      navigate('/new-password');
      return;
    }
    await verify.execute(code);
  };
  return (
    <LedupPageFrame narrow crumb={isForgot ? ts('pg.verify_identity', 'Verify identity') : ts('pg.verify_email', 'Verify email')} title={isForgot ? ts('auth.verifyYourIdentity', 'Verify your identity') : ts('auth.checkYourEmail', 'Check your email')}>
      <LedupPanel intro={isForgot
        ? tsNodes('pg.otp_sent_reset', 'We sent a 6-digit code to {{email}} to confirm it is you before resetting your password.', { email: <b style={{ color: t.colors.ink }}>{email}</b> })
        : tsNodes('pg.otp_sent_signup', 'We sent a 6-digit code to {{email}} to finish creating your {{store}} account.', { email: <b style={{ color: t.colors.ink }}>{email}</b> }, { store: store.name })}>
        <form onSubmit={e => { e.preventDefault(); void submit(); }} className="flex flex-col gap-5">
          <LedupOtpBoxes values={otp} onChange={change} invalid={!!shownError} />
          <p aria-live="polite" className="m-0 flex min-h-5 items-center justify-center gap-1 text-[13px]" style={{ color: t.colors.success }}>{complete && !shownError && <><Check size={13} aria-hidden /> {ts('pg.code_entered', 'Code entered')}</>}</p>
          {shownError && <Notice tone="error">{shownError}</Notice>}
          <PillButton type="submit" full disabled={!complete} loading={verify.loading}>{ts('pg.verify_code', 'Verify code')}</PillButton>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.did_not_receive_it', 'Did not receive it?')} <LedupResendTimer email={email} storeId={ctx?.storeId} isForgot={isForgot} /></div>
        </form>
      </LedupPanel>
    </LedupPageFrame>
  );
}

/** `/forgot-password`. The hook sends the code and moves on to /verify-otp (the backend answers the same for unknown emails). */
export function LedupForgotPasswordPage() {
  return <WithPageSections pageKey="forgot-password"><ForgotContent /></WithPageSections>;
}
function ForgotContent() {
  useStorefrontSeo({ title: ts('pg.forgot_password', 'Forgot password'), noindex: true });
  const { store } = useStorefront();
  const forgot = useForgotPassword();
  const [email, setEmail] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); void forgot.execute(email.trim(), 'user', store.storeId); };
  return (
    <LedupPageFrame narrow crumb={ts('pg.forgot_password', 'Forgot password')} title={ts('auth.resetYourPassword', 'Reset your password')}>
      <LedupPanel intro={ts('pg.enter_the_email_on_your_store_account', 'Enter the email on your {{store}} account and we will send you a code.', { store: store.name })}>
        {forgot.error && <div className="mb-4"><Notice tone="error">{forgot.error}</Notice></div>}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={ts('auth.email', 'Email')} required>{p => <TextInput {...p} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />}</Field>
          <div className="flex flex-wrap items-center gap-5">
            <PillButton type="submit" loading={forgot.loading}>{ts('pg.send_reset_code', 'Send reset code')}</PillButton>
            <Link to="/login" className="text-sm font-medium no-underline hover:underline" style={linkStyle}>{ts('auth.backToSignIn', 'Back to sign in')}</Link>
          </div>
        </form>
      </LedupPanel>
    </LedupPageFrame>
  );
}

/** `/new-password`: last step of password reset. Needs the code carried in `AuthContext` from /verify-otp, otherwise goes back to /forgot-password. */
export function LedupNewPasswordPage() {
  return <WithPageSections pageKey="reset-password"><NewPasswordContent /></WithPageSections>;
}
function NewPasswordContent() {
  useStorefrontSeo({ title: ts('pg.reset_password', 'Reset password'), noindex: true });
  const navigate = useNavigate();
  const { store } = useStorefront();
  const reset = useStoreResetPassword();
  const otp = AuthContext.get()?.otp ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');

  if (!otp && !reset.success) return <Navigate to="/forgot-password" replace />;
  if (reset.success) {
    return (
      <LedupPageFrame narrow crumb={ts('pg.reset_password', 'Reset password')} title={ts('auth.passwordUpdated', 'Password updated')}>
        <LedupPanel intro={ts('pg.you_can_now_sign_back_in_to_store_with', 'You can now sign back in to {{store}} with your new password.', { store: store.name })}>
          <div className="mb-5"><CheckCircle2 size={32} aria-hidden style={{ color: t.colors.success }} /></div>
          <PillButton onClick={() => navigate('/login')}>{ts('auth.signInLink', 'Sign in')}</PillButton>
        </LedupPanel>
      </LedupPageFrame>
    );
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password.length < 8) { setFormError(ts('auth.err.pw8', 'Password must be at least 8 characters.')); return; }
    if (password !== confirm) { setFormError(ts('auth.err.pwMismatch', 'Passwords do not match.')); return; }
    await reset.execute(otp, password);
  };
  const error = formError || reset.error;
  return (
    <LedupPageFrame narrow crumb={ts('pg.reset_password', 'Reset password')} title={ts('auth.chooseNewPassword', 'Choose a new password')}>
      <LedupPanel intro={ts('pg.almost_done_set_a_new_password_to', 'Almost done. Set a new password to finish resetting your account.')}>
        {error && (
          <div className="mb-4"><Notice tone="error" action={reset.error ? <button type="button" onClick={() => navigate('/verify-otp')} className="cursor-pointer border-0 bg-transparent text-sm font-semibold underline" style={{ color: t.colors.ink }}>{ts('pg.re_enter_code', 'Re-enter code')}</button> : undefined}>{error}</Notice></div>
        )}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={ts('pg.new_password', 'New password')} hint={ts('account.pwHint', 'At least 8 characters.')} required>{p => <LedupPasswordInput {...p} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />}</Field>
          <Field label={ts('pg.confirm_password', 'Confirm password')} required>{p => <LedupPasswordInput {...p} required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />}</Field>
          <div><PillButton type="submit" loading={reset.loading}>{ts('pg.reset_password', 'Reset password')}</PillButton></div>
        </form>
      </LedupPanel>
    </LedupPageFrame>
  );
}
