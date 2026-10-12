import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Eye, Mail, RotateCcw, X } from 'lucide-react';
import { Button, Card, Input, Textarea, Toggle, SkeletonBox } from '@/components/comman/ui';
import { DialogShell } from '@/components/comman/ui/DialogShell';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import {
  apiGetStoreNotificationSettings,
  apiPreviewCustomerEmail,
  apiUpdateStoreNotificationSettings,
  type CustomerEmailPreview,
  type CustomerEmailSetting,
  type StoreNotificationSettings,
} from '@/api/services/storeNotifications';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Shopify "Settings → Notifications → Customer notifications": each email the store sends to its customers —
 *  on/off, the store's own text, a preview, plus the sender name / reply-to and extra "New order" recipients. */
export function CustomerNotificationsSection() {
  const { storeId } = useStoreWorkspace();
  const [settings, setSettings] = useState<StoreNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rowError, setRowError] = useState('');
  const [editing, setEditing] = useState<CustomerEmailSetting | null>(null);

  const [senderName, setSenderName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [staffEmails, setStaffEmails] = useState('');
  const [accent, setAccent] = useState('');
  const [footer, setFooter] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [savingSender, setSavingSender] = useState(false);
  const [senderError, setSenderError] = useState('');
  const [senderSaved, setSenderSaved] = useState(false);

  const apply = useCallback((s: StoreNotificationSettings) => {
    setSettings(s);
    setSenderName(s.senderName ?? '');
    setReplyTo(s.replyToEmail ?? '');
    setStaffEmails((s.staffOrderEmails ?? []).join(', '));
    setAccent(s.accentColor ?? '');
    setFooter(s.footerText ?? '');
    setShowLogo(s.showLogo);
  }, []);

  const [reloadKey, setReloadKey] = useState(0);
  const retry = () => { setLoading(true); setLoadError(''); setReloadKey(k => k + 1); };

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    apiGetStoreNotificationSettings(storeId)
      .then(res => { if (!cancelled) apply(res.data); })
      .catch((err: unknown) => { if (!cancelled) setLoadError(errMsg(err, 'Failed to load customer notifications.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, apply, reloadKey]);

  const toggle = (ev: CustomerEmailSetting, enabled: boolean) => {
    setRowError('');
    // optimistic, rolled back if the save fails
    setSettings(s => s && { ...s, events: s.events.map(e => (e.key === ev.key ? { ...e, enabled } : e)) });
    apiUpdateStoreNotificationSettings(storeId, { events: { [ev.key]: { enabled } } })
      // merge only the emails — `apply` would also reset sender/colour/footer fields the seller is still typing
      .then(res => setSettings(s => s && { ...s, events: res.data.events }))
      .catch((err: unknown) => {
        setSettings(s => s && { ...s, events: s.events.map(e => (e.key === ev.key ? { ...e, enabled: !enabled } : e)) });
        setRowError(errMsg(err, 'Failed to update this email.'));
      });
  };

  const saveSender = () => {
    setSenderError('');
    setSenderSaved(false);
    const list = staffEmails.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean);
    const bad = list.find(e => !EMAIL_RE.test(e));
    if (bad) { setSenderError(`"${bad}" is not a valid email address.`); return; }
    if (list.length > 10) { setSenderError('You can add up to 10 order notification emails.'); return; }
    if (replyTo.trim() && !EMAIL_RE.test(replyTo.trim())) { setSenderError('Enter a valid reply-to email address.'); return; }
    if (accent.trim() && !/^#[0-9a-fA-F]{6}$/.test(accent.trim())) { setSenderError('The email colour must look like #d97757.'); return; }
    setSavingSender(true);
    apiUpdateStoreNotificationSettings(storeId, {
      senderName: senderName.trim() || null,
      replyToEmail: replyTo.trim() || null,
      staffOrderEmails: list,
      accentColor: accent.trim() || null,
      footerText: footer.trim() || null,
      showLogo,
    })
      .then(res => { apply(res.data); setSenderSaved(true); setTimeout(() => setSenderSaved(false), 3000); })
      .catch((err: unknown) => setSenderError(errMsg(err, 'Failed to save.')))
      .finally(() => setSavingSender(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone">
          <h2 className="text-[16px] font-bold text-carbon">Customer notifications</h2>
          <p className="text-[12px] text-slate mt-0.5">
            The emails your store sends to customers. Turn one off, or write your own message — customers see them under your store name.
          </p>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-4" aria-busy="true">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div><SkeletonBox width={160} height={12} className="mb-2" /><SkeletonBox width={280} height={9} /></div>
                <SkeletonBox width={40} height={20} rounded="99px" />
              </div>
            ))}
          </div>
        ) : loadError || !settings ? (
          <div className="p-5 flex items-center justify-between gap-4">
            <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} /> {loadError || 'Could not load.'}</p>
            <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
          </div>
        ) : (
          <>
            {settings.deliveryWarning && (
              <p role="alert" className="mx-5 mt-4 flex items-start gap-1.5 text-[12.5px] text-error bg-error-bg rounded-lg px-3 py-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                The last {settings.deliveryWarning.consecutiveFailures} emails to your customers could not be delivered. Customers may not be receiving order updates — contact support if this keeps happening. Use "Resend" on an order to send it again.
              </p>
            )}
            {rowError && <p role="alert" className="px-5 pt-3 flex items-center gap-1.5 text-[12px] text-error"><AlertCircle size={13} /> {rowError}</p>}
            <ul className="divide-y divide-[#f5f4ef]">
              {settings.events.map(ev => (
                <li key={ev.key} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-charcoal flex items-center gap-2">
                      <Mail size={13} className="text-slate shrink-0" /> {ev.label}
                      {ev.customized && <span className="text-[10.5px] font-medium text-brand-orange bg-cream border border-bone px-1.5 py-0.5 rounded">Customized</span>}
                      {!ev.enabled && <span className="text-[10.5px] font-medium text-slate bg-bone px-1.5 py-0.5 rounded">Off</span>}
                    </p>
                    <p className="text-[11.5px] text-slate mt-1 leading-normal">{ev.description}</p>
                    <button type="button" onClick={() => setEditing(ev)} className="mt-1.5 text-[12px] font-medium text-brand-orange hover:underline">
                      Edit &amp; preview
                    </button>
                  </div>
                  {ev.canDisable
                    ? <Toggle checked={ev.enabled} onChange={v => toggle(ev, v)} ariaLabel={`Send the "${ev.label}" email`} />
                    : <span className="text-[11px] font-medium text-slate bg-bone px-2 py-1 rounded shrink-0">Always sent</span>}
                </li>
              ))}
            </ul>
            <p className="px-5 py-3 border-t border-bone text-[11.5px] text-slate">
              Abandoned-checkout reminders are managed under <Link to={`/store/${storeId}/marketing/cart`} className="text-brand-orange hover:underline">Marketing → Abandoned Cart</Link>.
              Sign-up codes are sent under your store name and can't be switched off.
            </p>
          </>
        )}
      </Card>

      {settings && !loading && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4 border-b border-bone">
            <h2 className="text-[16px] font-bold text-carbon">Sender, look &amp; order alerts</h2>
            <p className="text-[12px] text-slate mt-0.5">Who customer emails come from, how they look, where replies go, and who else hears about new orders.</p>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <Input
              label="Sender name"
              value={senderName}
              maxLength={80}
              placeholder={settings.storeName ?? 'Your store name'}
              onChange={e => setSenderName(e.target.value)}
            />
            <Input
              label="Reply-to email"
              type="email"
              value={replyTo}
              placeholder={settings.storeContactEmail ?? 'support@yourstore.com'}
              onChange={e => setReplyTo(e.target.value)}
            />
            <p className="text-[11.5px] text-slate -mt-2">
              When a customer replies to one of your emails it goes here{settings.storeContactEmail ? ` (default: ${settings.storeContactEmail})` : ''}.
            </p>
            <div className="flex items-start justify-between gap-4 pt-1">
              <div>
                <p className="text-[12px] font-medium text-charcoal">Show my store logo at the top of emails</p>
                <p className="text-[11.5px] text-slate mt-0.5">{settings.storeLogo ? 'Uses your store logo.' : 'Your store has no logo yet — the store name is shown instead.'}</p>
              </div>
              <Toggle checked={showLogo} onChange={setShowLogo} ariaLabel="Show store logo in emails" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input label="Email colour" value={accent} maxLength={7} placeholder="#d97757" onChange={e => setAccent(e.target.value)} />
              </div>
              <input
                type="color"
                aria-label="Pick the email colour"
                value={/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#d97757'}
                onChange={e => setAccent(e.target.value)}
                className="h-[38px] w-12 rounded-md border border-bone bg-white p-1 cursor-pointer"
              />
            </div>
            <Input
              label="Email footer (optional)"
              value={footer}
              maxLength={300}
              placeholder="e.g. Karachi · Mon–Sat, 10am–6pm"
              onChange={e => setFooter(e.target.value)}
            />
            <Input
              label="Also email new orders to"
              value={staffEmails}
              placeholder="staff@yourstore.com, packing@yourstore.com"
              onChange={e => setStaffEmails(e.target.value)}
            />
            <p className="text-[11.5px] text-slate -mt-2">Separate up to 10 addresses with commas. You always get new-order emails yourself.</p>
            {senderError && <p role="alert" className="flex items-center gap-1.5 text-[12px] text-error"><AlertCircle size={13} /> {senderError}</p>}
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={saveSender} loading={savingSender}>Save</Button>
              {senderSaved && <span className="text-[11px] font-medium text-success bg-success-bg px-2.5 py-1 rounded-md">Saved</span>}
            </div>
          </div>
        </Card>
      )}

      {editing && (
        <EditEmailDialog
          storeId={storeId}
          ev={editing}
          onClose={() => setEditing(null)}
          onSaved={s => { apply(s); setEditing(null); }}
        />
      )}
    </div>
  );
}

function EditEmailDialog({ storeId, ev, onClose, onSaved }: {
  storeId: string;
  ev: CustomerEmailSetting;
  onClose: () => void;
  onSaved: (s: StoreNotificationSettings) => void;
}) {
  const [subject, setSubject] = useState(ev.subject ?? ev.defaultSubject);
  const [body, setBody] = useState(ev.body ?? ev.defaultBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<CustomerEmailPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const el = bodyRef.current;
    const text = `{{${tag}}}`;
    if (!el) { setBody(b => `${b}${text}`); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(`${body.slice(0, start)}${text}${body.slice(end)}`);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + text.length, start + text.length); });
  };

  const runPreview = () => {
    setPreviewing(true);
    setError('');
    apiPreviewCustomerEmail(storeId, { event: ev.key, subject, body })
      .then(res => setPreview(res.data))
      .catch((err: unknown) => setError(errMsg(err, 'Could not build the preview.')))
      .finally(() => setPreviewing(false));
  };

  // Saving the untouched default stores nothing (the store keeps following the built-in text).
  const save = (reset = false) => {
    setSaving(true);
    setError('');
    const same = subject.trim() === ev.defaultSubject && body.trim() === ev.defaultBody;
    const change = reset || same
      ? { reset: true }
      : { subject: subject.trim(), body: body.trim() };
    apiUpdateStoreNotificationSettings(storeId, { events: { [ev.key]: change } })
      .then(res => onSaved(res.data))
      .catch((err: unknown) => setError(errMsg(err, 'Failed to save.')))
      .finally(() => setSaving(false));
  };

  return (
    <DialogShell onClose={onClose} ariaLabel={`Edit ${ev.label} email`} className="w-[calc(100vw-32px)] max-w-[680px] max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
      <div className="px-5 py-4 border-b border-bone flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-carbon">{ev.label}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className="text-slate hover:text-charcoal"><X size={18} /></button>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <Input label="Subject" value={subject} maxLength={200} onChange={e => setSubject(e.target.value)} />
        <Textarea ref={bodyRef} label="Message" rows={9} maxLength={5000} value={body} onChange={e => setBody(e.target.value)} />
        <div>
          <p className="text-[11.5px] text-slate mb-1.5">Click to insert a placeholder (customer-specific values fill in when the email is sent):</p>
          <div className="flex flex-wrap gap-1.5">
            {ev.variables.map(v => (
              <button key={v} type="button" onClick={() => insertTag(v)} className="text-[11.5px] font-mono bg-cream border border-bone rounded px-2 py-0.5 hover:border-brand-orange">
                {`{{${v}}}`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate mt-2">A line is left out of the email when its placeholder has no value (for example no tracking number).</p>
        </div>

        {error && <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}</p>}

        {preview && (
          <div className="border border-bone rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-cream border-b border-bone text-[11.5px] text-slate">
              <p><b>From:</b> {preview.fromName}</p>
              {preview.replyTo && <p><b>Reply-to:</b> {preview.replyTo}</p>}
              <p><b>Subject:</b> {preview.subject}</p>
            </div>
            <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="w-full h-[380px] bg-white" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" icon={<Eye size={13} />} onClick={runPreview} loading={previewing}>Preview</Button>
            {ev.customized && (
              <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={() => save(true)} disabled={saving}>Reset to default</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={() => save()} loading={saving} disabled={!subject.trim() || !body.trim()}>Save</Button>
          </div>
        </div>
      </div>
    </DialogShell>
  );
}
