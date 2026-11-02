import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiDisableStoreSmtp, apiGetStoreSmtp, apiSaveStoreSmtp, type StoreSmtpView } from '@/api/services/storeSmtp';

const PORTS = [587, 465, 25, 2525];
const CARD = 'bg-white border border-bone rounded-[10px] p-5 flex flex-col gap-4';

/** Settings → Notifications → Sender email: send the store's customer emails from the store's own mailbox. */
export function SenderEmailPane({ storeId }: { storeId: string }) {
  const toast = useToast();
  const [view, setView] = useState<StoreSmtpView | null>(null);
  const [loadError, setLoadError] = useState('');
  const [own, setOwn] = useState(false);
  const [form, setForm] = useState({ host: '', port: 587, user: '', password: '', fromEmail: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoadError('');
    apiGetStoreSmtp(storeId)
      .then(res => {
        setView(res.data);
        setOwn(res.data.mode === 'own');
        setForm({ host: res.data.host, port: res.data.port || 587, user: res.data.user, password: '', fromEmail: res.data.fromEmail });
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Could not load the sender email settings.'));
  }, [storeId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load, same pattern as the other settings panes
  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: k === 'port' ? Number(e.target.value) : e.target.value }));

  const save = async () => {
    setSaving(true); setFormError('');
    try {
      const res = await apiSaveStoreSmtp(storeId, { host: form.host.trim(), port: form.port, user: form.user.trim(), fromEmail: form.fromEmail.trim(), ...(form.password ? { password: form.password } : {}) });
      toast.success(res.message ?? 'Connected');
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not connect.');
    } finally {
      setSaving(false);
    }
  };

  const useSolvexo = async () => {
    setSaving(true); setFormError('');
    try {
      if (view?.mode === 'own') await apiDisableStoreSmtp(storeId);
      toast.success('Emails are sent through Solvexo');
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not switch.');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div role="alert" className={CARD}>
        <p className="m-0 text-[13px] text-error">{loadError}</p>
        <div><Button size="sm" variant="outline" onClick={load}>Retry</Button></div>
      </div>
    );
  }
  if (!view) return <div className={CARD} aria-busy="true"><p className="m-0 text-[13px] text-slate">Loading…</p></div>;

  const canSave = form.host.trim() && form.user.trim() && form.fromEmail.trim() && (form.password || view.hasPassword);

  return (
    <div className="flex flex-col gap-4 w-full">
      {view.mode === 'own' && view.lastError && (
        <div role="alert" className="flex gap-2 items-start rounded-[10px] border border-error/40 bg-white p-4">
          <AlertCircle size={16} className="text-error shrink-0 mt-0.5" />
          <div>
            <p className="m-0 text-[13px] font-semibold text-charcoal">Your email is not working right now</p>
            <p className="m-0 mt-1 text-[12.5px] text-slate">Customer emails are going out through Solvexo instead, so nothing is lost. Last error: {view.lastError}. Check the password below and save again.</p>
          </div>
        </div>
      )}

      <div className={CARD}>
        <div>
          <p className="m-0 text-[14px] font-bold text-charcoal">Where do your customer emails come from?</p>
          <p className="m-0 mt-1 text-[12.5px] text-slate">Order mails, invoices, staff invites and replies from Contact Messages. Solvexo&apos;s own emails (sign-in codes, billing, alerts) always come from Solvexo.</p>
        </div>

        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Sender">
          <div className="flex items-start gap-2">
            <input id="sender-solvexo" type="radio" name="sender-mode" className="mt-1" checked={!own} onChange={() => setOwn(false)} />
            <div>
              <label htmlFor="sender-solvexo" className="text-[13px] font-semibold text-charcoal cursor-pointer">Solvexo (default)</label>
              <p className="m-0 text-[12px] text-slate">Sent from Solvexo with your store name. Replies go to your store contact email. Nothing to set up.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <input id="sender-own" type="radio" name="sender-mode" className="mt-1" checked={own} onChange={() => setOwn(true)} />
            <div>
              <label htmlFor="sender-own" className="text-[13px] font-semibold text-charcoal cursor-pointer">My own email</label>
              <p className="m-0 text-[12px] text-slate">Sent from your own mailbox (Gmail, Outlook or your hosting email). If it ever stops working, emails still go out through Solvexo.</p>
            </div>
          </div>
        </div>

        {own && (
          <div className="flex flex-col gap-3 border-t border-bone pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
              <Input label="SMTP host" value={form.host} onChange={set('host')} placeholder="smtp.gmail.com" autoComplete="off" />
              <div>
                <label htmlFor="smtp-port" className="block text-[12px] font-medium text-charcoal mb-1.5">Port</label>
                <select id="smtp-port" value={form.port} onChange={set('port')} className="w-full py-[9px] px-3 rounded-md border border-bone bg-white text-[16px] sm:text-[13px] text-charcoal">
                  {PORTS.map(p => <option key={p} value={p}>{p}{p === 587 ? ' (recommended)' : p === 465 ? ' (SSL)' : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Username" value={form.user} onChange={set('user')} placeholder="you@yourstore.com" autoComplete="off" />
              <Input label="Password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password"
                placeholder={view.hasPassword ? 'Saved, leave empty to keep it' : 'Email or app password'} />
            </div>
            <Input label="Send from (email address)" type="email" value={form.fromEmail} onChange={set('fromEmail')} placeholder="info@yourstore.com" />
            <p className="m-0 text-[12px] text-slate">For Gmail use smtp.gmail.com, port 587 and an <strong>App password</strong> (Google Account → Security → 2-Step Verification → App passwords), not your normal password. We send a test email to your own address first; nothing is saved unless it works.</p>
            {view.verifiedAt && !view.lastError && <p className="m-0 text-[12px] text-success flex items-center gap-1"><CheckCircle2 size={13} /> Connected and verified {new Date(view.verifiedAt).toLocaleDateString()}</p>}
            {formError && <p role="alert" className="m-0 text-[12.5px] text-error">{formError}</p>}
            <div><Button onClick={save} loading={saving} disabled={!canSave}>Save and send test email</Button></div>
          </div>
        )}

        {!own && (
          <div className="flex flex-col gap-2">
            {formError && <p role="alert" className="m-0 text-[12.5px] text-error">{formError}</p>}
            <div><Button onClick={useSolvexo} loading={saving} disabled={view.mode === 'solvexo'}>{view.mode === 'solvexo' ? 'Using Solvexo' : 'Switch back to Solvexo'}</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}
