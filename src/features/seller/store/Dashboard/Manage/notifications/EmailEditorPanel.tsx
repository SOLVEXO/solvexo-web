import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Monitor, RotateCcw, Send, Smartphone, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button, Input, Textarea } from '@/components/comman/ui';
import { DialogShell } from '@/components/comman/ui/DialogShell';
import {
  apiPreviewCustomerEmail,
  apiSendTestCustomerEmail,
  type CustomerEmailPreview,
  type CustomerEmailSetting,
} from '@/api/services/storeNotifications';
import { errMsg } from './useCustomerEmailSettings';

interface Props {
  storeId: string;
  email: CustomerEmailSetting;
  onClose: () => void;
  /** Saves (or resets) this email's text; rejects with the server's message. */
  onSave: (key: string, change: { subject?: string; body?: string; reset?: boolean }) => Promise<void>;
  /** Optional language switcher shown under the title (English is edited here; other languages by EmailTranslationEditor). */
  headerExtra?: ReactNode;
  /** Reports unsaved edits so a language switch can ask before discarding them. */
  onDirtyChange?: (dirty: boolean) => void;
}

type PreviewState = { key: string; data?: CustomerEmailPreview; error?: string } | null;

/** Edit one customer email: subject + message on the left, a live preview of exactly what the customer gets on the right. */
export function EmailEditorPanel({ storeId, email, onClose, onSave, headerExtra, onDirtyChange }: Props) {
  const initialSubject = email.subject ?? email.defaultSubject;
  const initialBody = email.body ?? email.defaultBody;
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [preview, setPreview] = useState<PreviewState>(null);
  const [test, setTest] = useState<{ status: 'idle' | 'sending' | 'ok' | 'error'; message: string }>({ status: 'idle', message: '' });
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const dirty = subject !== initialSubject || body !== initialBody;
  const draftKey = `${subject}\u0000${body}`;
  const previewLoading = preview?.key !== draftKey;

  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  // Live preview: re-render a moment after the seller stops typing. A stale answer is ignored.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      apiPreviewCustomerEmail(storeId, { event: email.key, subject, body })
        .then(res => { if (!cancelled) setPreview({ key: draftKey, data: res.data }); })
        .catch((err: unknown) => { if (!cancelled) setPreview({ key: draftKey, error: errMsg(err, 'Could not build the preview.') }); });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [storeId, email.key, subject, body, draftKey]);

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

  // Saving text identical to the built-in default stores nothing (the store keeps following the default).
  const save = async (reset = false) => {
    setSaving(true);
    setError('');
    const same = subject.trim() === email.defaultSubject && body.trim() === email.defaultBody;
    try {
      await onSave(email.key, reset || same ? { reset: true } : { subject: subject.trim(), body: body.trim() });
      onClose();
    } catch (err: unknown) {
      setError(errMsg(err, 'Failed to save.'));
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTest({ status: 'sending', message: '' });
    try {
      const res = await apiSendTestCustomerEmail(storeId, { event: email.key, subject, body });
      setTest({ status: 'ok', message: res.message });
    } catch (err: unknown) {
      setTest({ status: 'error', message: errMsg(err, 'The test email could not be sent.') });
    }
  };

  return (
    <DialogShell
      onClose={requestClose}
      ariaLabel={`Edit ${email.label} email`}
      className="w-[calc(100vw-24px)] max-w-[1120px] max-h-[94vh] flex flex-col bg-white rounded-xl border border-bone overflow-hidden [&_.surface-panel]:!shadow-none [&_.surface-panel:hover]:!shadow-none [&_button]:!shadow-none [&_button:hover]:!shadow-none"
    >
      <div className="px-5 py-3.5 border-b border-bone flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-carbon">{email.label}</h3>
          <p className="text-[12px] text-slate mt-0.5">{email.description}</p>
          {headerExtra && <div className="mt-2">{headerExtra}</div>}
        </div>
        <button type="button" onClick={requestClose} aria-label="Close" className="text-slate hover:text-charcoal bg-transparent border-0 cursor-pointer p-1"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto grid lg:grid-cols-2 min-h-0">
        {/* ── editor ── */}
        <div className="p-5 flex flex-col gap-4 lg:border-r border-bone">
          <Input label="Subject" value={subject} maxLength={200} onChange={e => setSubject(e.target.value)} />
          <Textarea ref={bodyRef} label="Message" rows={14} maxLength={5000} value={body} onChange={e => setBody(e.target.value)} />
          <div>
            <p className="text-[11.5px] text-slate mb-1.5">Insert a placeholder — it is filled in for each customer:</p>
            <div className="flex flex-wrap gap-1.5">
              {email.variables.map(v => (
                <button key={v} type="button" onClick={() => insertTag(v)} className="text-[11.5px] font-mono bg-cream border border-bone rounded px-2 py-0.5 hover:border-brand-orange cursor-pointer">
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate mt-2">A line is left out when its placeholder has no value (for example no tracking number). Plain text only.</p>
          </div>
          {error && <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}</p>}
        </div>

        {/* ── live preview ── */}
        <div className="p-5 bg-cream/60 flex flex-col gap-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em] flex items-center gap-1.5">
              Preview {previewLoading && <Loader2 size={12} className="animate-spin" aria-label="Updating preview" />}
            </p>
            <div className="flex rounded-md border border-bone bg-white overflow-hidden" role="group" aria-label="Preview size">
              {(['desktop', 'mobile'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-pressed={device === d}
                  aria-label={`${d} preview`}
                  className={clsx('px-2.5 py-1 border-0 cursor-pointer', device === d ? 'bg-brand-pale-orange text-brand-deep-orange' : 'bg-white text-slate')}
                >
                  {d === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />}
                </button>
              ))}
            </div>
          </div>

          {preview?.error ? (
            <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error bg-error-bg rounded-lg px-3 py-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {preview.error}
            </p>
          ) : preview?.data ? (
            <div className={clsx('border border-bone rounded-lg overflow-hidden bg-white mx-auto w-full transition-[max-width]', device === 'mobile' ? 'max-w-[375px]' : 'max-w-full')}>
              <dl className="px-3 py-2 bg-cream border-b border-bone text-[11.5px] text-slate grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                <dt className="font-semibold">From</dt><dd className="truncate">{preview.data.fromName}</dd>
                {preview.data.replyTo && (<><dt className="font-semibold">Reply-to</dt><dd className="truncate">{preview.data.replyTo}</dd></>)}
                <dt className="font-semibold">Subject</dt><dd className="truncate">{preview.data.subject}</dd>
              </dl>
              <iframe title="Email preview" sandbox="" srcDoc={preview.data.html} className="w-full h-[430px] bg-white block" />
            </div>
          ) : (
            <div className="border border-bone rounded-lg bg-white h-[300px] flex items-center justify-center text-[12px] text-slate">Building preview…</div>
          )}
          <p className="text-[11px] text-slate">Shown with sample values. Your logo, colour and footer come from <b>Look &amp; sender</b>.</p>
        </div>
      </div>

      {confirmDiscard && (
        <div role="alertdialog" aria-label="Discard changes" className="px-5 py-3 bg-error-bg border-t border-bone flex flex-wrap items-center justify-between gap-2 shrink-0">
          <p className="text-[12.5px] text-error font-medium">Discard your changes to this email?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmDiscard(false)}>Keep editing</Button>
            <Button size="sm" variant="danger" onClick={onClose}>Discard</Button>
          </div>
        </div>
      )}

      <div className="px-5 py-3 border-t border-bone flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Button size="sm" variant="outline" icon={<Send size={13} />} onClick={sendTest} loading={test.status === 'sending'}>Send test email</Button>
          {email.customized && (
            <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={() => save(true)} disabled={saving}>Reset to default</Button>
          )}
          {test.status === 'ok' && <span role="status" className="flex items-center gap-1 text-[12px] text-success"><CheckCircle2 size={13} /> {test.message}</span>}
          {test.status === 'error' && <span role="alert" className="flex items-center gap-1 text-[12px] text-error"><AlertCircle size={13} /> {test.message}</span>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={requestClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={() => save()} loading={saving} disabled={!dirty || !subject.trim() || !body.trim()}>Save</Button>
        </div>
      </div>
    </DialogShell>
  );
}
