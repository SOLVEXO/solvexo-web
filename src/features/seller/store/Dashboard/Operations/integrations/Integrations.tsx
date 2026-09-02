import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, AlertTriangle, RefreshCw, ShieldCheck, Copy, Check } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button, Modal, Toggle, SkeletonBox, Field, Input } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE_URL } from '@/api/client';
import {
  apiListStoreIntegrations, apiConnectSafepay, apiConnectWhatsApp, apiTestIntegration,
  apiUpdateIntegration, apiDisconnectIntegration,
  type StoreIntegrationsList, type StoreIntegrationView, type PaymentProviderKey,
} from '@/api/services/integrations';
import { apiCreateStripeConnectOnboardingLink, apiSyncStripeConnectStatus } from '@/api/services/stripeConnect';
import { isMetaConfigured, useWhatsAppEmbeddedSignup } from '@/hooks/integrations/useWhatsAppEmbeddedSignup';

const STATUS_STYLE: Record<StoreIntegrationView['status'], { label: string; bg: string; color: string }> = {
  not_connected: { label: 'Not Connected', bg: '#F0EEE6', color: '#5A5852' },
  connected:     { label: 'Connected',     bg: '#E3F4EA', color: '#1E7A3C' },
  disabled:      { label: 'Disabled',      bg: '#F0EEE6', color: '#5A5852' },
  error:         { label: 'Error',         bg: '#FDECEA', color: '#C0392B' },
  needs_reauth:  { label: 'Needs Reconnect', bg: '#FDF3E7', color: '#9A6A17' },
};

// Real display name per provider — the backend only ever fills
// `config.displayName` in AFTER a seller connects one (see
// StoreIntegrationsService.connectPayment), so the "not connected" row for
// a provider the seller has never set up yet previously fell back to the
// raw `provider` enum value verbatim ("safepay", lowercase) instead of its
// real brand name. One small lookup fixes every provider at once, not just
// Safepay — the same map also drives the card's own brand color/monogram.
const PROVIDER_BRAND: Record<PaymentProviderKey, { name: string; color: string; bg: string }> = {
  safepay:   { name: 'Safepay',   color: '#6B3FA0', bg: '#F1EBFA' },
  stripe:    { name: 'Stripe',    color: '#635BFF', bg: '#EEEDFF' },
  jazzcash:  { name: 'JazzCash',  color: '#D2232A', bg: '#FBE9EA' },
  easypaisa: { name: 'Easypaisa', color: '#0A8043', bg: '#E7F5EE' },
  payfast:   { name: 'PayFast',   color: '#0B5FFF', bg: '#E8F0FF' },
};

// Safepay gets its own drawn logomark (a shield + checkmark, in Safepay's
// real brand purple) instead of a plain letter — this is what "generic
// placeholder" was actually about. The other providers aren't connectable
// yet (see connectPayment's backend comment), so they keep the plain
// monogram until they're real.
function SafepayMark({ size }: { size: number }) {
  const brand = PROVIDER_BRAND.safepay;
  return (
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
      <path d="M12 2.3 4 5.2v6.1c0 5.3 3.4 9.1 8 10.2 4.6-1.1 8-4.9 8-10.2V5.2L12 2.3Z" fill={brand.color} />
      <path d="m8.3 12.1 2.5 2.5 4.9-5.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProviderMonogram({ provider, size = 42 }: { provider: PaymentProviderKey; size?: number }) {
  const brand = PROVIDER_BRAND[provider];
  // Stripe's real app/brand icon genuinely IS just a bold white "S" on a
  // solid indigo (#635BFF) rounded square — unlike the other providers, a
  // plain letterform here is the accurate real icon, not a generic
  // placeholder, so it gets solid brand-color fill + white text instead of
  // everyone else's tinted-background + brand-color text treatment.
  if (provider === 'stripe') {
    return (
      <div
        className="rounded-[10px] flex items-center justify-center shrink-0 font-bold text-white"
        style={{ width: size, height: size, background: brand.color, fontSize: size * 0.48 }}
      >
        S
      </div>
    );
  }
  return (
    <div
      className="rounded-[10px] flex items-center justify-center shrink-0 font-bold"
      style={{ width: size, height: size, background: brand.bg, color: brand.color, fontSize: size * 0.42 }}
    >
      {provider === 'safepay' ? <SafepayMark size={size} /> : brand.name.charAt(0)}
    </div>
  );
}

/** A `CopyableRow`-style single-line value with a copy button — same pattern
 *  as `StoreSettings.tsx`'s custom-domain DNS rows, kept local here since
 *  it's a 15-line self-contained primitive, not worth sharing across features. */
function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 min-w-0 text-[11.5px] text-charcoal bg-white border border-bone rounded-md px-2 py-1.5 truncate">{value}</code>
      <button type="button" onClick={copy} title="Copy" className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md border-none bg-white border border-bone text-slate hover:text-charcoal cursor-pointer">
        {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

/** Step 2 of the real Safepay connect flow (see `ConnectSafepayPayload`'s doc
 *  comment) — shown only while `maskedHints.webhookSecret` is still unset. */
function WebhookSetupPanel({ storeId, integration, onSaved }: { storeId: string; integration: StoreIntegrationView; onSaved: () => void }) {
  const [webhookSecret, setWebhookSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const webhookUrl = `${API_BASE_URL ?? ''}/api/webhooks/payments/${integration.provider}/${integration.webhookToken ?? ''}`;

  async function save() {
    if (!integration.id || !webhookSecret) return;
    setSaving(true); setError('');
    try {
      await apiUpdateIntegration(storeId, integration.id, { webhookSecret });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the webhook secret.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[10px] bg-[#FDF3E7] border border-[#F0DCB8] px-3.5 py-3 flex flex-col gap-2.5">
      <p className="text-[12px] font-semibold" style={{ color: '#9A6A17' }}>One step left — register this webhook URL with Safepay</p>
      <p className="text-[11.5px] leading-[1.5] text-slate">
        Paste this into your Safepay Merchant Dashboard → Webhooks, then paste the secret Safepay gives you back below.
      </p>
      <CopyableValue value={webhookUrl} />
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} placeholder="whsec_..." className="font-mono" />
        </div>
        <Button size="sm" onClick={save} loading={saving} disabled={!webhookSecret}>Save</Button>
      </div>
      {error && <p className="text-[11.5px] text-error">{error}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: StoreIntegrationView['status'] }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold shrink-0" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// Only the payment-card header needs this override: Stripe's synthesized
// row (see `StoreIntegrationsService.list`) reports `status: 'error'` for a
// perfectly normal, expected in-progress state — the seller already has a
// Stripe Connect account but hasn't finished Stripe's own KYC/bank-details
// step yet — not an actual failure. The shared red "Error" pill (correct for
// Safepay/WhatsApp, where `error` really does mean something broke) reads as
// alarming and wrong here, so this one combination gets its own honest label.
function PaymentStatusPill({ integration }: { integration: StoreIntegrationView }) {
  if (integration.provider === 'stripe' && integration.status === 'error') {
    return (
      <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold shrink-0" style={{ background: '#FDF3E7', color: '#9A6A17' }}>
        Setup Incomplete
      </span>
    );
  }
  return <StatusPill status={integration.status} />;
}

// ── Safepay connect form ─────────────────────────────────────────────────────
function SafepayConnectModal({ storeId, onClose, onSaved }: { storeId: string; onClose: () => void; onSaved: (v: StoreIntegrationView) => void }) {
  const [secretKey, setSecretKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Webhook Secret and Display Name are deliberately not asked here — Safepay
  // only issues a webhook secret once its webhook URL is registered in their
  // dashboard, which needs THIS connection to exist first (see the
  // `WebhookSetupPanel` step shown right after connecting), and Display Name
  // just defaults to "Safepay" server-side if never set.
  async function submit() {
    if (!secretKey || !clientId) { setError('Secret key and client ID are both required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await apiConnectSafepay(storeId, { secretKey, clientId });
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Safepay.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Connect Safepay"
      width={440}
      onClose={onClose}
      mobileSheet
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Connect</Button>
      </>}
    >
      <div className="flex items-start gap-2 rounded-[10px] bg-[#F1EBFA] px-3.5 py-3 mb-4">
        <ShieldCheck size={15} className="shrink-0 mt-[1px]" style={{ color: '#6B3FA0' }} />
        <p className="text-[11.5px] leading-[1.5]" style={{ color: '#5A3D80' }}>
          Get these from your Safepay Merchant Dashboard → API Keys. A sandbox key (containing <code>_test_</code>)
          connects in sandbox mode; a <code>_live_</code> key switches this to live automatically.
        </p>
      </div>
      <Field label="Secret Key" required>
        <Input value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="sk_test_..." className="font-mono" />
      </Field>
      <Field label="Client ID" required>
        <Input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="cl_test_..." className="font-mono" />
      </Field>
      {error && <p className="text-[12px] text-error -mt-1">{error}</p>}
    </Modal>
  );
}

// ── Stripe Connect (moved in from the old StoreSettings "Payment Gateway"
// card — same real onboarding flow, now living in the one place a seller
// actually manages every payment gateway). Unlike Safepay, this provider has
// no `StoreIntegration` row of its own — `integration` here is the backend's
// live-synthesized view of the seller's Stripe Connect status (see
// `StoreIntegrationsService.list`), so status/mode/currency are already
// correct in the shared card header above this; this section only owns the
// actual connect/continue-setup action and the post-onboarding-return sync. ──
function StripeConnectSection({ integration, onChanged }: { integration: StoreIntegrationView; onChanged: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  // Stripe's hosted onboarding redirects back here with `?connect=done` —
  // that's the one moment the DB-cached status can be stale, so this is the
  // only place that calls the real `sync` (a live Stripe API round-trip),
  // then asks the parent to reload the (now-correct) synthesized row.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('connect') !== 'done') return;
    setSyncing(true);
    apiSyncStripeConnectStatus()
      .then(() => onChanged())
      .catch(() => {})
      .finally(() => {
        setSyncing(false);
        url.searchParams.delete('connect');
        window.history.replaceState({}, '', url.toString());
      });
    // Runs once, on the return-from-onboarding mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startConnect() {
    setConnecting(true); setError('');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('connect');
      const refreshUrl = url.toString();
      url.searchParams.set('connect', 'done');
      const returnUrl = url.toString();
      const res = await apiCreateStripeConnectOnboardingLink(refreshUrl, returnUrl);
      window.location.href = res.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Stripe onboarding.');
      setConnecting(false);
    }
  }

  const isActive = integration.status === 'connected';
  const hasStarted = integration.status !== 'not_connected';

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-slate">
        Connect your own Stripe account to receive buyer payments directly — Solvexo's commission is deducted automatically, and the rest lands in your bank account via Stripe's own payout schedule, instead of a manual payout request.
      </p>
      {integration.lastError && (
        // Amber, not red — this just means "not finished yet," not "broken"
        // (see `PaymentStatusPill`'s doc comment on the badge above).
        <p className="flex items-center gap-1.5 text-[12px]" style={{ color: '#9A6A17' }}><AlertTriangle size={12} className="shrink-0" /> {integration.lastError}</p>
      )}
      {error && <p className="text-[12px] text-error">{error}</p>}
      {!isActive && (
        <div>
          <Button size="sm" loading={connecting || syncing} onClick={startConnect}>
            {hasStarted ? 'Continue Setup' : 'Connect with Stripe'}
          </Button>
        </div>
      )}
      {isActive && (
        <p className="text-[11px] text-slate">
          Not seeing a store you expect here? Stripe Connect is tied to your seller account as a whole, not one specific store.
        </p>
      )}
    </div>
  );
}

// ── Payment card (one per provider row: Safepay or the synthesized Stripe row) ──
function PaymentIntegrationCard({ integration, storeId, onChanged }: {
  integration: StoreIntegrationView; storeId: string; onChanged: () => void;
}) {
  const toast = useToast();
  const [showConnect, setShowConnect] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [togglingCheckout, setTogglingCheckout] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  // Optimistic flip — same feel as the Notifications toggle — instead of
  // waiting on the PATCH + a full refetch before the switch visibly moves.
  // Cleared once the server-confirmed value (from the next `onChanged`
  // refresh) actually catches up to it; reset to null on failure so the
  // switch snaps back to the real, unchanged server state.
  const [checkedOverride, setCheckedOverride] = useState<boolean | null>(null);
  const isCheckoutEnabled = checkedOverride ?? integration.isEnabledForCheckout;
  useEffect(() => {
    if (checkedOverride !== null && integration.isEnabledForCheckout === checkedOverride) {
      setCheckedOverride(null);
    }
  }, [integration.isEnabledForCheckout, checkedOverride]);

  const isStripe = integration.provider === 'stripe';
  const brand = PROVIDER_BRAND[integration.provider as PaymentProviderKey];
  const displayName = integration.config?.displayName ?? (isStripe ? 'Card payment (Stripe)' : brand.name);

  async function runTest() {
    if (!integration.id) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await apiTestIntegration(storeId, integration.id);
      setTestResult(res.data);
      onChanged();
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Test failed.' });
    } finally {
      setTesting(false);
    }
  }

  // Previously had no catch at all — a rejected request (e.g. the backend's
  // "run a successful test before enabling a live-mode integration" 400)
  // silently reset the toggle with zero feedback, reading as "the button
  // doesn't do anything." Now surfaces the real reason via a toast.
  async function toggleCheckout(next: boolean) {
    if (!integration.id) return;
    setCheckedOverride(next);
    setTogglingCheckout(true);
    try {
      await apiUpdateIntegration(storeId, integration.id, { isEnabledForCheckout: next });
      onChanged();
    } catch (err) {
      setCheckedOverride(null);
      toast.error(err instanceof Error ? err.message : 'Failed to update checkout setting.');
    } finally {
      setTogglingCheckout(false);
    }
  }

  async function confirmDisconnect() {
    if (!integration.id) return;
    setDisconnecting(true);
    try {
      await apiDisconnectIntegration(storeId, integration.id);
      setPendingDisconnect(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect.');
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <ProviderMonogram provider={integration.provider as PaymentProviderKey} />
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold text-carbon truncate">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-[3px]">
              <span className="text-[10px] font-semibold px-[7px] py-[1.5px] rounded-full bg-cream text-slate">
                {integration.config?.currency ?? 'PKR'}
              </span>
              <span
                className="text-[10px] font-semibold px-[7px] py-[1.5px] rounded-full"
                style={integration.mode === 'live' ? { background: '#E3F4EA', color: '#1E7A3C' } : { background: '#F0EEE6', color: '#5A5852' }}
              >
                {integration.mode === 'live' ? 'Live' : 'Sandbox'}
              </span>
            </div>
          </div>
        </div>
        <PaymentStatusPill integration={integration} />
      </div>

      {isStripe ? (
        <StripeConnectSection integration={integration} onChanged={onChanged} />
      ) : integration.status === 'not_connected' || integration.status === 'disabled' ? (
        <>
          <p className="text-[12.5px] text-slate mb-3">Accept real customer payments through {displayName} on your storefront checkout.</p>
          <Button size="sm" onClick={() => setShowConnect(true)}>Connect</Button>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {!integration.maskedHints?.webhookSecret && (
            <WebhookSetupPanel storeId={storeId} integration={integration} onSaved={onChanged} />
          )}
          {Object.keys(integration.maskedHints).length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {Object.entries(integration.maskedHints).map(([k, v]) => (
                <span key={k} className="text-[11.5px] text-slate font-mono">{k}: <span className="text-charcoal">{v}</span></span>
              ))}
            </div>
          )}
          {integration.lastError && (
            <p className="flex items-center gap-1.5 text-[12px] text-error"><AlertTriangle size={12} className="shrink-0" /> {integration.lastError}</p>
          )}
          {testResult && (
            <p className={`text-[12px] ${testResult.ok ? 'text-success' : 'text-error'}`}>{testResult.message}</p>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <Toggle checked={isCheckoutEnabled} disabled={togglingCheckout} onChange={toggleCheckout} ariaLabel={`Enable ${displayName} at checkout`} />
              <span className="text-[12.5px] text-graphite">Enabled at checkout</span>
            </label>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" icon={<RefreshCw size={12} />} loading={testing} onClick={runTest}>Test</Button>
              <Button size="sm" variant="outline" onClick={() => setPendingDisconnect(true)}>Disconnect</Button>
            </div>
          </div>
          {integration.mode === 'live' && !integration.lastVerifiedAt && (
            <p className="text-[11.5px] text-slate italic">Run "Test" at least once before you can enable a live gateway at checkout.</p>
          )}
        </div>
      )}

      {showConnect && (
        <SafepayConnectModal storeId={storeId} onClose={() => setShowConnect(false)} onSaved={() => { setShowConnect(false); onChanged(); }} />
      )}
      {pendingDisconnect && (
        <ConfirmDialog
          title={`Disconnect ${displayName}`}
          message="Buyers will no longer see this option at checkout. You can reconnect it any time."
          confirmLabel="Disconnect"
          loading={disconnecting}
          onCancel={() => setPendingDisconnect(false)}
          onConfirm={confirmDisconnect}
        />
      )}
    </div>
  );
}

// ── WhatsApp card ─────────────────────────────────────────────────────────────
function WhatsAppCard({ integration, storeId, onChanged }: { integration: StoreIntegrationView; storeId: string; onChanged: () => void }) {
  const toast = useToast();
  const { connect, connecting, error: signupError } = useWhatsAppEmbeddedSignup();
  const [saveError, setSaveError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pendingDisconnect, setPendingDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleConnect() {
    setSaveError('');
    const result = await connect();
    if (!result) return;
    try {
      await apiConnectWhatsApp(storeId, result);
      onChanged();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save the WhatsApp connection.');
    }
  }

  async function runTest() {
    if (!integration.id) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await apiTestIntegration(storeId, integration.id);
      setTestResult(res.data);
      onChanged();
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Test failed.' });
    } finally {
      setTesting(false);
    }
  }

  async function confirmDisconnect() {
    if (!integration.id) return;
    setDisconnecting(true);
    try {
      await apiDisconnectIntegration(storeId, integration.id);
      setPendingDisconnect(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect.');
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = integration.status === 'connected' || integration.status === 'needs_reauth';

  return (
    <div className="bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[42px] h-[42px] rounded-[10px] bg-[#E3F4EA] flex items-center justify-center shrink-0">
            <MessageCircle size={19} style={{ color: '#1E7A3C' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-carbon truncate">{integration.config?.displayName ?? 'WhatsApp Business'}</p>
            <p className="text-[11px] text-slate">Order shipped/delivered updates sent straight to your buyers' WhatsApp</p>
          </div>
        </div>
        <StatusPill status={integration.status} />
      </div>

      {!isConnected ? (
        <>
          <p className="text-[12.5px] text-slate mb-3">Connect your WhatsApp Business phone number via Meta — no phone number changes hands, just a one-time authorization.</p>
          {!isMetaConfigured() ? (
            <Button size="sm" disabled title="WhatsApp connect isn't configured in this environment yet">Connect WhatsApp</Button>
          ) : (
            <Button size="sm" loading={connecting} onClick={handleConnect}>Connect WhatsApp</Button>
          )}
          {(signupError || saveError) && <p className="text-[12px] text-error mt-2">{signupError || saveError}</p>}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {integration.status === 'needs_reauth' && (
            <p className="flex items-center gap-1.5 text-[12px] text-[#9A6A17]"><AlertTriangle size={12} className="shrink-0" /> Your WhatsApp access has expired or been revoked — reconnect to keep sending order updates.</p>
          )}
          {integration.lastError && (
            <p className="flex items-center gap-1.5 text-[12px] text-error"><AlertTriangle size={12} className="shrink-0" /> {integration.lastError}</p>
          )}
          {testResult && <p className={`text-[12px] ${testResult.ok ? 'text-success' : 'text-error'}`}>{testResult.message}</p>}
          <div className="flex items-center gap-2">
            {integration.status === 'needs_reauth' ? (
              !isMetaConfigured() ? (
                <Button size="sm" disabled title="WhatsApp connect isn't configured in this environment yet">Reconnect</Button>
              ) : (
                <Button size="sm" loading={connecting} onClick={handleConnect}>Reconnect</Button>
              )
            ) : (
              <Button size="sm" variant="outline" icon={<RefreshCw size={12} />} loading={testing} onClick={runTest}>Test</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setPendingDisconnect(true)}>Disconnect</Button>
          </div>
        </div>
      )}

      {pendingDisconnect && (
        <ConfirmDialog
          title="Disconnect WhatsApp"
          message="Order-update messages will stop sending until you reconnect."
          confirmLabel="Disconnect"
          loading={disconnecting}
          onCancel={() => setPendingDisconnect(false)}
          onConfirm={confirmDisconnect}
        />
      )}
    </div>
  );
}

export function StoreIntegrations() {
  usePageTitle('Integrations');
  const { storeId } = useStoreWorkspace();
  const [data, setData] = useState<StoreIntegrationsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Every card's Connect/Test/Toggle/Disconnect calls `onChanged` -> `load()`
  // to pick up the fresh row afterward. `load` used to always flip `loading`
  // back to true first, which blanked the ENTIRE page to the skeleton state
  // (and re-mounted every card, closing whichever one you'd just touched) for
  // what should have been a silent, in-place refresh. Only the very first
  // load — before any data exists yet — should show the skeleton.
  const hasLoadedOnce = useRef(false);

  const load = useCallback(() => {
    if (!storeId) return;
    if (!hasLoadedOnce.current) setLoading(true);
    setError('');
    apiListStoreIntegrations(storeId)
      .then(res => { setData(res.data); hasLoadedOnce.current = true; })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load integrations.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <StorePageHeader
        title="Integrations"
        subtitle="Connect a payment gateway and WhatsApp Business to your own storefront checkout and order updates."
      />

      <div className="px-4 lg:px-7 pb-8 pt-5 flex flex-col gap-6">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonBox key={i} height={160} rounded="10px" />)}
          </div>
        ) : error ? (
          <p className="text-[13px] text-error">{error}</p>
        ) : data && (
          <>
            <div>
              <p className="text-[13px] font-bold text-carbon mb-1">Payment Gateways</p>
              <p className="text-[12px] text-slate mb-3">Only one is ever active at checkout at a time — enable the one you want buyers to see.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.payment.map(integration => (
                  <PaymentIntegrationCard key={integration.provider} integration={integration} storeId={storeId} onChanged={load} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[13px] font-bold text-carbon mb-1">Messaging</p>
              <p className="text-[12px] text-slate mb-3">Automatic order-status updates for your buyers.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <WhatsAppCard integration={data.whatsapp} storeId={storeId} onChanged={load} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
