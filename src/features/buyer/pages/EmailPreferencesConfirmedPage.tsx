import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSiteText } from '@/i18n/site/useSiteText';
import { EMAIL_PREFERENCES_TEXT } from './EmailPreferencesConfirmedPage.text';

/** solvexo.store/email-preferences/confirmed?status=ok|invalid — where the "Can we keep you posted?" email's button lands (noindex). */
export function EmailPreferencesConfirmedPage() {
  const t = useSiteText(EMAIL_PREFERENCES_TEXT);
  usePageTitle(t.pageTitle);
  const ok = useSearchParams()[0].get('status') === 'ok';

  return (
    <section className="bg-[#faf9f5] min-h-[70vh] flex items-center px-6 py-20">
      <div className="max-w-[560px] mx-auto text-center flex flex-col items-center">
        <div className={ok ? 'w-12 h-12 rounded-full bg-success-bg flex items-center justify-center' : 'w-12 h-12 rounded-full bg-brand-pale-orange flex items-center justify-center'}>
          {ok ? <Check size={22} className="text-success" aria-hidden /> : <Clock size={22} className="text-brand-orange" aria-hidden />}
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#a66c53]">{ok ? t.okEyebrow : t.badEyebrow}</p>
        <h1 className="mt-4 text-[34px] sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.1] text-[#1c1d1b]">{ok ? t.okTitle : t.badTitle}</h1>
        <p className="mt-4 text-[15px] leading-[1.8] text-[#777974]">{ok ? t.okBody : t.badBody}</p>
        <Link to={ok ? '/' : '/contact-us'} className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-[7px] bg-brand-orange text-white text-[13px] font-semibold hover:-translate-y-0.5 transition-transform">
          {ok ? t.goHome : t.contactUs} <ArrowRight size={15} aria-hidden className="rtl:-scale-x-100" />
        </Link>
      </div>
    </section>
  );
}
