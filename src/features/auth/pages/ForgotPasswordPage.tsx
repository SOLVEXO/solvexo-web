import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { useForm } from '@/hooks/useForm';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/utils/validation/schemas';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { motion } from 'motion/react';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { FORGOT_PASSWORD_TEXT } from './ForgotPasswordPage.text';
import { AUTH_SHARED_TEXT, formError } from './authPages.text';

const fadeSlide = { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } };

// Text: FORGOT_PASSWORD_TEXT.highlights (one per icon, same order).
const HIGHLIGHT_ICONS = [KeyRound, Clock, ShieldCheck];

export function ForgotPasswordPage() {
  const navigate       = useNavigate();
  const { pageLang } = useSiteLang();
  const t = useSiteText(FORGOT_PASSWORD_TEXT);
  const s = useSiteText(AUTH_SHARED_TEXT);
  usePageTitle(t.pageTitle);
  const forgotPassword = useForgotPassword();

  const { values, errors, set, blur, handleSubmit } = useForm(
    forgotPasswordSchema,
    { email: '' },
    {
      onSubmit: async (data: ForgotPasswordFormData) => {
        // Seller-only web login (see LoginPage's SELLER_ONLY_LOGIN) — every
        // real account reaching this page is a seller, so this must query
        // the Seller collection, not useForgotPassword's buyer-oriented
        // 'user' default (which would silently check the wrong collection
        // and never actually send a real seller their reset code).
        await forgotPassword.execute(data.email, 'seller');
      },
    },
  );

  return (
    // Forgot/OTP/New-Password used to all share pageContext="login" — the
    // exact same photo as the Login page itself, on 3 different screens in
    // a row. Each now has its own dedicated, curated context/photo set (see
    // auth-visual-region.const.ts) instead of borrowing from Register/Login.
    <AuthSplitLayout
      pageContext="forgot_password"
      heading={t.heading}
      subtext={t.subtext}
      highlights={t.highlights.map((text, i) => ({ Icon: HIGHLIGHT_ICONS[i], text }))}
    >
      <h1 className="text-[22px] font-bold text-carbon mb-1.5 text-center lg:text-start">
        {t.title}
      </h1>
      <p className="text-[13px] text-slate mb-6 leading-[1.6] text-center lg:text-start">
        {t.intro}
      </p>

      <div className="mb-5">
        <Input
          id="forgot-email"
          label={s.emailLabel}
          type="email" placeholder={s.emailPlaceholder} autoComplete="email"
          dir="ltr" className={pageLang === 'ar' ? 'placeholder-shown:text-right' : undefined}
          value={values.email} onChange={set('email')} onBlur={blur('email')}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          error={formError(errors.email, pageLang)}
        />
      </div>

      <MagneticButton className="block">
        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} loading={forgotPassword.loading}>
          {t.sendCode}
        </Button>
      </MagneticButton>

      {forgotPassword.error && (
        <motion.div role="alert" className="flex items-center justify-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mt-3 text-[13px] text-error" {...fadeSlide}>
          <AlertTriangle size={14} className="shrink-0" />
          <span>{forgotPassword.error}</span>
        </motion.div>
      )}

      <Button
        variant="ghost"
        size="sm"
        fullWidth
        icon={<ArrowLeft size={13} className="rtl:-scale-x-100" />}
        onClick={() => navigate('/login')}
        className="mt-6 text-slate!"
      >
        {t.backToSignIn}
      </Button>
    </AuthSplitLayout>
  );
}
