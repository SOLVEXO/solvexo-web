import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { Eye, EyeOff, Shield, Lock, Activity, ArrowLeft, KeyRound, Smartphone } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { useLogin } from '@/hooks/auth/useLogin';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';

const HIGHLIGHTS = [
  { Icon: Shield,   text: 'Manage users, sellers and marketplace policy' },
  { Icon: Activity, text: 'Monitor platform health and finance in real time' },
  { Icon: Lock,     text: 'Restricted access — authorized administrators only' },
];

const BRANDING_HEADER = (
  <div className="flex items-center gap-[10px]">
    <div className="size-9 rounded-lg bg-error flex items-center justify-center shrink-0">
      <Shield size={18} className="text-white" />
    </div>
    <div>
      <p className="text-[15px] font-bold text-white leading-tight">Solvexo Admin</p>
      <p className="text-[11px] text-pos-muted leading-tight">Super Admin Panel</p>
    </div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirect'));
  usePageTitle('Admin Login');

  const [showPass, setShowPass] = useState(false);
  const { execute: login, verifyTwoFactor, loading, error: apiError } = useLogin();
  // Set when the password was right and the account has two-factor on: the page switches to the code step.
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);

  const { values, errors, set, blur, handleSubmit } = useForm(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        const challenge = await login({
          email:    data.email,
          password: data.password,
          role:     'admin',
        }, redirectTo);
        if (challenge) { setChallengeToken(challenge.challengeToken); setCode(''); setUseRecovery(false); }
      },
    },
  );

  return (
    <AuthSplitLayout
      panelGradient="from-admin-bg via-[#1a1918] to-[#2a1414]"
      pageContext="login"
      brandingHeader={BRANDING_HEADER}
      heading={<>Platform control,<br />secured.</>}
      subtext="Sign in with your administrator credentials to access the Solvexo control panel."
      highlights={HIGHLIGHTS}
      accentIconClass="text-error"
    >
      {challengeToken ? (
        <TwoFactorStep
          code={code}
          setCode={setCode}
          useRecovery={useRecovery}
          setUseRecovery={setUseRecovery}
          loading={loading}
          error={apiError}
          onSubmit={() => code.trim() && verifyTwoFactor(challengeToken, code.trim(), redirectTo)}
          onBack={() => { setChallengeToken(null); setCode(''); }}
        />
      ) : (<>
      <h1 className="text-[22px] font-bold text-carbon mb-1.5 text-center lg:text-left">
        Admin Sign In
      </h1>
      <p className="text-[13px] text-slate mb-6 text-center lg:text-left">
        Access the Solvexo admin panel
      </p>

      <div className="flex flex-col gap-4">
        <Input
          id="admin-login-email"
          label="Email Address"
          type="email"
          placeholder="Enter Admin Email"
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
          onBlur={blur('email')}
          error={errors.email}
        />

        <div>
          <Input
            id="admin-login-password"
            label="Enter Admin Password"
            type={showPass ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={values.password}
            onChange={set('password')}
            onBlur={blur('password')}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            error={errors.password}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                className="bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <div className="flex justify-end mt-2">
            <Button variant="link" size="sm" onClick={() => navigate('/admin/forgot-password')}>
              Forgot password?
            </Button>
          </div>
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} loading={loading} className="mt-6">
        Sign In
      </Button>

      {apiError && (
        <div role="alert" className="bg-error-bg rounded-lg px-[14px] py-[10px] mt-3 text-[13px] text-error text-center">
          {apiError}
        </div>
      )}
      </>)}
    </AuthSplitLayout>
  );
}

interface TwoFactorStepProps {
  code: string; setCode: (v: string) => void; useRecovery: boolean; setUseRecovery: (v: boolean) => void;
  loading: boolean; error: string; onSubmit: () => void; onBack: () => void;
}

function TwoFactorStep({ code, setCode, useRecovery, setUseRecovery, loading, error, onSubmit, onBack }: TwoFactorStepProps) {
  // The page swaps to this step after the password, so move focus to the code box (and when switching code type).
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, [useRecovery]);
  return (
    <>
      <div className="size-11 rounded-xl bg-brand-pale-orange text-brand-orange flex items-center justify-center mb-4 mx-auto lg:mx-0">
        {useRecovery ? <KeyRound size={20} /> : <Smartphone size={20} />}
      </div>
      <h1 className="text-[22px] font-bold text-carbon mb-1.5 text-center lg:text-left">Two-factor sign-in</h1>
      <p className="text-[13px] text-slate mb-6 text-center lg:text-left">
        {useRecovery
          ? 'Enter one of the recovery codes you saved when you turned on two-factor sign-in. Each code works once.'
          : 'Open your authenticator app and enter the 6-digit code for Solvexo Admin.'}
      </p>

      <Input
        id="admin-login-2fa-code"
        label={useRecovery ? 'Recovery code' : 'Authentication code'}
        placeholder={useRecovery ? 'XXXXX-XXXXX' : '123 456'}
        autoComplete="one-time-code"
        inputMode={useRecovery ? 'text' : 'numeric'}
        maxLength={useRecovery ? 11 : 7}
        ref={inputRef}
        value={code}
        onChange={e => setCode(useRecovery ? e.target.value.toUpperCase() : e.target.value.replace(/[^\d ]/g, ''))}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
      />

      <Button variant="primary" size="lg" fullWidth onClick={onSubmit} loading={loading} disabled={!code.trim()} className="mt-6">
        Verify and sign in
      </Button>

      {error && (
        <div role="alert" className="bg-error-bg rounded-lg px-[14px] py-[10px] mt-3 text-[13px] text-error text-center">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
        <Button variant="link" size="sm" onClick={onBack}><ArrowLeft size={13} /> Back</Button>
        <Button variant="link" size="sm" onClick={() => { setUseRecovery(!useRecovery); setCode(''); }}>
          {useRecovery ? 'Use authenticator app' : 'Lost your phone? Use a recovery code'}
        </Button>
      </div>
    </>
  );
}
