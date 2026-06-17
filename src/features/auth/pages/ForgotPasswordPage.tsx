import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { Button } from '@/components/comman/ui/Button';
import { useForm } from '@/hooks/useForm';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/utils/validation/schemas';

export function ForgotPasswordPage() {
  const navigate       = useNavigate();
  usePageTitle('Forgot Password');
  const forgotPassword = useForgotPassword();

  const { values, errors, set, blur, handleSubmit } = useForm(
    forgotPasswordSchema,
    { email: '' },
    {
      onSubmit: async (data: ForgotPasswordFormData) => {
        await forgotPassword.execute(data.email);
      },
    },
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-[20px] px-10 py-9 w-full max-w-[440px] border border-bone">
        <h1 className="text-[22px] font-bold text-carbon text-center mb-2">
          Forgot your password?
        </h1>
        <p className="text-[13px] text-slate text-center mb-7 leading-[1.6]">
          Enter your email and we'll send you a reset code.
        </p>

        <div className="mb-5">
          <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Email Address</label>
          <input
            type="email" placeholder="Enter your email"
            value={values.email} onChange={set('email')} onBlur={blur('email')}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className={[
              'w-full px-3 py-[10px] rounded-lg border text-[13px] text-charcoal outline-none box-border bg-white',
              errors.email ? 'border-error' : 'border-bone',
            ].join(' ')}
          />
          {errors.email && <p className="text-[11px] text-error mt-[5px]">{errors.email}</p>}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={forgotPassword.loading}>
          {forgotPassword.loading ? 'Sending...' : 'Send Reset Code'}
        </Button>

        {forgotPassword.error && (
          <p className="text-[13px] text-error text-center mt-[10px]">
            {forgotPassword.error}
          </p>
        )}

        <div className="text-center mt-5">
          <button onClick={() => navigate('/login')}
            className="text-[12px] text-slate bg-transparent border-none cursor-pointer">
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
