import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Check, Copy, ExternalLink } from 'lucide-react';
import { Button, Modal, Field, Input } from '@/components/comman/ui';
import { API_BASE_URL } from '@/api/client';
import { apiConnectGenericGateway, apiStartStripeStandard, apiSyncStripeStandard, apiUpdateIntegration, type StoreIntegrationView } from '@/api/services/integrations';

/**
 * Catalog-driven pieces for the global gateways a seller connects with their OWN keys (Stripe, PayPal, Razorpay,
 * Paystack, Flutterwave, Mollie). What to ask for, how the webhook is set up and what to tell the seller all comes from
 * `integration.catalog` (the backend's payment-provider-catalog), so a new gateway needs no new UI.
 */

const STRIPE_RETURN_PARAM = 'stripe_standard';

/**
 * Stripe with the seller's OWN Stripe account (Connect Standard, direct charges): one button sends the seller to Stripe's
 * hosted onboarding; when they come back (`?stripe_standard=return`) the status is re-read from Stripe automatically.
 * Shown while the account is not connected, and as "Continue setup / Refresh status" while Stripe still needs details.
 */
export function StripeStandardActions({ storeId, integration, onChanged }: { storeId: string; integration: StoreIntegrationView; onChanged: () => void }) {
  const [busy, setBusy] = useState<'start' | 'sync' | null>(null);
  const [error, setError] = useState('');
  const handledReturn = useRef(false);
  const hasAccount = integration.status !== 'not_connected' && integration.status !== 'disabled';

  async function start() {
    setBusy('start'); setError('');
    try {
      const back = new URL(window.location.href);
      back.searchParams.set(STRIPE_RETURN_PARAM, 'return');
      const res = await apiStartStripeStandard(storeId, window.location.href, back.toString());
      window.location.href = res.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the Stripe connection.');
      setBusy(null);
    }
  }

  async function sync() {
    setBusy('sync'); setError('');
    try {
      await apiSyncStripeStandard(storeId);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check the Stripe account.');
    } finally {
      setBusy(null);
    }
  }

  // Back from Stripe's onboarding: re-check once and clean the URL. Deferred so the state updates inside sync() run after
  // the effect, and the guard flips inside the timer so React StrictMode's double mount still ends with one check.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (handledReturn.current || url.searchParams.get(STRIPE_RETURN_PARAM) !== 'return') return;
      handledReturn.current = true;
      url.searchParams.delete(STRIPE_RETURN_PARAM);
      window.history.replaceState({}, '', url.toString());
      void sync();
    }, 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12.5px] text-slate">
        {hasAccount
          ? 'Stripe still needs a few details before you can take payments. Finish them on Stripe, then refresh the status.'
          : 'Connect your own Stripe account. Customers pay you directly and Stripe pays out to your bank — the money never passes through Solvexo, and Solvexo adds no card fee.'}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={start} loading={busy === 'start'}>{hasAccount ? 'Continue setup on Stripe' : 'Connect with Stripe'}</Button>
        {hasAccount && <Button size="sm" variant="outline" onClick={sync} loading={busy === 'sync'}>Refresh status</Button>}
      </div>
      {error && <p className="text-[11.5px] text-error" role="alert">{error}</p>}
    </div>
  );
}

function webhookUrlFor(integration: StoreIntegrationView) {
  return `${API_BASE_URL ?? ''}/webhooks/payments/${integration.provider}/${integration.webhookToken ?? ''}`;
}

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-bone bg-white px-2.5 py-1.5">
      <code className="flex-1 min-w-0 truncate text-[11.5px] text-charcoal">{value}</code>
      <button
        type="button"
        aria-label="Copy webhook URL"
        className="shrink-0 text-slate hover:text-carbon"
        onClick={() => { void navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export function GenericGatewayConnectModal({ storeId, integration, onClose, onSaved }: {
  storeId: string; integration: StoreIntegrationView; onClose: () => void; onSaved: () => void;
}) {
  const catalog = integration.catalog;
  const fields = catalog?.fields ?? [];
  const label = catalog?.label ?? String(integration.provider);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const missing = fields.filter(f => !f.optional && !values[f.key]?.trim());
    if (missing.length) { setError(`${missing.map(f => f.label).join(', ')} ${missing.length > 1 ? 'are' : 'is'} required.`); return; }
    setSaving(true); setError('');
    try {
      await apiConnectGenericGateway(storeId, String(integration.provider), values);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect ${label}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Connect ${label}`}
      width={460}
      onClose={onClose}
      mobileSheet
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Connect</Button>
      </>}
    >
      <div className="flex items-start gap-2 rounded-[10px] bg-cream px-3.5 py-3 mb-4">
        <ShieldCheck size={15} className="shrink-0 mt-[1px] text-slate" />
        <p className="text-[11.5px] leading-[1.5] text-slate">
          Customers pay you directly through your own {label} account — the money never passes through Solvexo. Your keys are stored encrypted.
          {catalog?.docsUrl && (
            <> <a href={catalog.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">{label} docs <ExternalLink size={10} /></a></>
          )}
        </p>
      </div>
      {fields.map(f => (
        <Field key={f.key} label={f.label} required={!f.optional}>
          <Input
            type={f.secret ? 'password' : 'text'}
            autoComplete="off"
            value={values[f.key] ?? ''}
            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className="font-mono"
          />
          {f.help && <p className="text-[11px] text-slate mt-1">{f.help}</p>}
        </Field>
      ))}
      <p className="text-[11px] text-slate -mt-1">
        Test or live mode is read from the key itself. Run a connection test before enabling it at checkout.
      </p>
      {error && <p className="text-[12px] text-error mt-2" role="alert">{error}</p>}
    </Modal>
  );
}

/** Webhook step for a connected gateway: the URL to register and (for 'secret' gateways) where to paste the secret. */
export function GenericWebhookPanel({ storeId, integration, onSaved }: { storeId: string; integration: StoreIntegrationView; onSaved: () => void }) {
  const catalog = integration.catalog;
  const [secret, setSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!catalog || catalog.webhook === 'none' || !integration.webhookToken) return null;

  const needsSecret = catalog.webhook === 'secret';
  const hasSecret = !!integration.maskedHints?.webhookSecret;
  const label = catalog.label;

  async function save() {
    if (!integration.id || !secret.trim()) return;
    setSaving(true); setError('');
    try {
      await apiUpdateIntegration(storeId, integration.id, { webhookSecret: secret.trim() });
      setSecret('');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save the ${catalog?.webhookSecretLabel?.toLowerCase() ?? 'webhook secret'}.`);
    } finally {
      setSaving(false);
    }
  }

  const pending = needsSecret && !hasSecret;
  return (
    <div className={`rounded-[10px] border px-3.5 py-3 flex flex-col gap-2.5 ${pending ? 'bg-[#FDF3E7] border-[#F0DCB8]' : 'bg-cream border-bone'}`}>
      <p className="text-[12px] font-semibold" style={{ color: pending ? '#9A6A17' : undefined }}>
        {pending ? `One step left — register this webhook with ${label}` : `${label} webhook`}
      </p>
      {catalog.webhookHelp && <p className="text-[11.5px] leading-[1.5] text-slate">{catalog.webhookHelp}</p>}
      <CopyRow value={webhookUrlFor(integration)} />
      {needsSecret && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="password"
              autoComplete="off"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder={hasSecret ? `${catalog.webhookSecretLabel ?? 'Secret'} saved — paste a new one to replace it` : (catalog.webhookSecretLabel ?? 'Webhook secret')}
              aria-label={catalog.webhookSecretLabel ?? 'Webhook secret'}
              className="font-mono"
            />
          </div>
          <Button size="sm" onClick={save} loading={saving} disabled={!secret.trim()}>Save</Button>
        </div>
      )}
      {error && <p className="text-[11.5px] text-error" role="alert">{error}</p>}
    </div>
  );
}
