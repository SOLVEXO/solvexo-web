import { useState, type FormEvent } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { novaInput } from '../components/novaFormStyles';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';
import { copyText, showEyebrow } from '../../sectionCopy';

/** Theme 02's port of Atelier's `NewsletterSection` — same real
 *  `apiSubscribeNewsletter` call and section-settings shape
 *  (`heading`/`subtext`), Nova's own bold/rounded visual language instead
 *  of Atelier's quiet editorial one. Closes one of the real section-type
 *  gaps between the two themes (see `theme-02-nova/sections/index.ts`'s
 *  "disclosed scope" doc comment) rather than leaving a merchant who adds
 *  a Newsletter section on a Nova store with it silently not rendering. */
function NewsletterSection({ section }: { section: Section; colors: NovaSectionColors }) {
  const { store } = useStorefront();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await apiSubscribeNewsletter(email.trim(), { storeId: store.storeId, source: 'store_section' });
      // Double opt-in stores: nothing is subscribed until they confirm by email.
      setPendingConfirm(!!res.data?.pendingConfirmation);
      setStatus('done');
    } catch { setStatus('error'); }
  };

  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto flex flex-col items-center text-center gap-4" style={{ maxWidth: t.layout.maxWidth, background: t.colors.accent, borderRadius: t.radius.md, padding: 'clamp(32px, 6vw, 72px) clamp(20px, 5vw, 64px)' }}>
        {showEyebrow(section.settings) && (<span style={{ fontFamily: t.fonts.body, fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.colors.accent, background: '#FFFFFF', borderRadius: '9999px', padding: '7px 13px' }}>{copyText(section.settings, 'eyebrow', 'The good stuff, first')}</span>)}
        <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05 }}>
          {section.settings.heading || 'Stay in the loop'}
        </h2>
        {section.settings.subtext && <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: 'rgba(255,255,255,0.88)', maxWidth: '560px', lineHeight: 1.7 }}>{section.settings.subtext}</p>}
        {status === 'done' ? (
          <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: '#FFFFFF' }}>{pendingConfirm ? 'Almost done — check your inbox to confirm your subscription.' : copyText(section.settings, 'successMessage', "Thank you — you're subscribed.")}</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 w-full" style={{ maxWidth: '520px', marginTop: '4px' }}>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={copyText(section.settings, 'placeholder', 'Your email')} aria-label={copyText(section.settings, 'placeholder', 'Your email')} style={{ ...novaInput, background: '#FFFFFF' }} />
            <NovaButton type="submit" loading={status === 'loading'} style={{ flexShrink: 0, background: '#FFFFFF', color: t.colors.accent }}>{copyText(section.settings, 'buttonLabel', 'Subscribe')}</NovaButton>
          </form>
        )}
        {status === 'error' && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: '#FFFFFF' }}>Something went wrong — try again.</p>}
      </div>
    </div>
  );
}

registerNovaSection('newsletter', (section: Section, _blocks, colors: NovaSectionColors) => <NewsletterSection section={section} colors={colors} />);
