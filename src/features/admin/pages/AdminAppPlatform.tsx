import { useCallback, useEffect, useState } from 'react';
import { Blocks, Copy, Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { SkeletonBox, EmptyState, Badge, Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { can } from '@/hooks/auth/useCan';
import type { BadgeColor } from '@/types';
import {
  apiAdminApproveApp, apiAdminCreateApp, apiAdminListApps, apiAdminRotateAppSecrets, apiAdminSuspendApp, apiAdminUpdateApp,
  type AdminAppInput, type AdminAppRow,
} from '@/api/services/appPlatform';

const SCOPES = ['read_orders', 'write_orders', 'read_products', 'write_products', 'read_customers', 'write_customers', 'read_inventory', 'write_inventory'];
const EVENTS = ['order.created', 'order.paid', 'order.fulfilled', 'order.cancelled', 'refund.created', 'product.updated', 'inventory.changed', 'customer.created'];
const STATUS_COLOR: Record<AdminAppRow['status'], BadgeColor> = { draft: 'gray', approved: 'green', suspended: 'red' };
const errText = (e: unknown, f: string) => (e instanceof Error && e.message ? e.message : f);
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

type Form = { name: string; description: string; developerName: string; developerEmail: string; redirectUrls: string; scopes: string[]; webhookUrl: string; events: string[]; uninstallWebhookUrl: string; embedUrl: string; embedTitle: string };
const EMPTY: Form = { name: '', description: '', developerName: '', developerEmail: '', redirectUrls: '', scopes: ['read_orders'], webhookUrl: '', events: [], uninstallWebhookUrl: '', embedUrl: '', embedTitle: '' };
const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

/** Solvexo admin: register apps, approve them for installation, suspend them (every install is removed at once). Secrets are shown once. */
export function AdminAppPlatform() {
  const toast = useToast();
  const canManage = can('config.manage');
  const [rows, setRows] = useState<AdminAppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminAppRow | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [secrets, setSecrets] = useState<{ name: string; clientId?: string; clientSecret: string; sessionSecret: string } | null>(null);
  const [confirm, setConfirm] = useState<AdminAppRow | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    apiAdminListApps().then(setRows).catch((e: unknown) => setError(errText(e, 'Could not load apps.'))).finally(() => setLoading(false));
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const open = (a: AdminAppRow | 'new') => {
    setFormError(''); setEditing(a);
    setForm(a === 'new' ? EMPTY : { name: a.name, description: a.description, developerName: a.developerName, developerEmail: a.developerEmail, redirectUrls: a.redirectUrls.join('\n'), scopes: a.requestedScopes, webhookUrl: a.webhookUrl ?? '', events: a.webhookEvents, uninstallWebhookUrl: a.uninstallWebhookUrl ?? '', embedUrl: a.embedUrl ?? '', embedTitle: a.embedTitle });
  };
  const save = async () => {
    setSaving(true); setFormError('');
    const body: AdminAppInput = { name: form.name.trim(), description: form.description, developerName: form.developerName, developerEmail: form.developerEmail, redirectUrls: lines(form.redirectUrls), requestedScopes: form.scopes, webhookUrl: form.webhookUrl.trim() || null, webhookEvents: form.events, uninstallWebhookUrl: form.uninstallWebhookUrl.trim() || null, embedUrl: form.embedUrl.trim() || null, embedTitle: form.embedTitle };
    try {
      if (editing === 'new') { const r = await apiAdminCreateApp(body); setSecrets({ name: body.name, clientId: r.clientId, clientSecret: r.clientSecret, sessionSecret: r.sessionSecret }); }
      else if (editing) await apiAdminUpdateApp(editing._id, body);
      setEditing(null); toast.success('App saved'); load();
    } catch (e: unknown) { setFormError(errText(e, 'Could not save the app.')); } finally { setSaving(false); }
  };
  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try { await fn(); toast.success(ok); load(); } catch (e: unknown) { toast.error(errText(e, 'That did not work.')); } finally { setBusy(''); }
  };
  const copy = (t: string) => { void navigator.clipboard?.writeText(t).then(() => toast.success('Copied')); };

  return (
    <>
      <AdminPageHeader title="App platform" subtitle="Apps that store owners can install. An approved app can ask for API permissions; the store owner always has to allow them."
        icon={<Blocks size={18} />} actions={canManage ? <Button size="sm" icon={<Plus size={14} />} onClick={() => open('new')}>Register app</Button> : undefined} />
      <div className="px-4 sm:px-7 py-5 flex flex-col gap-3">
        {error ? <EmptyState icon={<Blocks size={22} />} title="Could not load" description={error} action={{ label: 'Retry', onClick: load }} />
          : loading ? <SkeletonBox className="h-24 w-full" />
            : rows.length === 0 ? <EmptyState icon={<Blocks size={22} />} title="No apps registered" description="Register an app, send its developer the client id and secrets, then approve it." />
              : (
                <ul className="flex flex-col gap-2 list-none p-0 m-0">
                  {rows.map((a) => (
                    <li key={a._id} className="rounded-xl border border-bone bg-white p-3 flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-[13.5px]">{a.name}</span><Badge color={STATUS_COLOR[a.status]} size="sm">{a.status}</Badge><span className="text-[12px] text-slate">{a.clientId} · secret {a.clientSecretHint}</span></div>
                      <p className="text-[12.5px] text-slate m-0">Permissions: {a.requestedScopes.join(', ')} · {a.redirectUrls.length} redirect address(es){a.webhookUrl ? ' · webhook' : ''}{a.embedUrl ? ' · dashboard page' : ''}</p>
                      {canManage && (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          <Button size="sm" variant="secondary" onClick={() => open(a)}>Edit</Button>
                          {a.status !== 'approved' && <Button size="sm" loading={busy === a._id} onClick={() => void run(a._id, () => apiAdminApproveApp(a._id), 'App approved')}>Approve</Button>}
                          {a.status === 'approved' && <Button size="sm" variant="outline" onClick={() => setConfirm(a)}>Suspend</Button>}
                          <Button size="sm" variant="secondary" loading={busy === `r${a._id}`} onClick={() => void run(`r${a._id}`, async () => { const r = await apiAdminRotateAppSecrets(a._id); setSecrets({ name: a.name, clientSecret: r.clientSecret, sessionSecret: r.sessionSecret }); }, 'New secrets created')}>New secrets</Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Register an app' : 'Edit app'} onClose={() => setEditing(null)} width={680} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving} disabled={!form.name.trim()}>Save</Button></div>}>
          <div className="flex flex-col gap-3">
            <Input label="App name" value={form.name} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Description" value={form.description} maxLength={500} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3"><Input label="Developer name" value={form.developerName} onChange={(e) => setForm((f) => ({ ...f, developerName: e.target.value }))} /><Input label="Developer email" value={form.developerEmail} onChange={(e) => setForm((f) => ({ ...f, developerEmail: e.target.value }))} /></div>
            <label className="flex flex-col gap-1 text-[13px]">Redirect addresses (https, one per line, exact match)
              <textarea className="min-h-[70px] rounded-lg border border-bone p-2 text-[13px]" value={form.redirectUrls} onChange={(e) => setForm((f) => ({ ...f, redirectUrls: e.target.value }))} />
            </label>
            <fieldset className="border-0 p-0 m-0"><legend className="text-[13px] font-medium mb-1">Permissions the app may ask for</legend>
              <div className="flex flex-wrap gap-3">{SCOPES.map((s) => <label key={s} className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" checked={form.scopes.includes(s)} onChange={() => setForm((f) => ({ ...f, scopes: toggle(f.scopes, s) }))} /> {s}</label>)}</div>
            </fieldset>
            <Input label="App webhook address (https, optional)" value={form.webhookUrl} onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))} />
            {form.webhookUrl.trim() && <div className="flex flex-wrap gap-3">{EVENTS.map((s) => <label key={s} className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" checked={form.events.includes(s)} onChange={() => setForm((f) => ({ ...f, events: toggle(f.events, s) }))} /> {s}</label>)}</div>}
            <Input label="Uninstall webhook address (https, optional)" value={form.uninstallWebhookUrl} onChange={(e) => setForm((f) => ({ ...f, uninstallWebhookUrl: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3"><Input label="Dashboard page address (https, optional)" value={form.embedUrl} onChange={(e) => setForm((f) => ({ ...f, embedUrl: e.target.value }))} /><Input label="Dashboard page title" value={form.embedTitle} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, embedTitle: e.target.value }))} /></div>
            {formError && <p role="alert" className="text-[12.5px] text-error m-0">{formError}</p>}
          </div>
        </Modal>
      )}

      {secrets && (
        <Modal title="Give these to the developer now" onClose={() => setSecrets(null)} width={560} mobileSheet footer={<div className="flex justify-end"><Button onClick={() => setSecrets(null)}>Done</Button></div>}>
          <div className="flex flex-col gap-2 text-[13px]">
            <p className="m-0">{secrets.name}: the secrets are shown only once.</p>
            {secrets.clientId && <div className="rounded-lg border border-bone p-2 break-all font-mono text-[12.5px]">client id: {secrets.clientId}</div>}
            {[['client secret', secrets.clientSecret], ['session secret (verifies the dashboard page token and the uninstall webhook)', secrets.sessionSecret]].map(([label, v]) => (
              <div key={label} className="flex items-start gap-2 rounded-lg border border-bone p-2 break-all font-mono text-[12.5px]"><span className="flex-1">{label}: {v}</span><button type="button" aria-label={`Copy ${label}`} className="cursor-pointer" onClick={() => copy(v)}><Copy size={14} /></button></div>
            ))}
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal title={`Suspend ${confirm.name}?`} onClose={() => setConfirm(null)} width={460} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button onClick={() => { const a = confirm; setConfirm(null); void run(a._id, () => apiAdminSuspendApp(a._id), 'App suspended'); }}>Suspend app</Button></div>}>
          <p className="text-[13px] m-0">The app is removed from every store at once: its API access stops and its webhooks are deleted. It can be approved again later, but each store has to install it again.</p>
        </Modal>
      )}
    </>
  );
}
