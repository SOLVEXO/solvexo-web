import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { Eye, EyeOff, Users, ShieldCheck, Store } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { apiStaffLogin } from '@/api/services/staff';
import { TokenStorage } from '@/api/services/auth';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';

const HIGHLIGHTS = [
  { Icon: Store,       text: "Scoped to this one store — nothing else" },
  { Icon: ShieldCheck, text: 'Only the permissions your manager has granted you' },
  { Icon: Users,       text: 'A separate login from the store owner’s own account' },
];

const BRANDING_HEADER = (
  <div className="flex items-center gap-[10px]">
    <div className="size-9 rounded-lg bg-brand-orange flex items-center justify-center shrink-0">
      <Users size={18} className="text-white" />
    </div>
    <div>
      <p className="text-[15px] font-bold text-white leading-tight">Solvexo</p>
      <p className="text-[11px] text-pos-muted leading-tight">Staff Sign In</p>
    </div>
  </div>
);

/** Real, store-scoped staff login — a genuinely separate identity from the
 *  store owner's own JWT (see backend `StaffMember`/`PermissionsGuard`).
 *  Deliberately NOT built on `useLogin` (that hook's redirect-resolution
 *  logic is buyer/seller/admin-specific) — this calls `apiStaffLogin`
 *  directly and lands the staff member straight on their one store's
 *  dashboard, since a staff account can never belong to more than one
 *  store (see StaffMember.storeId — always singular). No refresh-token
 *  flow exists for staff yet (disclosed backend gap — the access token is
 *  the only token issued); the same value is stored in both slots so
 *  `TokenStorage.isLoggedIn()` still resolves correctly. */
export function StaffLoginPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirect'));
  usePageTitle('Staff Sign In');

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { values, errors, set, blur, handleSubmit } = useForm(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        if (!storeId) { setApiError('Missing store — check the link your manager gave you.'); return; }
        setApiError('');
        setLoading(true);
        try {
          const res = await apiStaffLogin(storeId, data.email, data.password);
          const { accessToken, staff } = res.data;
          TokenStorage.save(accessToken, accessToken);
          TokenStorage.saveUser({ id: staff.id, name: staff.name, email: staff.email, role: 'staff', image: null, storeId: staff.storeId });
          navigate(redirectTo || `/store/${storeId}/dashboard`, { replace: true });
        } catch (err: unknown) {
          setApiError(err instanceof Error ? err.message : 'Invalid email or password.');
        } finally {
          setLoading(false);
        }
      },
    },
  );

  return (
    <AuthSplitLayout
      panelGradient="from-carbon via-[#1a1918] to-[#2a1a14]"
      pageContext="login"
      brandingHeader={BRANDING_HEADER}
      heading={<>Sign in to<br />your store.</>}
      subtext="Use the email and password your store manager set up for you."
      highlights={HIGHLIGHTS}
      accentIconClass="text-brand-orange"
    >
      <h1 className="text-[22px] font-bold text-carbon mb-1.5 text-center lg:text-left">
        Staff Sign In
      </h1>
      <p className="text-[13px] text-slate mb-6 text-center lg:text-left">
        Sign in to access this store's dashboard
      </p>

      <div className="flex flex-col gap-4">
        <Input
          id="staff-login-email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
          onBlur={blur('email')}
          error={errors.email}
        />

        <Input
          id="staff-login-password"
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
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} loading={loading} className="mt-6">
        Sign In
      </Button>

      {apiError && (
        <div role="alert" className="bg-error-bg rounded-lg px-[14px] py-[10px] mt-3 text-[13px] text-error text-center">
          {apiError}
        </div>
      )}
    </AuthSplitLayout>
  );
}
