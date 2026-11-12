import { useId, type ReactNode } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ts, tt } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useContactForm } from '../../../core/forms/useContactForm';
import type { ContactFormField } from '../../../core/forms/contactFormFields';
import { baseTheme as t } from '../../theme.base';
import { controlStyle } from '../../ui/controlStyle';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

const AUTOCOMPLETE: Record<string, string> = { name: 'name', email: 'email', phone: 'tel' };

export function ContactFormSection({ section, colors }: SharedSectionProps) {
  const { store } = useStorefront();
  const uid = useId();
  const s = section.settings;
  const form = useContactForm(store.storeId, section);
  const label = 'mb-1.5 block text-sm font-medium';

  /** One field of the seller's form, drawn in this theme's look. */
  function renderField(f: ContactFormField) {
    const id = `${uid}-${f.id}`;
    const invalid = form.invalidId === f.id;
    const style = controlStyle(invalid);
    const value = form.values[f.id];
    const text = typeof value === 'string' ? value : '';
    const chosen = Array.isArray(value) ? value : [];
    const star = f.required ? <span aria-hidden="true"> *</span> : null;
    const wrap = (node: ReactNode) => (
      <div key={f.id} className={f.width === 'half' ? 'sm:col-span-1' : 'sm:col-span-2'}>{node}</div>
    );

    if (f.type === 'radio' || (f.type === 'checkbox' && f.options?.length)) {
      const isRadio = f.type === 'radio';
      return wrap(
        <fieldset className="m-0 border-0 p-0" aria-required={f.required || undefined}>
          <legend className={label}>{f.label}{star}</legend>
          <div className="flex flex-col gap-2">
            {(f.options ?? []).map(o => (
              <label key={o} className="flex items-center gap-2.5 text-[15px]">
                <input
                  type={isRadio ? 'radio' : 'checkbox'} name={`${uid}-${f.id}`} value={o}
                  checked={isRadio ? text === o : chosen.includes(o)}
                  required={isRadio && f.required}
                  onChange={e => (isRadio ? form.setValue(f.id, o) : form.toggleChoice(f.id, o, e.target.checked))}
                  style={{ accentColor: t.colors.accent, width: 18, height: 18 }}
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
        </fieldset>,
      );
    }
    if (f.type === 'checkbox') {
      // A single tick box (no choices): the label is the sentence next to it.
      return wrap(
        <label className="flex items-center gap-2.5 text-[15px]">
          <input type="checkbox" checked={text === 'true'} required={f.required} onChange={e => form.setValue(f.id, e.target.checked ? 'true' : '')}
            style={{ accentColor: t.colors.accent, width: 18, height: 18 }} />
          <span>{f.label}{star}</span>
        </label>,
      );
    }
    return wrap(
      <>
        <label htmlFor={id} className={label}>{f.label}{star}</label>
        {f.type === 'textarea' ? (
          <textarea id={id} required={f.required} rows={6} maxLength={3000} placeholder={f.placeholder} value={text}
            onChange={e => form.setValue(f.id, e.target.value)} style={{ ...style, minHeight: 140, resize: 'vertical' }} />
        ) : f.type === 'dropdown' ? (
          <select id={id} required={f.required} value={text} onChange={e => form.setValue(f.id, e.target.value)} style={style}>
            <option value="">{f.placeholder || tt('sections.contactChoose', 'Choose...')}</option>
            {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            id={id} required={f.required} placeholder={f.placeholder} value={text} onChange={e => form.setValue(f.id, e.target.value)}
            type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
            maxLength={f.type === 'email' ? 120 : f.type === 'phone' ? 25 : f.type === 'name' ? 80 : 300}
            autoComplete={AUTOCOMPLETE[f.type]} style={style}
          />
        )}
      </>,
    );
  }

  return (
    <SectionShell colors={colors} heading={s.heading} align="center">
      <div className="mx-auto max-w-[680px]" style={{ fontFamily: t.fonts.body }}>
        {s.intro && <p className="m-0 mb-8 text-center text-base leading-relaxed" style={{ color: colors.inkMuted }}>{s.intro}</p>}
        {form.status === 'done' ? (
          <div role="status" className="flex flex-col items-center gap-3 px-6 py-12 text-center" style={{ background: colors.bgAlt, borderRadius: t.sectionRadiusPx }}>
            <CheckCircle2 size={32} style={{ color: t.colors.success }} aria-hidden />
            <p className="m-0 text-lg font-medium" style={{ color: colors.ink }}>{s.successMessage || tt('sections.contactThanks', 'Thanks, we got your message and will reply soon.')}</p>
          </div>
        ) : (
          <form onSubmit={form.submit} className="flex flex-col gap-4 p-6 md:p-8" style={{ background: colors.bgAlt, borderRadius: t.sectionRadiusPx, color: colors.ink }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {form.fields.map(renderField)}
            </div>
            {/* Bot trap: invisible to people, so only automated fills reach it. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor={`${uid}-website`}>{ts('pg.website', 'Website')}</label>
              <input id={`${uid}-website`} tabIndex={-1} autoComplete="off" value={form.website} onChange={e => form.setWebsite(e.target.value)} />
            </div>
            {form.status === 'error' && <p role="alert" className="m-0 text-sm" style={{ color: t.colors.danger }}>{form.error}</p>}
            <button type="submit" disabled={form.status === 'sending'} aria-busy={form.status === 'sending' || undefined} className="lb-pill self-center"
              style={{ background: t.colors.accent, color: t.colors.accentInk, border: 'none', borderRadius: t.buttonRadiusPx, minWidth: 180 }}>
              {form.status === 'sending' && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {form.status === 'sending' ? tt('sections.sending', 'Sending...') : (s.buttonLabel || tt('sections.sendMessage', 'Send message'))}
            </button>
          </form>
        )}
      </div>
    </SectionShell>
  );
}
