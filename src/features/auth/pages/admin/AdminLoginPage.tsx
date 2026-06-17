import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Eye, EyeOff, Globe, Smartphone, Share2 } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { apiLogin, TokenStorage } from '@/api/commerce/auth';

const SOCIAL = [
  { Icon: Globe,      label: 'Google',   color: '#4285F4' },
  { Icon: Smartphone, label: 'Apple',    color: '#141413' },
  { Icon: Share2,     label: 'Facebook', color: '#1877F2' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminLoginPage() {
  const navigate = useNavigate();
  usePageTitle('Admin Login');

  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  const { values, errors, set, blur, handleSubmit } = useForm(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        setApiError('');
        setLoading(true);
        try {
          const res = await apiLogin({
            email:    data.email,
            password: data.password,
            role:     'admin',
          });

          TokenStorage.save(res.data.token.accessToken, res.data.token.refreshToken);
          TokenStorage.saveUser(res.data.user);
          navigate('/admin', { replace: true });
        } catch (err) {
          setApiError(err instanceof Error ? err.message : 'Invalid admin credentials.');
        } finally {
          setLoading(false);
        }
      },
    },
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-[20px] px-10 py-9 w-full max-w-[460px] border border-bone">

        {/* Heading */}
        <h1 className="text-2xl font-bold text-carbon mb-1 text-center">
          Admin Sign In
        </h1>
        <p className="text-[13px] text-slate mb-7 text-center">
          Access the Solvexo admin panel
        </p>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Email Address</label>
          <input
            type="email"
            placeholder="Enter Your Email"
            value={values.email}
            onChange={set('email')}
            onBlur={blur('email')}
            className={[
              'w-full px-3 py-[10px] rounded-lg border text-[13px] text-charcoal outline-none box-border bg-white',
              errors.email ? 'border-error' : 'border-bone',
            ].join(' ')}
          />
          {errors.email && <p className="text-[11px] text-error mt-[5px]">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-2">
          <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter Your password"
              value={values.password}
              onChange={set('password')}
              onBlur={blur('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className={[
                'w-full px-3 pr-[42px] py-[10px] rounded-lg border text-[13px] text-charcoal outline-none box-border bg-white',
                errors.password ? 'border-error' : 'border-bone',
              ].join(' ')}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate p-0 flex"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-[11px] text-error mt-[5px]">{errors.password}</p>}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-[12px] text-brand-orange font-medium bg-transparent border-none cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Sign In button */}
        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* API error */}
        {apiError && (
          <div className="bg-[#FDEAEA] rounded-lg px-[14px] py-[10px] mt-3 text-[13px] text-error text-center">
            {apiError}
          </div>
        )}

        {/* OR divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-bone" />
          <span className="text-[12px] text-slate">or continue with</span>
          <div className="flex-1 h-px bg-bone" />
        </div>

        {/* Social buttons */}
        <div className="flex gap-[10px] mb-6">
          {SOCIAL.map(({ Icon, label, color }) => (
            <button
              key={label}
              className="flex-1 flex items-center justify-center gap-2 px-2 py-[10px] rounded-lg text-[13px] font-medium cursor-pointer bg-white border border-bone text-charcoal transition-[background] duration-150"
            >
              <Icon size={16} style={{ color }} />
              {label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
