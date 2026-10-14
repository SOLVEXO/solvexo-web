import { useState, type FormEvent } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierButton } from '../components/AtelierButton';
import { atelierInput } from '../components/atelierFormStyles';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';
import { copyText, showEyebrow } from '../../sectionCopy';

function NewsletterSection({ section, colors }: { section: Section; colors: AtelierSectionColors }) {
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
      <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center" style={{ maxWidth: t.layout.maxWidth, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: 'clamp(28px, 5vw, 56px) 0' }}>
        <div>
          {showEyebrow(section.settings) && (<p style={{ fontFamily: t.fonts.body, fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.accent, marginBottom: '12px' }}>{copyText(section.settings, 'eyebrow', 'Private notes')}</p>)}
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 500, color: colors.ink, lineHeight: 1.08 }}>
            {section.settings.heading || 'Stay in the loop'}
          </h2>
          {section.settings.subtext && <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: colors.inkMuted, marginTop: '12px', lineHeight: 1.7 }}>{section.settings.subtext}</p>}
        </div>
        <div className="flex flex-col gap-3">
        {status === 'done' ? (
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: colors.success }}>{pendingConfirm ? 'Almost done — check your inbox to confirm your subscription.' : copyText(section.settings, 'successMessage', "Thank you — you're subscribed.")}</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 w-full atelier-form">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={copyText(section.settings, 'placeholder', 'Your email')} style={atelierInput} />
            <AtelierButton type="submit" loading={status === 'loading'} style={{ flexShrink: 0 }}>{copyText(section.settings, 'buttonLabel', 'Subscribe')}</AtelierButton>
          </form>
        )}
        {status === 'error' && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: colors.danger }}>Something went wrong — try again.</p>}
        </div>
      </div>
    </div>
  );
}

registerAtelierSection('newsletter', (section: Section, _blocks, colors: AtelierSectionColors) => <NewsletterSection section={section} colors={colors} />);
