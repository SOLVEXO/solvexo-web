import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { Eye, EyeOff, Shield, Lock, Activity } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { apiLogin, TokenStorage } from '@/api/services/auth';
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
    <AuthSplitLayout
      panelGradient="from-admin-bg via-[#1A1918] to-[#2A1414]"
      brandingHeader={BRANDING_HEADER}
      heading={<>Platform control,<br />secured.</>}
      subtext="Sign in with your administrator credentials to access the Solvexo control panel."
      highlights={HIGHLIGHTS}
      accentIconClass="text-error"
    >
      <div className="lg:hidden flex justify-center mb-6">
        <div className="size-11 rounded-xl bg-error flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
      </div>

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
          placeholder="admin@solvexo.com"
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
          onBlur={blur('email')}
          error={errors.email}
        />

        <div>
          <Input
            id="admin-login-password"
            label="Password"
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
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-[12px] text-brand-orange font-medium bg-transparent border-none cursor-pointer hover:opacity-75"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={loading} className="mt-6">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      {apiError && (
        <div className="bg-error-bg rounded-lg px-[14px] py-[10px] mt-3 text-[13px] text-error text-center">
          {apiError}
        </div>
      )}
    </AuthSplitLayout>
  );
}
