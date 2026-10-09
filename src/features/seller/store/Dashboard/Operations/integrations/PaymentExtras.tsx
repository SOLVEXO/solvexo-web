import { useCallback, useEffect, useState } from 'react';
import { Banknote, Pencil, Plus, Trash2, RefreshCw, FlaskConical, HandCoins } from 'lucide-react';
import { Button, Modal, Toggle, SkeletonBox, Field, Input, Textarea, Select } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import {
  apiCreateManualMethod, apiUpdateManualMethod, apiDeleteManualMethod,
  apiConnectPkGateway, apiUpdateIntegration,
  apiGetWhatsAppNotifications, apiUpdateWhatsAppNotification, apiListWhatsAppTemplates,
  apiCreateWhatsAppTemplate, apiDeleteWhatsAppTemplate,
  type ManualPaymentMethodView, type StoreIntegrationView, type IntegrationMode,
  type WhatsAppNotificationsView, type WhatsAppTemplateView, type WhatsAppEventKey,
} from '@/api/services/integrations';
import { apiGetStripePayouts, type StripePayoutOverview } from '@/api/services/stripeConnect';
import { apiUpdateStore } from '@/api/services/store';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';

// ── Cash on Delivery (Shopify "Manual payment methods > Cash on Delivery (COD)") — saves instantly, like the other cards here ──
export function CashOnDeliveryCard() {
  const { store, storeId, refetch } = useStoreWorkspace();
  const toast = useToast();
  const [override, setOverride] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const stored = store?.codEnabled !== false;
  const enabled = override ?? stored;
  // Keep the optimistic value until the refetched store value changes (no flicker back).
  const [prevStored, setPrevStored] = useState(stored);
  if (stored !== prevStored) { setPrevStored(stored); setOverride(null); }

  async function toggle(next: boolean) {
    if (!storeId) return;
    setOverride(next); setSaving(true);
    try {
      await apiUpdateStore({ storeId, codEnabled: next });
      refetch();
    } catch (err) {
      setOverride(null);
      toast.error(err instanceof Error ? err.message : 'Failed to update Cash on Delivery.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[42px] h-[42px] rounded-[10px] bg-cream flex items-center justify-center shrink-0"><HandCoins size={20} className="text-slate" /></div>
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold text-carbon truncate">Cash on Delivery (COD)</p>
            <p className="text-[11px] text-slate">Buyers pay in cash when their physical order arrives</p>
          </div>
        </div>
      </div>
      <p className="text-[12.5px] text-slate mb-3">The order stays unpaid until you mark it paid. No transaction fee.</p>
      <div className="flex items-center gap-2">
        <Toggle checked={enabled} disabled={saving || !store} onChange={toggle} ariaLabel="Enable Cash on Delivery at checkout" />
        <span className="text-[12.5px] text-graphite">Enabled at checkout</span>
      </div>
    </div>
  );
}

// ── Custom manual payment methods (Shopify "Manual payment methods > Custom payment method") ──
function ManualMethodModal({ storeId, initial, onClose, onSaved }: {
  storeId: string; initial?: ManualPaymentMethodView; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!name.trim()) { setError('Give the payment method a name.'); return; }
    setSaving(true); setError('');
    try {
      if (initial) await apiUpdateManualMethod(storeId, initial.id, { name: name.trim(), instructions, isActive });
      else await apiCreateManualMethod(storeId, { name: name.trim(), instructions, isActive });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the payment method.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={initial ? 'Edit payment method' : 'Add custom payment method'}
      width={480}
      onClose={onClose}
      mobileSheet
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Save</Button>
      </>}
    >
      <Field label="Name" required hint="Shown to buyers at checkout, e.g. “Easypaisa transfer” or “Pay at pickup”.">
        <Input value={name} maxLength={60} onChange={e => setName(e.target.value)} placeholder="Easypaisa transfer" />
      </Field>
      <Field label="Payment instructions" hint="Shown to the buyer when they pick this method — e.g. your account details and what to write in the transfer note.">
        <Textarea value={instructions} maxLength={2000} rows={5} onChange={e => setInstructions(e.target.value)} placeholder={'Send the total to Easypaisa 0300-1234567 (Account title: Your Name) and WhatsApp the receipt.'} />
      </Field>
      <label className="flex items-center gap-2 cursor-pointer">
        <Toggle checked={isActive} onChange={setIsActive} ariaLabel="Offer this method at checkout" />
        <span className="text-[12.5px] text-graphite">Offer at checkout</span>
      </label>
      {error && <p className="text-[12px] text-error mt-2">{error}</p>}
    </Modal>
  );
}

export function ManualPaymentMethodsSection({ storeId, methods, onChanged }: {
  storeId: string; methods: ManualPaymentMethodView[]; onChanged: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<ManualPaymentMethodView | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ManualPaymentMethodView | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggle(m: ManualPaymentMethodView, next: boolean) {
    try { await apiUpdateManualMethod(storeId, m.id, { isActive: next }); onChanged(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to update.'); }
  }
  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try { await apiDeleteManualMethod(storeId, deleting.id); setDeleting(null); onChanged(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[42px] h-[42px] rounded-[10px] bg-cream flex items-center justify-center shrink-0"><Banknote size={20} className="text-slate" /></div>
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold text-carbon">Custom payment methods</p>
            <p className="text-[12px] text-slate">Name your own method — e.g. Easypaisa transfer or pay at pickup — with instructions shown to buyers at checkout.</p>
          </div>
        </div>
        <Button size="sm" icon={<Plus size={13} />} onClick={() => setEditing('new')}>Add</Button>
      </div>
      {methods.length === 0 ? (
        <p className="text-[12.5px] text-slate">No custom payment methods yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-bone">
          {methods.map(m => (
            <li key={m.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-carbon truncate">{m.name}</p>
                {m.instructions && <p className="text-[11.5px] text-slate whitespace-pre-line line-clamp-2">{m.instructions}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Toggle checked={m.isActive} onChange={v => toggle(m, v)} ariaLabel={`Offer ${m.name} at checkout`} />
                <Button size="sm" variant="outline" icon={<Pencil size={12} />} onClick={() => setEditing(m)}>Edit</Button>
                <Button size="sm" variant="outline" icon={<Trash2 size={12} />} onClick={() => setDeleting(m)} aria-label={`Delete ${m.name}`} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ManualMethodModal storeId={storeId} initial={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}`}
          message="Buyers will no longer see this payment method. Existing orders keep their payment method name."
          confirmLabel="Delete"
          loading={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ── JazzCash / PayFast / Easypaisa connect form (credentials differ per gateway) ──────────
const PK_FIELDS: Record<'jazzcash' | 'payfast' | 'easypaisa', { label: string; fields: { key: string; label: string; secret?: boolean; optional?: boolean }[]; help: string }> = {
  jazzcash: {
    label: 'JazzCash',
    help: 'From your JazzCash merchant portal (Page Redirection credentials): Merchant ID, API password and Integrity Salt. Sandbox credentials only work in Test mode.',
    fields: [{ key: 'merchantId', label: 'Merchant ID' }, { key: 'password', label: 'Password', secret: true }, { key: 'integritySalt', label: 'Integrity Salt', secret: true }],
  },
  payfast: {
    label: 'PayFast',
    help: 'From your PayFast (Pakistan) merchant account: Merchant ID and Secured Key. Register the IPN URL shown after connecting in the PayFast portal if it asks for one.',
    fields: [{ key: 'merchantId', label: 'Merchant ID' }, { key: 'securedKey', label: 'Secured Key', secret: true }, { key: 'merchantName', label: 'Merchant name on checkout page', optional: true }],
  },
  easypaisa: {
    label: 'Easypaisa',
    help: 'From your Easypaisa merchant account (Easypay REST API): Store ID, merchant account number and API username/password. Buyers enter their Easypaisa number at checkout and approve the payment in their Easypaisa app. Sandbox credentials only work in Test mode.',
    fields: [{ key: 'easypaisaStoreId', label: 'Store ID' }, { key: 'accountNum', label: 'Merchant account number' }, { key: 'username', label: 'API username' }, { key: 'password', label: 'API password', secret: true }],
  },
};

export function PkGatewayConnectModal({ storeId, provider, onClose, onSaved }: {
  storeId: string; provider: 'jazzcash' | 'payfast' | 'easypaisa'; onClose: () => void; onSaved: () => void;
}) {
  const spec = PK_FIELDS[provider];
  const [values, setValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<IntegrationMode>('sandbox');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const missing = spec.fields.filter(f => !f.optional && !values[f.key]?.trim());
    if (missing.length) { setError(`${missing.map(f => f.label).join(', ')} required.`); return; }
    setSaving(true); setError('');
    try {
      await apiConnectPkGateway(storeId, provider, { ...values, mode });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect ${spec.label}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Connect ${spec.label}`}
      width={440}
      onClose={onClose}
      mobileSheet
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Connect</Button>
      </>}
    >
      <p className="text-[11.5px] leading-[1.5] text-slate mb-4">{spec.help}</p>
      {spec.fields.map(f => (
        <Field key={f.key} label={f.label} required={!f.optional}>
          <Input
            type={f.secret ? 'password' : 'text'}
            autoComplete="off"
            value={values[f.key] ?? ''}
            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
            className="font-mono"
          />
        </Field>
      ))}
      <Field label="Mode">
        <Select value={mode} onChange={e => setMode(e.target.value as IntegrationMode)}>
          <option value="sandbox">Test (sandbox)</option>
          <option value="live">Live</option>
        </Select>
      </Field>
      {error && <p className="text-[12px] text-error -mt-1">{error}</p>}
    </Modal>
  );
}

/** Shopify-style "Test mode" switch for one gateway. Changing mode takes the gateway out of checkout until it is tested again. */
export function ModeSwitch({ storeId, integration, onChanged }: { storeId: string; integration: StoreIntegrationView; onChanged: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!integration.id) return null;
  const test = integration.mode !== 'live';
  async function change(nextTest: boolean) {
    setBusy(true);
    try {
      await apiUpdateIntegration(storeId, integration.id!, { mode: nextTest ? 'sandbox' : 'live' });
      toast.success(nextTest ? 'Test mode on — run Test, then re-enable at checkout.' : 'Live mode on — run Test, then re-enable at checkout.');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change mode.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Toggle checked={test} disabled={busy} onChange={change} ariaLabel="Test mode" />
      <span className="text-[12.5px] text-graphite flex items-center gap-1"><FlaskConical size={12} /> Test mode</span>
    </label>
  );
}

// ── Stripe: payout schedule + balance + payouts (read from the store's connected account) ──
const money = (amount: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);

export function StripePayoutsPanel({ storeId }: { storeId: string }) {
  const [data, setData] = useState<StripePayoutOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true); setError('');
    apiGetStripePayouts(storeId)
      .then(res => setData(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load payouts.'))
      .finally(() => setLoading(false));
  }, [storeId]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <SkeletonBox height={120} rounded="10px" />;
  if (error) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-[12px] text-error">{error}</p>
        <Button size="sm" variant="outline" icon={<RefreshCw size={12} />} onClick={load}>Retry</Button>
      </div>
    );
  }
  if (!data) return null;
  const s = data.schedule;
  const scheduleText = !s.interval ? 'Not available'
    : s.interval === 'manual' ? 'Manual (you trigger payouts in Stripe)'
    : s.interval === 'daily' ? `Daily${s.delayDays != null ? `, ${s.delayDays}-day delay` : ''}`
    : s.interval === 'weekly' ? `Weekly on ${s.weeklyAnchor ?? '—'}${s.delayDays != null ? `, ${s.delayDays}-day delay` : ''}`
    : `Monthly on day ${s.monthlyAnchor ?? '—'}${s.delayDays != null ? `, ${s.delayDays}-day delay` : ''}`;

  return (
    <div className="flex flex-col gap-3 border-t border-bone pt-3">
      {data.testMode && (
        <p className="text-[11.5px] rounded-md bg-[#FDF3E7] text-[#9A6A17] px-3 py-2">Stripe is in test mode — these are test payments and test payouts; no real money moves. Use Stripe test cards at checkout.</p>
      )}
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-[12.5px]">
        <div><p className="text-slate text-[11px]">Payout schedule</p><p className="font-semibold text-carbon">{scheduleText}</p></div>
        <div><p className="text-slate text-[11px]">Available balance</p><p className="font-semibold text-carbon">{data.balance.available.length ? data.balance.available.map(b => money(b.amount, b.currency)).join(' · ') : '—'}</p></div>
        <div><p className="text-slate text-[11px]">Pending balance</p><p className="font-semibold text-carbon">{data.balance.pending.length ? data.balance.pending.map(b => money(b.amount, b.currency)).join(' · ') : '—'}</p></div>
      </div>
      <div>
        <p className="text-[12px] font-bold text-carbon mb-1.5">Recent payouts</p>
        {data.payouts.length === 0 ? (
          <p className="text-[12px] text-slate">No payouts yet. Stripe pays out your sales to your bank on the schedule above.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-bone">
            {data.payouts.map(p => (
              <li key={p.id} className="py-2 flex items-center justify-between gap-3 text-[12px]">
                <span className="text-charcoal">{p.arrivalDate ? new Date(p.arrivalDate).toLocaleDateString() : new Date(p.created).toLocaleDateString()}</span>
                <span className="text-slate capitalize">{p.status.replace('_', ' ')}{p.failureMessage ? ` — ${p.failureMessage}` : ''}</span>
                <span className="font-semibold text-carbon">{money(p.amount, p.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[11px] text-slate">To change the payout schedule or bank account, open your Stripe dashboard — Stripe controls payouts.</p>
    </div>
  );
}

// ── WhatsApp: per-event switches + template manager ──────────────────────────
const EVENT_LABELS: Record<WhatsAppEventKey, string> = {
  order_confirmed: 'Order confirmation',
  order_cancelled: 'Order cancelled',
  order_refunded: 'Refund issued',
  order_shipped: 'Order shipped',
  order_delivered: 'Order delivered',
};

function TemplateModal({ storeId, onClose, onSaved }: { storeId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en_US');
  const [category, setCategory] = useState<'UTILITY' | 'MARKETING'>('UTILITY');
  const [bodyText, setBodyText] = useState('');
  const [examples, setExamples] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSaving(true); setError('');
    try {
      await apiCreateWhatsAppTemplate(storeId, {
        name: name.trim(), language, category, bodyText: bodyText.trim(),
        examples: examples.split('|').map(e => e.trim()).filter(Boolean),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit the template.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="New WhatsApp template"
      width={500}
      onClose={onClose}
      mobileSheet
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving} disabled={!name.trim() || !bodyText.trim()}>Submit to Meta</Button>
      </>}
    >
      <p className="text-[11.5px] text-slate mb-3">Templates are reviewed by Meta (usually minutes to a day). Use {'{{1}}'}, {'{{2}}'}… for variables; they are filled from the variable mapping of each event.</p>
      <Field label="Template name" required hint="Lowercase letters, numbers and underscores.">
        <Input value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="order_confirmation" className="font-mono" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Language"><Input value={language} onChange={e => setLanguage(e.target.value)} placeholder="en_US" /></Field>
        <Field label="Category">
          <Select value={category} onChange={e => setCategory(e.target.value as 'UTILITY' | 'MARKETING')}>
            <option value="UTILITY">Utility (order updates)</option>
            <option value="MARKETING">Marketing</option>
          </Select>
        </Field>
      </div>
      <Field label="Message body" required>
        <Textarea value={bodyText} rows={4} maxLength={1024} onChange={e => setBodyText(e.target.value)} placeholder="Hi! Your order {{1}} from {{2}} is confirmed. Total: {{3}}." />
      </Field>
      <Field label="Example values" hint="One per variable, separated by | — Meta requires them. e.g. 1001 | My Store | PKR 2500">
        <Input value={examples} onChange={e => setExamples(e.target.value)} />
      </Field>
      {error && <p className="text-[12px] text-error">{error}</p>}
    </Modal>
  );
}

export function WhatsAppNotificationsPanel({ storeId }: { storeId: string }) {
  const toast = useToast();
  const [settings, setSettings] = useState<WhatsAppNotificationsView | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplateView[] | null>(null);
  const [templatesError, setTemplatesError] = useState('');
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [deleting, setDeleting] = useState<WhatsAppTemplateView | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSettings = useCallback(() => {
    apiGetWhatsAppNotifications(storeId).then(r => setSettings(r.data)).catch(err => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, [storeId]);
  const loadTemplates = useCallback(() => {
    setTemplatesError('');
    apiListWhatsAppTemplates(storeId).then(r => setTemplates(r.data)).catch(err => { setTemplates([]); setTemplatesError(err instanceof Error ? err.message : 'Failed to load templates.'); });
  }, [storeId]);
  useEffect(() => { loadSettings(); loadTemplates(); }, [loadSettings, loadTemplates]);

  async function save(event: WhatsAppEventKey, patch: { enabled?: boolean; templateName?: string; params?: string[] }) {
    try {
      const r = await apiUpdateWhatsAppNotification(storeId, { event, ...patch });
      setSettings(r.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.');
      loadSettings();
    }
  }
  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try { await apiDeleteWhatsAppTemplate(storeId, deleting.name); setDeleting(null); loadTemplates(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete.'); }
    finally { setBusy(false); }
  }

  if (error) return <p className="text-[12px] text-error">{error}</p>;
  if (!settings) return <SkeletonBox height={140} rounded="10px" />;

  const approved = (templates ?? []).filter(t => t.status === 'APPROVED');
  return (
    <div className="flex flex-col gap-4 border-t border-bone pt-4">
      <div>
        <p className="text-[12.5px] font-bold text-carbon mb-2">Customer messages</p>
        <ul className="flex flex-col divide-y divide-bone">
          {settings.events.map(ev => (
            <li key={ev.event} className="py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12.5px] font-semibold text-carbon">{EVENT_LABELS[ev.event]}</span>
                <Toggle checked={ev.enabled} onChange={v => save(ev.event, { enabled: v })} ariaLabel={`Send ${EVENT_LABELS[ev.event]} on WhatsApp`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select
                  aria-label={`${EVENT_LABELS[ev.event]} template`}
                  value={ev.templateName}
                  onChange={e => save(ev.event, { templateName: e.target.value })}
                >
                  {!approved.some(t => t.name === ev.templateName) && <option value={ev.templateName}>{ev.templateName} (not approved / not found)</option>}
                  {[...new Set(approved.map(t => t.name))].map(n => <option key={n} value={n}>{n}</option>)}
                </Select>
                <Input
                  aria-label={`${EVENT_LABELS[ev.event]} variables`}
                  defaultValue={ev.params.join(', ')}
                  key={ev.params.join(',')}
                  onBlur={e => {
                    const next = e.target.value.split(',').map(x => x.trim()).filter(Boolean);
                    if (next.join(',') !== ev.params.join(',')) save(ev.event, { params: next });
                  }}
                  placeholder="order_number, store_name, total"
                  className="font-mono"
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-slate mt-1">Variables ({'{{1}}'}, {'{{2}}'}… in order): {settings.paramTokens.join(', ')}. Messages only send when the template is approved by Meta.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12.5px] font-bold text-carbon">Templates</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" icon={<RefreshCw size={12} />} onClick={loadTemplates}>Refresh</Button>
            <Button size="sm" icon={<Plus size={12} />} onClick={() => setShowNew(true)}>New template</Button>
          </div>
        </div>
        {templatesError && <p className="text-[12px] text-error mb-2">{templatesError}</p>}
        {templates === null ? <SkeletonBox height={60} rounded="10px" /> : templates.length === 0 ? (
          <p className="text-[12px] text-slate">No templates yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-bone">
            {templates.map(t => (
              <li key={`${t.name}:${t.language}`} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-mono text-carbon">{t.name} <span className="text-slate">· {t.language} · {t.category.toLowerCase()}</span></p>
                  <p className="text-[11.5px] text-slate line-clamp-2">{t.bodyText}</p>
                  {t.rejectedReason && <p className="text-[11px] text-error">Rejected: {t.rejectedReason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10.5px] font-semibold px-2 py-[2px] rounded-full" style={t.status === 'APPROVED' ? { background: '#E3F4EA', color: '#1E7A3C' } : t.status === 'REJECTED' ? { background: '#FDECEA', color: '#C0392B' } : { background: '#FDF3E7', color: '#9A6A17' }}>{t.status}</span>
                  <Button size="sm" variant="outline" icon={<Trash2 size={12} />} aria-label={`Delete ${t.name}`} onClick={() => setDeleting(t)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {showNew && <TemplateModal storeId={storeId} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); loadTemplates(); toast.success('Template submitted to Meta for review.'); }} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}`}
          message="Deletes every language version of this template in your Meta account. Events using it stop sending until you pick another."
          confirmLabel="Delete"
          loading={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
