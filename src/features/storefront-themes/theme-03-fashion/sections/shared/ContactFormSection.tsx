import { useId, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ts, tt } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiSubmitContactMessage } from '@/api/services/storeContact';
import { copyText } from '../../../sectionCopy';
import { fashionTheme as t } from '../../theme.config';
import { controlStyle } from '../../ui/controlStyle';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

export function ContactFormSection({ section, colors }: SharedSectionProps) {
  const { store } = useStorefront();
  const uid = useId();
  const s = section.settings;
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues(v => ({ ...v, [key]: e.target.value }));
  const label = 'mb-1.5 block text-sm font-medium';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      await apiSubmitContactMessage(store.storeId, {
        name: values.name.trim(), email: values.email.trim(), message: values.message.trim(),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}), website: values.website,
      });
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : tt('sections.contactError', 'We could not send your message. Please try again.'));
      setStatus('error');
    }
  }

  return (
    <SectionShell colors={colors} heading={s.heading} align="center">
      <div className="mx-auto max-w-[680px]" style={{ fontFamily: t.fonts.body }}>
        {s.intro && <p className="m-0 mb-8 text-center text-base leading-relaxed" style={{ color: colors.inkMuted }}>{s.intro}</p>}
        {status === 'done' ? (
          <div role="status" className="flex flex-col items-center gap-3 px-6 py-12 text-center" style={{ background: colors.bgAlt, borderRadius: 28 }}>
            <CheckCircle2 size={32} style={{ color: t.colors.success }} aria-hidden />
            <p className="m-0 text-lg font-medium" style={{ color: colors.ink }}>{s.successMessage || tt('sections.contactThanks', 'Thanks, we got your message and will reply soon.')}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 p-6 md:p-8" style={{ background: colors.bgAlt, borderRadius: 28, color: colors.ink }}>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
              <div><label htmlFor={`${uid}-name`} className={label}>{copyText(s, 'nameLabel', 'Name')}</label><input id={`${uid}-name`} required maxLength={80} value={values.name} onChange={set('name')} autoComplete="name" style={controlStyle()} /></div>
              <div><label htmlFor={`${uid}-email`} className={label}>{copyText(s, 'emailLabel', 'Email')}</label><input id={`${uid}-email`} type="email" required maxLength={120} value={values.email} onChange={set('email')} autoComplete="email" style={controlStyle()} /></div>
            </div>
            {s.showPhone !== false && (
              <div><label htmlFor={`${uid}-phone`} className={label}>{copyText(s, 'phoneLabel', 'Phone (optional)')}</label><input id={`${uid}-phone`} type="tel" maxLength={25} value={values.phone} onChange={set('phone')} autoComplete="tel" style={controlStyle()} /></div>
            )}
            <div><label htmlFor={`${uid}-message`} className={label}>{copyText(s, 'messageLabel', 'Message')}</label><textarea id={`${uid}-message`} required rows={6} maxLength={3000} value={values.message} onChange={set('message')} style={{ ...controlStyle(), minHeight: 140, resize: 'vertical' }} /></div>
            {/* Bot trap: invisible to people, so only automated fills reach it. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor={`${uid}-website`}>{ts('pg.website', 'Website')}</label>
              <input id={`${uid}-website`} tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
            </div>
            {status === 'error' && <p role="alert" className="m-0 text-sm" style={{ color: t.colors.danger }}>{error}</p>}
            <button type="submit" disabled={status === 'sending'} aria-busy={status === 'sending' || undefined} className="fx-pill self-center"
              style={{ background: t.colors.accent, color: t.colors.accentInk, border: 'none', borderRadius: t.buttonRadiusPx, minWidth: 180 }}>
              {status === 'sending' && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {status === 'sending' ? tt('sections.sending', 'Sending...') : (s.buttonLabel || tt('sections.sendMessage', 'Send message'))}
            </button>
          </form>
        )}
      </div>
    </SectionShell>
  );
}
