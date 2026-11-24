import { useCallback, useEffect, useState } from 'react';
import { Download, Mail, RefreshCw, TriangleAlert, Unplug } from 'lucide-react';
import { Badge, Button, CopyIconButton, Input, Modal } from '@/components/comman/ui';
import { apiBrevoConnect, apiBrevoDisconnect, apiBrevoStatus, apiBrevoSync, apiExportBrevoCsv, type BrevoStatus } from '@/api/services/salesOps';
import { errMsg, relDay, useStableToast } from './sales.utils';

const COUNTS: { key: keyof BrevoStatus['counts']; label: string; hint: string }[] = [
  { key: 'granted', label: 'Agreed', hint: 'Leads who said yes to marketing emails' },
  { key: 'synced', label: 'In Brevo', hint: 'Already on the Brevo list' },
  { key: 'pending', label: 'Waiting', hint: 'Agreed, not sent to Brevo yet' },
  { key: 'failed', label: 'Failed', hint: 'Brevo refused them; see the lead for why' },
  { key: 'asked', label: 'Asked', hint: 'Permission email sent, no answer yet' },
  { key: 'withdrawn', label: 'Unsubscribed', hint: 'Said no later, or unsubscribed in Brevo' },
];

/** Super Admin → Sales Ops → Brevo: send leads who agreed to marketing emails to a Brevo list, and bring unsubscribes back. */
export function BrevoTab({ isManager }: { isManager: boolean }) {
  const toast = useStableToast();
  const [s, setS] = useState<BrevoStatus | null>(null);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [busy, setBusy] = useState<'connect' | 'sync' | 'export' | 'disconnect' | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);

  const fetchStatus = useCallback(() => apiBrevoStatus().then(r => { setS(r); setError(''); }).catch(e => setError(errMsg(e, 'Could not load the Brevo connection.'))), []);
  useEffect(() => { void fetchStatus(); }, [fetchStatus]);
  const load = () => { setError(''); void fetchStatus(); };

  const connect = async () => {
    setBusy('connect'); setKeyError('');
    try { const r = await apiBrevoConnect(apiKey.trim()); setS(r); setApiKey(''); toast.success(`Brevo connected${r.accountEmail ? ` (${r.accountEmail})` : ''}.`); }
    catch (e) { setKeyError(errMsg(e, 'Brevo didn’t accept that API key.')); }
    setBusy(null);
  };
  const sync = async () => {
    setBusy('sync');
    try {
      const r = await apiBrevoSync();
      toast.success(r.queued || r.synced || r.failed ? `Sent ${r.synced} to Brevo${r.queued ? `, ${r.queued} queued` : ''}${r.failed ? `, ${r.failed} failed` : ''}.` : 'Brevo is already up to date.');
      void load();
    } catch (e) { toast.error(errMsg(e, 'Could not sync with Brevo.')); }
    setBusy(null);
  };
  const exportCsv = async () => {
    setBusy('export');
    try { await apiExportBrevoCsv(); } catch (e) { toast.error(errMsg(e, 'Could not export.')); }
    setBusy(null);
  };
  const disconnect = async () => {
    setBusy('disconnect');
    try { setS(await apiBrevoDisconnect()); setConfirmOff(false); toast.success('Brevo disconnected.'); }
    catch (e) { toast.error(errMsg(e, 'Could not disconnect.')); }
    setBusy(null);
  };

  if (error) return <div className="flex flex-col items-center gap-3 py-16 text-center"><p className="text-[13px] text-slate">{error}</p><Button onClick={load}>Retry</Button></div>;
  if (!s) return <div className="h-40 rounded-xl bg-cream animate-pulse max-w-3xl" />;

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <section className="rounded-xl border border-bone bg-white p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-charcoal flex items-center gap-2"><Mail size={16} className="text-brand-orange" /> Brevo marketing list <Badge color={s.connected ? 'green' : 'gray'} size="sm">{s.connected ? 'Connected' : 'Not connected'}</Badge></p>
            <p className="text-[12px] text-slate">Send leads who agreed to marketing emails to a Brevo list, and bring unsubscribes back.</p>
          </div>
        </div>

        {!s.connected ? (
          isManager ? (
            <form className="flex flex-col gap-2 border-t border-bone pt-3" onSubmit={e => { e.preventDefault(); if (apiKey.trim()) void connect(); }}>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <div className="flex-1"><Input label="Brevo API key" type="password" autoComplete="off" placeholder="xkeysib-…" value={apiKey} onChange={e => setApiKey(e.target.value)} /></div>
                <Button type="submit" loading={busy === 'connect'} disabled={!apiKey.trim()}>Connect</Button>
              </div>
              <p className="text-[11.5px] text-slate">In Brevo, open your name (top right) → SMTP &amp; API → API keys, and create a key for Solvexo. Only leads who agreed are ever sent; the key is stored encrypted and never shown again.</p>
              {keyError && <p role="alert" className="text-[12px] text-error">{keyError}</p>}
            </form>
          ) : <p className="text-[12.5px] text-slate border-t border-bone pt-3">Not connected yet. Ask a sales manager to connect Brevo.</p>
        ) : (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-bone pt-3 text-[12.5px]">
              <dt className="text-slate">Account</dt><dd className="text-charcoal break-all">{s.accountEmail ?? '—'}</dd>
              <dt className="text-slate">List</dt><dd className="text-charcoal">{s.listName ?? '—'}</dd>
              <dt className="text-slate">API key</dt><dd className="text-charcoal font-mono text-[12px]">{s.keyHint ?? '—'}</dd>
              <dt className="text-slate">Last sync</dt><dd className="text-charcoal">{s.lastSyncAt ? `${relDay(s.lastSyncAt)}, ${new Date(s.lastSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Not yet'}</dd>
            </dl>
            {s.lastError && (
              <div className="flex gap-2 rounded-lg border border-error-border bg-error-bg p-2.5 text-[12.5px] text-charcoal" role="status">
                <TriangleAlert size={15} className="text-error shrink-0 mt-0.5" /><p><strong>Last error:</strong> {s.lastError}</p>
              </div>
            )}
          </>
        )}
      </section>

      {s.connected && (
        <>
          <section aria-label="Leads and Brevo" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COUNTS.map(c => (
              <div key={c.key} className="rounded-xl border border-bone bg-white p-3" title={c.hint}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate">{c.label}</p>
                <p className={`text-[20px] font-semibold tabular-nums ${c.key === 'failed' && s.counts[c.key] ? 'text-error' : 'text-carbon'}`} data-testid={`brevo-count-${c.key}`}>{(s.counts?.[c.key] ?? 0).toLocaleString()}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-bone bg-white p-4 flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Unsubscribes from Brevo</p>
            <p className="text-[12.5px] text-charcoal">In Brevo → Settings → Webhooks → Marketing, add this URL for Unsubscribed, Spam and Hard bounce events.</p>
            <div className="flex items-center gap-2 rounded-lg border border-bone bg-cream/60 px-3 py-2"><code className="flex-1 break-all text-[12px]">{s.webhookUrl}</code><CopyIconButton value={s.webhookUrl} title="Copy webhook URL" size={14} /></div>
          </section>

          {isManager && (
            <div className="flex flex-wrap gap-2">
              <Button loading={busy === 'sync'} onClick={() => void sync()}><RefreshCw size={14} /> Sync now</Button>
              <Button variant="outline" loading={busy === 'export'} onClick={() => void exportCsv()}><Download size={14} /> Export for Brevo (CSV)</Button>
              <Button variant="ghost" className="sm:ml-auto" onClick={() => setConfirmOff(true)}><Unplug size={14} /> Disconnect</Button>
            </div>
          )}
        </>
      )}

      {confirmOff && (
        <Modal title="Disconnect Brevo?" onClose={() => setConfirmOff(false)} mobileSheet={false}
          footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirmOff(false)}>Cancel</Button><Button variant="danger" loading={busy === 'disconnect'} onClick={() => void disconnect()}>Disconnect</Button></div>}>
          <p className="text-[13px] text-charcoal">New agreements stop going to Brevo and unsubscribes stop coming back. Contacts already in your Brevo list stay there, and every lead keeps its consent record.</p>
        </Modal>
      )}
    </div>
  );
}
