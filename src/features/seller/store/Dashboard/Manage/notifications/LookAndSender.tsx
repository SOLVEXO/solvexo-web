import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button, Card, Input, TagInput, Toggle } from '@/components/comman/ui';
import type { StoreNotificationSettings, UpdateStoreNotificationSettingsPayload } from '@/api/services/storeNotifications';
import { errMsg } from './useCustomerEmailSettings';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_ACCENT = '#d97757';
const SWATCHES = ['#d97757', '#2563eb', '#16a34a', '#9333ea', '#dc2626', '#111827'];

interface Props {
  settings: StoreNotificationSettings;
  onSave: (payload: UpdateStoreNotificationSettingsPayload) => Promise<void>;
}

type Errors = Partial<Record<'replyTo' | 'accent' | 'staff', string>>;

/** Sender, reply-to, logo/colour/footer and extra "new order" recipients — with a live mini preview and one Save bar. */
export function LookAndSender({ settings, onSave }: Props) {
  const [senderName, setSenderName] = useState(settings.senderName ?? '');
  const [replyTo, setReplyTo] = useState(settings.replyToEmail ?? '');
  const [showLogo, setShowLogo] = useState(settings.showLogo);
  const [accent, setAccent] = useState(settings.accentColor ?? '');
  const [footer, setFooter] = useState(settings.footerText ?? '');
  const [staff, setStaff] = useState<string[]>(settings.staffOrderEmails ?? []);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const dirty = useMemo(() => (
    senderName.trim() !== (settings.senderName ?? '')
    || replyTo.trim() !== (settings.replyToEmail ?? '')
    || showLogo !== settings.showLogo
    || accent.trim().toLowerCase() !== (settings.accentColor ?? '')
    || footer.trim() !== (settings.footerText ?? '')
    || staff.join('|') !== (settings.staffOrderEmails ?? []).join('|')
  ), [senderName, replyTo, showLogo, accent, footer, staff, settings]);

  const effectiveAccent = HEX_RE.test(accent.trim()) ? accent.trim() : DEFAULT_ACCENT;
  const displayName = senderName.trim() || settings.storeName || 'Your store';

  const discard = () => {
    setSenderName(settings.senderName ?? '');
    setReplyTo(settings.replyToEmail ?? '');
    setShowLogo(settings.showLogo);
    setAccent(settings.accentColor ?? '');
    setFooter(settings.footerText ?? '');
    setStaff(settings.staffOrderEmails ?? []);
    setErrors({});
    setSaveError('');
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (replyTo.trim() && !EMAIL_RE.test(replyTo.trim())) next.replyTo = 'Enter a valid email address.';
    if (accent.trim() && !HEX_RE.test(accent.trim())) next.accent = 'Use a colour like #d97757.';
    const bad = staff.find(e => !EMAIL_RE.test(e));
    if (bad) next.staff = `"${bad}" is not a valid email address.`;
    else if (staff.length > 10) next.staff = 'You can add up to 10 addresses.';
    return next;
  };

  const save = async () => {
    const found = validate();
    setErrors(found);
    setSaveError('');
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await onSave({
        senderName: senderName.trim() || null,
        replyToEmail: replyTo.trim() || null,
        showLogo,
        accentColor: accent.trim() ? accent.trim().toLowerCase() : null,
        footerText: footer.trim() || null,
        staffOrderEmails: staff,
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(errMsg(err, 'Failed to save.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start w-full">
      <div className="flex flex-col gap-5 min-w-0">
        <Card padding="none">
          <div className="px-5 py-3.5 border-b border-bone"><h3 className="text-[14px] font-bold text-carbon">Sender</h3></div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <Input label="Sender name" value={senderName} maxLength={80} placeholder={settings.storeName ?? 'Your store name'} onChange={e => setSenderName(e.target.value)} />
            <Input
              label="Reply-to email"
              type="email"
              value={replyTo}
              error={errors.replyTo}
              placeholder={settings.storeContactEmail ?? 'support@yourstore.com'}
              onChange={e => { setReplyTo(e.target.value); if (errors.replyTo) setErrors(x => ({ ...x, replyTo: undefined })); }}
            />
            <p className="sm:col-span-2 text-[11.5px] text-slate -mt-2">
              Customers see the sender name; when they reply, it goes to the reply-to address{settings.storeContactEmail ? ` (default: ${settings.storeContactEmail})` : ''}.
            </p>
          </div>
        </Card>

        <Card padding="none">
          <div className="px-5 py-3.5 border-b border-bone"><h3 className="text-[14px] font-bold text-carbon">Appearance</h3></div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12.5px] font-medium text-charcoal">Show my store logo at the top of emails</p>
                <p className="text-[11.5px] text-slate mt-0.5">{settings.storeLogo ? 'Uses your store logo.' : 'Your store has no logo yet — the store name is shown instead.'}</p>
              </div>
              <Toggle checked={showLogo} onChange={setShowLogo} ariaLabel="Show store logo in emails" />
            </div>

            <div>
              <label htmlFor="email-colour" className="block text-[12px] font-medium text-charcoal mb-1.5">Email colour</label>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setAccent(c); setErrors(x => ({ ...x, accent: undefined })); }}
                    aria-label={`Use colour ${c}`}
                    aria-pressed={effectiveAccent.toLowerCase() === c}
                    className={clsx('size-7 rounded-full border-2 cursor-pointer', effectiveAccent.toLowerCase() === c ? 'border-carbon' : 'border-white ring-1 ring-bone')}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  aria-label="Pick a custom email colour"
                  value={effectiveAccent}
                  onChange={e => { setAccent(e.target.value); setErrors(x => ({ ...x, accent: undefined })); }}
                  className="h-7 w-7 rounded-full border border-bone bg-white p-0 cursor-pointer overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:border-0"
                />
                <input
                  id="email-colour"
                  value={accent}
                  maxLength={7}
                  placeholder={DEFAULT_ACCENT}
                  onChange={e => { setAccent(e.target.value); if (errors.accent) setErrors(x => ({ ...x, accent: undefined })); }}
                  aria-invalid={!!errors.accent}
                  className={clsx('w-[104px] py-1.5 px-2.5 rounded-md border bg-white text-[13px] font-mono text-charcoal outline-none focus:border-brand-orange', errors.accent ? 'border-error' : 'border-bone')}
                />
              </div>
              {errors.accent && <p role="alert" className="text-[11.5px] text-error mt-1.5">{errors.accent}</p>}
            </div>

            <Input label="Footer line (optional)" value={footer} maxLength={300} placeholder="e.g. Karachi · Mon–Sat, 10am–6pm" onChange={e => setFooter(e.target.value)} />
          </div>
        </Card>

        <Card padding="none">
          <div className="px-5 py-3.5 border-b border-bone"><h3 className="text-[14px] font-bold text-carbon">New-order alerts</h3></div>
          <div className="p-5 flex flex-col gap-2">
            <p className="text-[12px] font-medium text-charcoal">Also email new orders to</p>
            <TagInput tags={staff} onChange={t => { setStaff(t); if (errors.staff) setErrors(x => ({ ...x, staff: undefined })); }} max={10} placeholder="Type an email, press Enter" />
            {errors.staff
              ? <p role="alert" className="text-[11.5px] text-error">{errors.staff}</p>
              : <p className="text-[11.5px] text-slate">Up to 10 addresses. You always get new-order emails yourself.</p>}
          </div>
        </Card>
      </div>

      {/* ── live mini preview (no server round-trip) ── */}
      <aside className="lg:sticky lg:top-4 flex flex-col gap-2" aria-label="Email look preview">
        <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em]">Live preview</p>
        <div className="rounded-xl border border-bone bg-[#f5f2ef] p-4">
          <div className="text-center pb-3">
            {showLogo && settings.storeLogo
              ? <img src={settings.storeLogo} alt={displayName} className="inline-block max-h-10 max-w-[180px]" />
              : <span className="text-[20px] font-extrabold" style={{ color: effectiveAccent }}>{displayName}</span>}
          </div>
          <div className="bg-white rounded-xl p-5 border border-bone">
            <p className="text-[15px] font-bold text-carbon mb-2">Your order #1001 has shipped</p>
            <p className="text-[12px] text-slate leading-relaxed mb-1">Hi Alex, good news! Your order is on its way.</p>
            <p className="text-[12px] text-slate leading-relaxed mb-4">Carrier: TCS · Tracking: TRK123456789</p>
            <div className="text-center">
              <span className="inline-block rounded-full px-5 py-2 text-[12px] font-semibold text-white" style={{ background: effectiveAccent }}>Track your package</span>
            </div>
          </div>
          <div className="text-center text-[10.5px] text-[#9a9a9a] mt-3 leading-relaxed">
            {footer.trim() && <p>{footer.trim()}</p>}
            <p>© {new Date().getFullYear()} {displayName}. All rights reserved.</p>
          </div>
        </div>
        <p className="text-[11px] text-slate">From <b className="text-charcoal">{displayName}</b>{replyTo.trim() && EMAIL_RE.test(replyTo.trim()) ? <> · replies go to <b className="text-charcoal">{replyTo.trim()}</b></> : null}</p>
      </aside>

      {/* ── one Save bar for the whole form ── */}
      {(dirty || justSaved || saveError) && (
        <div className="lg:col-span-2 sticky bottom-3 z-10">
          <div className="w-full rounded-xl border border-bone bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[12.5px] min-w-0">
              {saveError
                ? <span role="alert" className="flex items-center gap-1.5 text-error"><AlertCircle size={14} /> {saveError}</span>
                : dirty
                  ? <span className="text-charcoal font-medium">You have unsaved changes</span>
                  : <span role="status" className="flex items-center gap-1.5 text-success"><CheckCircle2 size={14} /> Saved</span>}
            </div>
            {dirty && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={discard} disabled={saving}>Discard</Button>
                <Button size="sm" onClick={save} loading={saving}>Save</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
