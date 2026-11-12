import { useId, type ReactNode } from 'react';
import { CheckCircle2, Loader2, Paperclip, Star, X } from 'lucide-react';
import { ts, tt } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useContactForm } from '../../../core/forms/useContactForm';
import { TurnstileBox } from '../../../core/forms/TurnstileBox';
import { fileAccept, successRedirect, type ContactFormField } from '../../../core/forms/contactFormFields';
import { localizedCountryOptions } from '../../../core/countryOptions';
import { fashionTheme as t } from '../../theme.config';
import { controlStyle } from '../../ui/controlStyle';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

const AUTOCOMPLETE: Record<string, string> = { name: 'name', email: 'email', phone: 'tel', url: 'url' };
const SPAN: Record<string, string> = { full: 'sm:col-span-12', half: 'sm:col-span-6', third: 'sm:col-span-4', quarter: 'sm:col-span-3' };

export function ContactFormSection({ section, colors }: SharedSectionProps) {
  const { store } = useStorefront();
  const uid = useId();
  const s = section.settings;
  const form = useContactForm(store.storeId, section);
  const label = 'mb-1.5 block text-sm font-medium';

  /** One field of the seller's form, drawn in this theme's look. */
  function renderField(f: ContactFormField) {
    if (f.type === 'hidden') return null;
    const id = `${uid}-${f.id}`;
    const helpId = f.helpText ? `${id}-help` : undefined;
    const invalid = form.invalidId === f.id;
    const style = controlStyle(invalid);
    const value = form.values[f.id];
    const text = typeof value === 'string' ? value : '';
    const chosen = Array.isArray(value) ? value : [];
    const star = f.required ? <span aria-hidden="true"> *</span> : null;
    const help = f.helpText ? <p id={helpId} className="m-0 mt-1.5 text-[13px] leading-snug" style={{ color: colors.inkMuted }}>{f.helpText}</p> : null;
    const wrap = (node: ReactNode) => <div key={f.id} className={SPAN[f.width ?? 'full'] ?? SPAN.full}>{node}</div>;

    if (f.type === 'heading') return wrap(<h3 className="m-0 mt-2 text-xl font-medium" style={{ fontFamily: t.fonts.display }}>{f.label}</h3>);
    if (f.type === 'paragraph') return wrap(<p className="m-0 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: colors.inkMuted }}>{f.label}</p>);

    if (f.type === 'radio' || (f.type === 'checkbox' && f.options?.length)) {
      const isRadio = f.type === 'radio';
      return wrap(
        <fieldset className="m-0 border-0 p-0" aria-describedby={helpId}>
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
          {help}
        </fieldset>,
      );
    }
    if (f.type === 'checkbox' || f.type === 'consent') {
      // One tick box: the label is the sentence next to it.
      return wrap(
        <>
          <label className="flex items-start gap-2.5 text-[15px]">
            <input type="checkbox" checked={text === 'true'} required={f.required} aria-describedby={helpId} onChange={e => form.setValue(f.id, e.target.checked ? 'true' : '')}
              style={{ accentColor: t.colors.accent, width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
            <span>{f.label}{star}</span>
          </label>
          {help}
        </>,
      );
    }
    if (f.type === 'file') {
      const file = form.files[f.id];
      return wrap(
        <>
          <label htmlFor={id} className={label}>{f.label}{star}</label>
          {file && !file.error ? (
            <div className="flex items-center gap-2 px-4 py-3" style={{ ...style, minHeight: 48 }}>
              <Paperclip size={16} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              {file.uploading
                ? <Loader2 size={16} className="animate-spin" aria-label={tt('sections.contactUploading', 'Uploading...')} />
                : <button type="button" onClick={() => form.removeFile(f.id)} aria-label={tt('sections.contactRemoveFile', 'Remove {{name}}', { name: file.name })} className="cursor-pointer border-0 bg-transparent p-0.5"><X size={16} aria-hidden /></button>}
            </div>
          ) : (
            <input id={id} type="file" accept={fileAccept(f)} aria-describedby={helpId}
              onChange={e => { const chosen = e.target.files?.[0]; if (chosen) void form.attachFile(f, chosen); e.target.value = ''; }} style={{ ...style, padding: '10px 14px' }} />
          )}
          {file?.error && <p role="alert" className="m-0 mt-1.5 text-sm" style={{ color: t.colors.danger }}>{file.error}</p>}
          {help}
        </>,
      );
    }
    if (f.type === 'rating') {
      const current = Number(text) || 0;
      return wrap(
        <fieldset className="m-0 border-0 p-0" aria-describedby={helpId}>
          <legend className={label}>{f.label}{star}</legend>
          <div role="radiogroup" aria-label={f.label} className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" role="radio" aria-checked={current === n} aria-label={tt('sections.contactStars', '{{n}} of 5 stars', { n })}
                onClick={() => form.setValue(f.id, String(n))} className="cursor-pointer border-0 bg-transparent p-0.5">
                <Star size={28} fill={n <= current ? t.colors.accent : 'none'} color={t.colors.accent} aria-hidden />
              </button>
            ))}
          </div>
          {help}
        </fieldset>,
      );
    }
    return wrap(
      <>
        <label htmlFor={id} className={label}>{f.label}{star}</label>
        {f.type === 'textarea' ? (
          <textarea id={id} required={f.required} rows={6} minLength={f.minLength} maxLength={Math.min(f.maxLength ?? 3000, 3000)} placeholder={f.placeholder} value={text}
            aria-describedby={helpId} onChange={e => form.setValue(f.id, e.target.value)} style={{ ...style, minHeight: 140, resize: 'vertical' }} />
        ) : f.type === 'dropdown' ? (
          <select id={id} required={f.required} value={text} aria-describedby={helpId} onChange={e => form.setValue(f.id, e.target.value)} style={style}>
            <option value="">{f.placeholder || tt('sections.contactChoose', 'Choose...')}</option>
            {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : f.type === 'country' ? (
          <select id={id} required={f.required} value={text} aria-describedby={helpId} onChange={e => form.setValue(f.id, e.target.value)} style={style} autoComplete="country">
            <option value="">{f.placeholder || tt('sections.contactChoose', 'Choose...')}</option>
            {localizedCountryOptions().map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        ) : (
          <input
            id={id} required={f.required} placeholder={f.placeholder} value={text} aria-describedby={helpId} onChange={e => form.setValue(f.id, e.target.value)}
            type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : f.type === 'url' ? 'url' : 'text'}
            min={f.type === 'number' ? f.min : undefined} max={f.type === 'number' ? f.max : undefined} step={f.type === 'number' ? 'any' : undefined}
            minLength={f.type === 'text' || f.type === 'name' ? f.minLength : undefined}
            maxLength={f.type === 'email' ? 120 : f.type === 'phone' ? 25 : f.type === 'name' ? 80 : f.type === 'text' ? Math.min(f.maxLength ?? 300, 300) : 300}
            autoComplete={AUTOCOMPLETE[f.type]} style={style}
          />
        )}
        {help}
      </>,
    );
  }

  return (
    <SectionShell colors={colors} heading={s.heading} align="center">
      <div className="mx-auto max-w-[680px]" style={{ fontFamily: t.fonts.body }}>
        {s.intro && <p className="m-0 mb-8 text-center text-base leading-relaxed" style={{ color: colors.inkMuted }}>{s.intro}</p>}
        {form.status === 'done' ? (
          <div role="status" className="flex flex-col items-center gap-3 px-6 py-12 text-center" style={{ background: colors.bgAlt, borderRadius: 28 }}>
            <CheckCircle2 size={32} style={{ color: t.colors.success }} aria-hidden />
            <p className="m-0 text-lg font-medium" style={{ color: colors.ink }}>
              {successRedirect(s) ? tt('sections.contactRedirecting', 'Thank you! Taking you on...') : (s.successMessage || tt('sections.contactThanks', 'Thanks, we got your message and will reply soon.'))}
            </p>
          </div>
        ) : (
          <form onSubmit={form.submit} className="flex flex-col gap-4 p-6 md:p-8" style={{ background: colors.bgAlt, borderRadius: 28, color: colors.ink }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              {form.fields.map(renderField)}
            </div>
            {form.captcha && <TurnstileBox key={form.captchaRound} siteKey={form.captcha.siteKey} onToken={form.setCaptchaToken} />}
            {/* Bot trap: invisible to people, so only automated fills reach it. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor={`${uid}-website`}>{ts('pg.website', 'Website')}</label>
              <input id={`${uid}-website`} tabIndex={-1} autoComplete="off" value={form.website} onChange={e => form.setWebsite(e.target.value)} />
            </div>
            {form.status === 'error' && <p role="alert" className="m-0 text-sm" style={{ color: t.colors.danger }}>{form.error}</p>}
            <button type="submit" disabled={form.status === 'sending'} aria-busy={form.status === 'sending' || undefined} className="fx-pill self-center"
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
