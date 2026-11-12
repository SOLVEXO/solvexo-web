import { siteText } from '@/i18n/site/siteText';
import type { SiteLang } from '@/i18n/site/siteLanguage';

/** Text shared by the seller sign-in / sign-up / password pages and the onboarding wizard. */
export const AUTH_SHARED_TEXT = siteText({
  en: {
    /** Same three lines on Login, Register and the onboarding wizard (one voice across the seller funnel). */
    sellerHighlights: [
      'A store built around how you sell',
      'Analytics from day one',
      'Verified sellers buyers can trust',
    ],
    emailLabel: 'Email Address',
    emailPlaceholder: 'Enter Your Email Address',
    passwordLabel: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    orContinueWithEmail: 'or continue with email',
    orContinueWith: 'or continue with',
    addNewAccount: 'Add new account',
    signIn: 'Sign In',
  },
  ar: {
    sellerHighlights: [
      'متجر مصمَّم حول طريقة بيعك',
      'التحليلات من اليوم الأول',
      'بائعون موثَّقون يثق بهم المشترون',
    ],
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    passwordLabel: 'كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    orContinueWithEmail: 'أو تابع بالبريد الإلكتروني',
    orContinueWith: 'أو تابع باستخدام',
    addNewAccount: 'إضافة حساب جديد',
    signIn: 'تسجيل الدخول',
  },
});

/**
 * Arabic for the client-side messages these pages can show: form validation (the shared `utils/validation`
 * validators, which stay English for the rest of the app) and a few fixed messages from the shared auth hooks.
 * Display only: the validators and hooks are unchanged. Anything not listed (e.g. an API error) is shown as it is.
 */
const AR_VALIDATION: Record<string, string> = {
  'Full name is required.': 'الاسم الكامل مطلوب.',
  'Email address is required.': 'البريد الإلكتروني مطلوب.',
  'Password is required.': 'كلمة المرور مطلوبة.',
  'Phone number is required.': 'رقم الهاتف مطلوب.',
  'Address is required.': 'العنوان مطلوب.',
  'Verification code is required.': 'رمز التحقق مطلوب.',
  'New password is required.': 'كلمة المرور الجديدة مطلوبة.',
  'Confirm password is required.': 'تأكيد كلمة المرور مطلوب.',
  'Enter a valid email address.': 'أدخل بريدًا إلكترونيًا صحيحًا.',
  'Enter a valid phone number.': 'أدخل رقم هاتف صحيحًا.',
  'Password must be at least 8 characters.': 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
  'Passwords do not match.': 'كلمتا المرور غير متطابقتين.',
  'Code must be exactly 6 characters.': 'يجب أن يتكون الرمز من 6 أرقام.',
  // Client-side messages from the shared auth hooks (useSocialLogin, useResetPassword) shown on these pages.
  'Google sign-in failed. Please try again.': 'تعذّر تسجيل الدخول عبر Google. يُرجى المحاولة مرة أخرى.',
  'Google login is not configured. Please use email and password.': 'تسجيل الدخول عبر Google غير متاح حاليًا. يُرجى استخدام البريد الإلكتروني وكلمة المرور.',
  'Failed to load Google login. Please try again.': 'تعذّر تحميل تسجيل الدخول عبر Google. يُرجى المحاولة مرة أخرى.',
  'Session expired. Please start again.': 'انتهت الجلسة. يُرجى البدء من جديد.',
};

/** The validation message in the page's language (unknown messages pass through unchanged). */
export function formError(msg: string | undefined, lang: SiteLang): string | undefined {
  if (!msg || lang === 'en') return msg;
  return AR_VALIDATION[msg] ?? msg;
}

/** "3 أيام" / "14 يومًا": an Arabic day count with the right plural form (Western digits). */
export function arabicDays(n: number): string {
  if (n === 1) return 'يوم واحد';
  if (n === 2) return 'يومان';
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يومًا`;
}

/** A country's name in the page language (Arabic names come from the browser; the English list is the fallback). */
export function countryLabel(code: string, englishName: string, lang: SiteLang): string {
  if (lang === 'en') return englishName;
  try {
    return new Intl.DisplayNames(['ar'], { type: 'region' }).of(code) ?? englishName;
  } catch {
    return englishName;
  }
}
