import { clsx } from 'clsx';
import { Globe } from 'lucide-react';
import { useSiteLang } from './siteLangContext';

/** "العربية" on the English site, "English" on the Arabic site. Saves the choice for this visitor. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { pageLang, setLang } = useSiteLang();
  const toArabic = pageLang !== 'ar';
  return (
    <button
      type="button"
      onClick={() => setLang(toArabic ? 'ar' : 'en')}
      lang={toArabic ? 'ar' : 'en'}
      aria-label={toArabic ? 'عرض الموقع باللغة العربية' : 'View the site in English'}
      className={clsx('inline-flex items-center gap-1.5 rounded-full border border-current/15 px-3 py-1.5 text-[13px] font-medium cursor-pointer bg-transparent hover:border-current/40 transition-colors', className)}
    >
      <Globe size={14} aria-hidden />
      {toArabic ? 'العربية' : 'English'}
    </button>
  );
}
