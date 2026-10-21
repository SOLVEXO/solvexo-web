import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/comman/ui';
import { DialogShell } from '@/components/comman/ui/DialogShell';
import type { CustomerEmailSetting } from '@/api/services/storeNotifications';
import { isRtlLanguage, languageName } from '@/utils/languages';
import { findUnknownTags } from '@/utils/translationProgress';
import { errMsg } from './useCustomerEmailSettings';

interface Props {
  email: CustomerEmailSetting;
  locale: string;
  /** Saved translation for this language, if any. */
  translation: { subject: string; body: string } | undefined;
  /** Built-in text for this language (used when the seller has not translated). */
  builtIn?: { subject: string; body: string };
  /** value = save, null = remove (back to English). Rejects with the server's message. */
  onSave: (key: string, locale: string, value: { subject: string; body: string } | null) => Promise<void>;
  onClose: () => void;
  headerExtra: ReactNode;
  onDirtyChange: (dirty: boolean) => void;
  /** The language the store's own email text is written in (left column); default English. */
  sourceLanguage?: string;
  /** Machine translation of this email into the language; the text lands in the boxes for review. */
  onAutoTranslate?: () => Promise<{ subject: string; body: string }>;
}

/** Write one customer email in another language: the English text on the left (read only), the translation on the right. */
export function EmailTranslationEditor({ email, locale, translation, builtIn, onSave, onClose, headerExtra, onDirtyChange, sourceLanguage = 'en', onAutoTranslate }: Props) {
  const [translating, setTranslating] = useState(false);
  const autoTranslate = async () => {
    if (!onAutoTranslate || translating) return;
    setTranslating(true);
    setError('');
    try {
      const out = await onAutoTranslate();
      setSubject(out.subject);
      setBody(out.body);
    } catch (err) {
      setError(errMsg(err, 'Automatic translation failed.'));
    } finally {
      setTranslating(false);
    }
  };
  const englishSubject = email.subject ?? email.defaultSubject;
  const englishBody = email.body ?? email.defaultBody;
  const [subject, setSubject] = useState(translation?.subject ?? '');
  const [body, setBody] = useState(translation?.body ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const dirty = subject !== (translation?.subject ?? '') || body !== (translation?.body ?? '');
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const unknown = useMemo(() => findUnknownTags(`${subject}\n${body}`, email.variables), [subject, body, email.variables]);
  const dir = isRtlLanguage(locale) ? 'rtl' : 'ltr';
  const bothFilled = !!subject.trim() && !!body.trim();

  const requestClose = () => { if (dirty && !saving) setConfirmDiscard(true); else onClose(); };

  const insertTag = (tag: string) => {
    const el = bodyRef.current;
    const text = `{{${tag}}}`;
    if (!el) { setBody(b => `${b}${text}`); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(`${body.slice(0, start)}${text}${body.slice(end)}`);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + text.length, start + text.length); });
  };

  const run = async (value: { subject: string; body: string } | null) => {
    setSaving(true);
    setError('');
    try {
      await onSave(email.key, locale, value);
      onClose();
    } catch (err: unknown) {
      setError(errMsg(err, 'Failed to save.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      onClose={requestClose}
      ariaLabel={`Edit ${email.label} email in ${languageName(locale)}`}
      className="w-[calc(100vw-24px)] max-w-[1120px] max-h-[94vh] flex flex-col bg-white rounded-xl border border-bone overflow-hidden [&_.surface-panel]:!shadow-none [&_button]:!shadow-none [&_button:hover]:!shadow-none"
    >
      <div className="px-5 py-3.5 border-b border-bone flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-carbon">{email.label}</h3>
          <p className="text-[12px] text-slate mt-0.5">{email.description}</p>
          <div className="mt-2">{headerExtra}</div>
        </div>
        <button type="button" onClick={requestClose} aria-label="Close" className="text-slate hover:text-charcoal bg-transparent border-0 cursor-pointer p-1"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto grid lg:grid-cols-2 min-h-0">
        <div className="p-5 flex flex-col gap-4 bg-cream/60 lg:border-r border-bone min-w-0">
          <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em]">{languageName(sourceLanguage)} (what customers get today)</p>
          <div>
            <p className="text-[12px] font-medium text-charcoal mb-1.5">Subject</p>
            <div className="rounded-md bg-white border border-bone px-3 py-2 text-[13px] text-charcoal whitespace-pre-wrap break-words">{englishSubject}</div>
          </div>
          <div>
            <p className="text-[12px] font-medium text-charcoal mb-1.5">Message</p>
            <div className="rounded-md bg-white border border-bone px-3 py-2 text-[13px] text-charcoal whitespace-pre-wrap break-words max-h-[320px] overflow-y-auto">{englishBody}</div>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em]">{languageName(locale)}</p>
            {onAutoTranslate && <Button size="xs" variant="outline" loading={translating} onClick={() => void autoTranslate()}>Translate automatically</Button>}
            {!translation && <span role="status" className="text-[11px] font-semibold rounded-full bg-cream text-slate px-2 py-0.5">{builtIn ? `Untranslated: using built-in ${languageName(locale)} text` : 'Untranslated: using English'}</span>}
          </div>
          <Input label={`Subject (${languageName(locale)})`} dir={dir} lang={locale} placeholder={builtIn?.subject} value={subject} maxLength={200} onChange={e => setSubject(e.target.value)} />
          <Textarea ref={bodyRef} label={`Message (${languageName(locale)})`} dir={dir} lang={locale} placeholder={builtIn?.body} rows={12} maxLength={5000} value={body} onChange={e => setBody(e.target.value)} />
          <div>
            <p className="text-[11.5px] text-slate mb-1.5">Insert a placeholder, it is filled in for each customer. Keep the same placeholders as the English text:</p>
            <div className="flex flex-wrap gap-1.5">
              {email.variables.map(v => (
                <button key={v} type="button" onClick={() => insertTag(v)} className="text-[11.5px] font-mono bg-cream border border-bone rounded px-2 py-0.5 hover:border-brand-orange cursor-pointer">
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate mt-2">A line is left out when its placeholder has no value. Plain text only. Fill in both the subject and the message to save.</p>
          </div>
          {unknown.length > 0 && (
            <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              Unknown placeholder{unknown.length > 1 ? 's' : ''}: {unknown.map(u => `{{${u}}}`).join(', ')}. Allowed: {email.variables.map(v => `{{${v}}}`).join(', ')}.
            </p>
          )}
          {error && <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}</p>}
        </div>
      </div>

      {confirmDiscard && (
        <div role="alertdialog" aria-label="Discard changes" className="px-5 py-3 bg-error-bg border-t border-bone flex flex-wrap items-center justify-between gap-2 shrink-0">
          <p className="text-[12.5px] text-error font-medium">Discard your changes to this translation?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmDiscard(false)}>Keep editing</Button>
            <Button size="sm" variant="danger" onClick={onClose}>Discard</Button>
          </div>
        </div>
      )}

      <div className="px-5 py-3 border-t border-bone flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white">
        <div>
          {translation && (
            <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={() => run(null)} disabled={saving}>Reset to English</Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={requestClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={() => run({ subject: subject.trim(), body: body.trim() })} loading={saving} disabled={!dirty || !bothFilled || unknown.length > 0}>Save</Button>
        </div>
      </div>
    </DialogShell>
  );
}
