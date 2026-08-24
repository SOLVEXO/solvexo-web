import { registerSection } from '../sectionRenderRegistry';
import { useState, type FormEvent } from 'react';
import { Mail, Check } from 'lucide-react';
import { useStorefront } from '../StorefrontContext';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';

export interface NewsletterSectionSettings {
  heading?: string;
  subtext?: string;
}

// Same platform-wide `apiSubscribeNewsletter` the marketplace footer's
// `NewsletterMini` already calls — no store-scoped subscriber list exists
// (or is needed) today, so this section is a storefront-native wrapper
// around the exact same real backend, not a new mechanism.
export function NewsletterSection({ settings }: { settings: NewsletterSectionSettings }) {
  const { cfg } = useStorefront();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      await apiSubscribeNewsletter(email.trim());
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div
        className="mx-auto rounded-2xl px-6 py-9 sm:px-10 text-center"
        style={{ maxWidth: Math.round(720 * cfg.containerWidthScale), background: `${cfg.primaryColor}0F` }}
      >
        <Mail size={22} style={{ color: cfg.primaryColor }} className="mx-auto mb-3" />
        <h2 className="font-bold mb-1.5" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>
          {settings.heading ?? 'Get updates from us'}
        </h2>
        {settings.subtext && <p className="text-[13px] opacity-75 mb-5" style={{ color: cfg.textColor }}>{settings.subtext}</p>}

        {status === 'done' ? (
          <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold" style={{ color: cfg.primaryColor }}>
            <Check size={15} /> You're subscribed — thank you!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-[420px] mx-auto">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 min-w-0 px-4 py-[11px] rounded-[10px] text-[13px] border outline-none bg-white"
              style={{ borderColor: `${cfg.textColor}25`, color: '#1a1a1a' }}
            />
            <button
              type="submit" disabled={status === 'loading'}
              className="px-5 py-[11px] rounded-[10px] text-[13px] font-semibold text-white border-none cursor-pointer disabled:opacity-60 whitespace-nowrap"
              style={{ background: cfg.primaryColor, borderRadius: cfg.buttonRadiusPx }}
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        {status === 'error' && <p className="text-[12px] mt-2" style={{ color: '#C13030' }}>Something went wrong — please try again.</p>}
      </div>
    </div>
  );
}

registerSection('newsletter', (section) =>
  <NewsletterSection settings={section.settings as NewsletterSectionSettings} />,
);
