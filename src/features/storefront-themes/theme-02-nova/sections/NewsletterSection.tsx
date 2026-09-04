import { useState, type FormEvent } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { NovaButton } from '../components/NovaButton';
import { novaInput } from '../components/novaFormStyles';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

/** Theme 02's port of Atelier's `NewsletterSection` — same real
 *  `apiSubscribeNewsletter` call and section-settings shape
 *  (`heading`/`subtext`), Nova's own bold/rounded visual language instead
 *  of Atelier's quiet editorial one. Closes one of the real section-type
 *  gaps between the two themes (see `theme-02-nova/sections/index.ts`'s
 *  "disclosed scope" doc comment) rather than leaving a merchant who adds
 *  a Newsletter section on a Nova store with it silently not rendering. */
function NewsletterSection({ section, colors }: { section: Section; colors: NovaSectionColors }) {
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
        <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: colors.ink }}>
          {section.settings.heading || 'Stay in the loop'}
        </h2>
        {section.settings.subtext && <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: colors.inkMuted }}>{section.settings.subtext}</p>}
        {status === 'done' ? (
          <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: colors.success, marginTop: '8px' }}>Thank you — you're subscribed.</p>
        ) : (
          <form onSubmit={submit} className="flex gap-2 w-full" style={{ marginTop: '8px' }}>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" style={novaInput} />
            <NovaButton type="submit" loading={status === 'loading'} style={{ flexShrink: 0 }}>Subscribe</NovaButton>
          </form>
        )}
        {status === 'error' && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: colors.danger }}>Something went wrong — try again.</p>}
      </div>
    </div>
  );
}

registerNovaSection('newsletter', (section: Section, _blocks, colors: NovaSectionColors) => <NewsletterSection section={section} colors={colors} />);
