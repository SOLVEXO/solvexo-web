import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useResetPassword } from '@/hooks/auth/useResetPassword';
import { Button } from '@/components/comman/ui/Button';
import { Eye, EyeOff, ArrowRight, Check, Circle } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { newPasswordSchema, type NewPasswordFormData } from '@/utils/validation/schemas';
import { AuthContext } from '@/api/commerce/auth';

function getStrength(password: string) {
  if (!password) return { score: 0, label: '', colorClass: '', bgClass: 'bg-bone' };
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12)         score++;
  if (score <= 1) return { score, label: 'Weak',   colorClass: 'text-error',        bgClass: 'bg-error'        };
  if (score <= 2) return { score, label: 'Fair',   colorClass: 'text-warning',      bgClass: 'bg-warning'      };
  if (score <= 3) return { score, label: 'Good',   colorClass: 'text-brand-orange', bgClass: 'bg-brand-orange' };
  return              { score, label: 'Strong', colorClass: 'text-success',      bgClass: 'bg-success'      };
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, colorClass, bgClass } = getStrength(password);
  if (!password) return null;
  const widthPct = `${Math.min(100, (score / 4) * 100)}%`;
  return (
    <div className="mt-2">
      <div className="flex justify-between mb-1">
        <span className="text-[11px] text-slate">Password strength</span>
        <span className={clsx('text-[11px] font-semibold', colorClass)}>{label}</span>
      </div>
      <div className="h-1 bg-bone rounded-sm overflow-hidden">
        <div className={clsx('h-full rounded-sm transition-[width] duration-300', bgClass)} style={{ width: widthPct }} />
      </div>
      <div className="mt-[10px] flex flex-col gap-1">
        {([
          [password.length >= 8,           'At least 8 characters'],
          [/[A-Z]/.test(password),         'One uppercase letter'],
          [/[0-9]/.test(password),         'One number'],
          [/[^A-Za-z0-9]/.test(password),  'One special character'],
        ] as [boolean, string][]).map(([met, req]) => (
          <div key={req} className="flex items-center gap-[6px]">
            <span className={clsx('flex', met ? 'text-success' : 'text-slate')}>
              {met ? <Check size={12} /> : <Circle size={12} />}
            </span>
            <span className={clsx('text-[11px]', met ? 'text-success' : 'text-slate')}>{req}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordInput({ label, placeholder, value, onChange, onBlur, error }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void; error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[12px] font-medium text-charcoal mb-[6px]">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} onBlur={onBlur}
          className={clsx(
            'w-full px-3 pr-[42px] py-[10px] rounded-lg border text-[13px] text-charcoal outline-none bg-white',
            error ? 'border-error' : 'border-bone',
          )}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate p-0 flex">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-[11px] text-error mt-[5px]">{error}</p>}
    </div>
  );
}

export function NewPasswordPage() {
  const navigate      = useNavigate();
  usePageTitle('New Password');
  const resetPassword = useResetPassword();
  const [otp, setOtp]           = useState('');
  const [otpError, setOtpError] = useState('');

  const ctx       = AuthContext.get();
  const userEmail = ctx?.email ?? '';

  const { values, errors, setValue, blur, handleSubmit } = useForm(
    newPasswordSchema,
    { password: '', confirmPassword: '' },
    {
      onSubmit: async (data: NewPasswordFormData) => {
        if (!otp || otp.length < 6) { setOtpError('Enter the 6-digit code from your email.'); return; }
        setOtpError('');
        await resetPassword.execute(otp, data.password);
      },
    },
  );

  const passwordsMatch = values.password === values.confirmPassword && values.confirmPassword !== '';

  if (resetPassword.success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-white rounded-[20px] px-10 py-9 w-full max-w-[440px] border border-bone">
          <h1 className="text-[22px] font-bold text-carbon text-center mb-2">Password updated!</h1>
          <p className="text-[13px] text-slate text-center leading-[1.6] mb-7">
            Your password has been changed. You can now sign in.
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/login')}>
            Sign In Now <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-[20px] px-10 py-9 w-full max-w-[440px] border border-bone">
        <h1 className="text-[22px] font-bold text-carbon text-center mb-2">Reset your password</h1>
        {userEmail && (
          <p className="text-[13px] text-slate text-center mb-5 leading-[1.6]">
            Enter the code sent to <strong className="text-carbon">{userEmail}</strong>
          </p>
        )}

        {/* OTP */}
        <div className="mb-5">
          <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Verification Code</label>
          <input
            type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit OTP" value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
            className={clsx(
              'w-full px-3 py-[10px] rounded-lg border text-charcoal outline-none bg-white text-center',
              otpError ? 'border-error' : otp.length === 6 ? 'border-success' : 'border-bone',
              otp ? 'tracking-[0.3em] font-bold text-[18px]' : 'text-[13px]',
            )}
          />
          {otpError && <p className="text-[11px] text-error mt-[5px]">{otpError}</p>}
          {otp.length === 6 && !otpError && (
            <p className="text-[11px] text-success mt-[5px] flex items-center gap-1">
              <Check size={11} /> Code entered
            </p>
          )}
        </div>

        {/* New password */}
        <div className="mb-4">
          <PasswordInput label="New Password" placeholder="Enter new password"
            value={values.password} onChange={v => setValue('password', v)}
            onBlur={blur('password')} error={errors.password} />
          <StrengthBar password={values.password} />
        </div>

        {/* Confirm */}
        <div className="mb-5">
          <PasswordInput label="Confirm Password" placeholder="Confirm new password"
            value={values.confirmPassword} onChange={v => setValue('confirmPassword', v)}
            onBlur={blur('confirmPassword')} error={errors.confirmPassword} />
          {values.confirmPassword && (
            <p className={clsx('text-[11px] mt-[5px]', passwordsMatch ? 'text-success' : 'text-error')}>
              {passwordsMatch
                ? <><Check size={11} className="inline align-middle mr-[3px]" />Passwords match</>
                : <>✗ Passwords do not match</>}
            </p>
          )}
        </div>

        {resetPassword.error && (
          <div className="bg-error-bg rounded-lg px-[14px] py-[10px] mb-4 text-[13px] text-error">
            {resetPassword.error}
          </div>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={resetPassword.loading}>
          {resetPassword.loading
            ? 'Resetting...'
            : <span>Reset Password <ArrowRight size={14} className="inline align-middle ml-1" /></span>}
        </Button>
      </div>
    </div>
  );
}
