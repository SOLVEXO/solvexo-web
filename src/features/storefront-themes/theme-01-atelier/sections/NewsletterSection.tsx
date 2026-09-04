import { useState, type FormEvent } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { AtelierButton } from '../components/AtelierButton';
import { atelierInput } from '../components/atelierFormStyles';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

function NewsletterSection({ section, colors }: { section: Section; colors: AtelierSectionColors }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      await apiSubscribeNewsletter(email.trim());
      setStatus('done');
    } catch { setStatus('error'); }
  };

  return (
    <div style={{ background: colors.bgAlt, padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto flex flex-col items-center text-center gap-3" style={{ maxWidth: '480px' }}>
        <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, color: colors.ink }}>
          {section.settings.heading || 'Stay in the loop'}
        </h2>
        {section.settings.subtext && <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: colors.inkMuted }}>{section.settings.subtext}</p>}
        {status === 'done' ? (
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: colors.success, marginTop: '8px' }}>Thank you — you're subscribed.</p>
        ) : (
          <form onSubmit={submit} className="flex gap-2 w-full atelier-form" style={{ marginTop: '8px' }}>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" style={atelierInput} />
            <AtelierButton type="submit" loading={status === 'loading'} style={{ flexShrink: 0 }}>Subscribe</AtelierButton>
          </form>
        )}
        {status === 'error' && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: colors.danger }}>Something went wrong — try again.</p>}
      </div>
    </div>
  );
}

registerAtelierSection('newsletter', (section: Section, _blocks, colors: AtelierSectionColors) => <NewsletterSection section={section} colors={colors} />);
