import { useId, useState, type ReactNode } from 'react';
import { CheckCircle2, Loader2, Paperclip, PenLine, Star, X } from 'lucide-react';
import { ts, tt } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useContactForm } from '../../../core/forms/useContactForm';
import { useSignaturePad } from '../../../core/forms/useSignaturePad';
import { TurnstileBox } from '../../../core/forms/TurnstileBox';
import { MAX_FILES, computeTotal, fileAccept, formatTotal, successRedirect, type ContactFormField } from '../../../core/forms/contactFormFields';
import { localizedCountryOptions } from '../../../core/countryOptions';
import { baseTheme as t } from '../../theme.base';
import { controlStyle } from '../../ui/controlStyle';
import { LedupDialog } from '../../ui/ledupDialog';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

const AUTOCOMPLETE: Record<string, string> = { name: 'name', email: 'email', phone: 'tel', url: 'url' };
const SPAN: Record<string, string> = { full: 'sm:col-span-12', half: 'sm:col-span-6', third: 'sm:col-span-4', quarter: 'sm:col-span-3' };

type FormApi = ReturnType<typeof useContactForm>;

/** A signature box: draw, then "Use this signature" turns it into a private PNG attached like any file. */
function SignatureField({ field, form, labelClass, star, help, style, inkColor, mutedColor }: {
  field: ContactFormField; form: FormApi; labelClass: string; star: ReactNode; help: ReactNode; style: React.CSSProperties; inkColor: string; mutedColor: string;
}) {
  const entries = form.filesOf(field.id);
  const done = entries.find(([, e]) => !e.error);
  const err = entries.find(([, e]) => e.error)?.[1];
  const pad = useSignaturePad({ color: inkColor, onDone: file => { void form.attachFile(field, file); } });
  return (
    <>
      <p className={labelClass}>{field.label}{star}</p>
      {done ? (
        <div className="flex items-center gap-2 px-4 py-3" style={{ ...style, minHeight: 48 }}>
          <PenLine size={16} aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm">{done[1].uploading ? tt('sections.contactUploading', 'Uploading...') : tt('sections.contactSigned', 'Signature added')}</span>
          {!done[1].uploading && <button type="button" onClick={() => form.removeFile(done[0])} aria-label={tt('sections.contactRemoveFile', 'Remove {{name}}', { name: field.label })} className="cursor-pointer border-0 bg-transparent p-0.5"><X size={16} aria-hidden /></button>}
        </div>
      ) : (
        <div>
          <canvas ref={pad.canvasRef} width={600} height={180} aria-label={field.label} {...pad.handlers}
            style={{ ...style, padding: 0, height: 140, touchAction: 'none', cursor: 'crosshair', borderRadius: Math.min(Number(style.borderRadius) || 0, 24) }} />
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span style={{ color: mutedColor }}>{pad.hasInk ? '' : tt('sections.contactSignHere', 'Sign here with your finger or mouse')}</span>
            <button type="button" onClick={pad.clear} disabled={!pad.hasInk} className="ms-auto cursor-pointer border-0 bg-transparent p-0 underline disabled:opacity-40">{tt('sections.contactClear', 'Clear')}</button>
            <button type="button" onClick={pad.save} disabled={!pad.hasInk} className="cursor-pointer border-0 bg-transparent p-0 font-semibold underline disabled:opacity-40">{tt('sections.contactUseSignature', 'Use this signature')}</button>
          </div>
        </div>
      )}
      {err?.error && <p role="alert" className="m-0 mt-1.5 text-sm" style={{ color: t.colors.danger }}>{err.error}</p>}
      {help}
    </>
  );
}

export function ContactFormSection({ section, colors }: SharedSectionProps) {
  const { store } = useStorefront();
  const uid = useId();
  const s = section.settings;
  const form = useContactForm(store.storeId, section);
  const [open, setOpen] = useState(false);
  const popup = s.display === 'popup';
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

    if (f.type === 'step') return null;
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
    if (f.type === 'total') {
      return wrap(
        <div className="flex items-baseline justify-between gap-3 px-4 py-3" style={{ ...style, minHeight: 48 }}>
          <span className="text-sm font-medium">{f.label}</span>
          <output dir="ltr" aria-live="polite" className="text-lg font-semibold">{formatTotal(f, computeTotal(form.fields, form.values))}</output>
        </div>,
      );
    }
    if (f.type === 'signature') {
      return wrap(<SignatureField field={f} form={form} labelClass={label} star={star} help={help} style={style} inkColor={t.colors.ink} mutedColor={colors.inkMuted} />);
    }
    if (f.type === 'slider') {
      const lo = f.min ?? 0; const hi = f.max ?? 100; const st = f.step ?? 1;
      const picked = text !== '' ? Number(text) : null;
      return wrap(
        <>
          <label htmlFor={id} className={label}>{f.label}{star}</label>
          <div className="flex items-center gap-3">
            <input id={id} type="range" min={lo} max={hi} step={st} value={picked ?? Math.round((lo + hi) / 2)} aria-describedby={helpId}
              onChange={e => form.setValue(f.id, e.target.value)} style={{ accentColor: t.colors.accent, width: '100%' }} />
            <output htmlFor={id} dir="ltr" className="min-w-[3ch] text-sm font-medium" style={{ color: picked === null ? colors.inkMuted : colors.ink }}>{picked ?? '—'}</output>
          </div>
          {help}
        </>,
      );
    }
    if (f.type === 'file') {
      const entries = form.filesOf(f.id);
      const attached = entries.filter(([, e]) => !e.error);
      const error = entries.find(([, e]) => e.error)?.[1];
      const full = attached.length >= (f.multiple ? MAX_FILES : 1);
      return wrap(
        <>
          <label htmlFor={id} className={label}>{f.label}{star}</label>
          {attached.map(([key, file]) => (
            <div key={key} className="mb-2 flex items-center gap-2 px-4 py-3" style={{ ...style, minHeight: 48 }}>
              <Paperclip size={16} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              {file.uploading
                ? <Loader2 size={16} className="animate-spin" aria-label={tt('sections.contactUploading', 'Uploading...')} />
                : <button type="button" onClick={() => form.removeFile(key)} aria-label={tt('sections.contactRemoveFile', 'Remove {{name}}', { name: file.name })} className="cursor-pointer border-0 bg-transparent p-0.5"><X size={16} aria-hidden /></button>}
            </div>
          ))}
          {!full && (
            <input id={id} type="file" multiple={!!f.multiple} accept={fileAccept(f)} aria-describedby={helpId}
              onChange={e => { Array.from(e.target.files ?? []).slice(0, f.multiple ? Math.max(1, MAX_FILES - attached.length) : 1).forEach(chosen => { void form.attachFile(f, chosen); }); e.target.value = ''; }} style={{ ...style, padding: '10px 14px' }} />
          )}
          {error?.error && <p role="alert" className="m-0 mt-1.5 text-sm" style={{ color: t.colors.danger }}>{error.error}</p>}
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
            aria-describedby={helpId} onChange={e => form.setValue(f.id, e.target.value)} style={{ ...style, minHeight: 140, resize: 'vertical', borderRadius: Math.min(Number(style.borderRadius) || 0, 24) }} />
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

  const formBlock = (
    <>
        {form.status === 'done' ? (
          <div role="status" className="flex flex-col items-center gap-3 px-6 py-12 text-center" style={{ background: colors.bgAlt, borderRadius: t.sectionRadiusPx }}>
            <CheckCircle2 size={32} style={{ color: t.colors.success }} aria-hidden />
            <p className="m-0 text-lg font-medium" style={{ color: colors.ink }}>
              {successRedirect(s) ? tt('sections.contactRedirecting', 'Thank you! Taking you on...') : (s.successMessage || tt('sections.contactThanks', 'Thanks, we got your message and will reply soon.'))}
            </p>
          </div>
        ) : (
          <form onSubmit={form.submit} className="flex flex-col gap-4 p-6 md:p-8" style={{ background: colors.bgAlt, borderRadius: t.sectionRadiusPx, color: colors.ink }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              {form.page.fields.map(renderField)}
            </div>
            {form.stepCount > 1 && (
              <div className="flex flex-col gap-2" aria-live="polite">
                <p className="m-0 text-sm font-medium" style={{ color: colors.inkMuted }}>
                  {tt('sections.contactStepOf', 'Step {{n}} of {{total}}', { n: form.stepIndex + 1, total: form.stepCount })}{form.page.title ? ` · ${form.page.title}` : ''}
                </p>
                <div className="h-1.5 w-full overflow-hidden" style={{ background: t.colors.border, borderRadius: 999 }}>
                  <div style={{ width: `${((form.stepIndex + 1) / form.stepCount) * 100}%`, height: '100%', background: t.colors.accent, transition: 'width .25s' }} />
                </div>
              </div>
            )}
            {form.isLast && form.captcha && <TurnstileBox key={form.captchaRound} siteKey={form.captcha.siteKey} onToken={form.setCaptchaToken} />}
            {/* Bot trap: invisible to people, so only automated fills reach it. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor={`${uid}-website`}>{ts('pg.website', 'Website')}</label>
              <input id={`${uid}-website`} tabIndex={-1} autoComplete="off" value={form.website} onChange={e => form.setWebsite(e.target.value)} />
            </div>
            {form.status === 'error' && <p role="alert" className="m-0 text-sm" style={{ color: t.colors.danger }}>{form.error}</p>}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {form.stepIndex > 0 && <button type="button" onClick={form.back} className="lb-pill" style={{ background: 'transparent', color: colors.ink, border: `1px solid ${t.colors.border}`, borderRadius: t.buttonRadiusPx, minWidth: 120 }}>{tt('sections.contactBack', 'Back')}</button>}
              {form.isLast ? (
              <button type="submit" disabled={form.status === 'sending'} aria-busy={form.status === 'sending' || undefined} className="lb-pill"
                style={{ background: t.colors.accent, color: t.colors.accentInk, border: 'none', borderRadius: t.buttonRadiusPx, minWidth: 180 }}>
                {form.status === 'sending' && <Loader2 size={16} className="animate-spin" aria-hidden />}
                {form.status === 'sending' ? tt('sections.sending', 'Sending...') : (s.buttonLabel || tt('sections.sendMessage', 'Send message'))}
              </button>
              ) : (
              <button type="submit" className="lb-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, border: 'none', borderRadius: t.buttonRadiusPx, minWidth: 140 }}>{tt('sections.contactNext', 'Next')}</button>
              )}
            </div>
          </form>
        )}
    </>
  );

  if (popup) {
    const label = s.popupButtonLabel || s.formName || tt('sections.sendMessage', 'Send message');
    return (
      <SectionShell colors={colors} heading={s.heading} align="center">
        <div className="mx-auto flex max-w-[680px] flex-col items-center gap-6" style={{ fontFamily: t.fonts.body }}>
          {s.intro && <p className="m-0 text-center text-base leading-relaxed" style={{ color: colors.inkMuted }}>{s.intro}</p>}
          <button type="button" onClick={() => setOpen(true)} className="lb-pill" aria-haspopup="dialog"
            style={{ background: t.colors.accent, color: t.colors.accentInk, border: 'none', borderRadius: t.buttonRadiusPx, minWidth: 180 }}>{label}</button>
        </div>
        {open && <LedupDialog title={s.formName || s.heading || label} onClose={() => setOpen(false)} size={680}>{formBlock}</LedupDialog>}
      </SectionShell>
    );
  }

  return (
    <SectionShell colors={colors} heading={s.heading} align="center">
      <div className="mx-auto max-w-[680px]" style={{ fontFamily: t.fonts.body }}>
        {s.intro && <p className="m-0 mb-8 text-center text-base leading-relaxed" style={{ color: colors.inkMuted }}>{s.intro}</p>}
        {formBlock}
      </div>
    </SectionShell>
  );
}
