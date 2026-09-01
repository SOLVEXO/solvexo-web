import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, MessageCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button, Modal, Toggle, SkeletonBox } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import {
  apiListStoreIntegrations, apiConnectSafepay, apiConnectWhatsApp, apiTestIntegration,
  apiUpdateIntegration, apiDisconnectIntegration,
  type StoreIntegrationsList, type StoreIntegrationView,
} from '@/api/services/integrations';
import { isMetaConfigured, useWhatsAppEmbeddedSignup } from '@/hooks/integrations/useWhatsAppEmbeddedSignup';

const STATUS_STYLE: Record<StoreIntegrationView['status'], { label: string; bg: string; color: string }> = {
  not_connected: { label: 'Not Connected', bg: '#F0EEE6', color: '#5A5852' },
  connected:     { label: 'Connected',     bg: '#E3F4EA', color: '#1E7A3C' },
  disabled:      { label: 'Disabled',      bg: '#F0EEE6', color: '#5A5852' },
  error:         { label: 'Error',         bg: '#FDECEA', color: '#C0392B' },
  needs_reauth:  { label: 'Needs Reconnect', bg: '#FDF3E7', color: '#9A6A17' },
};

function StatusPill({ status }: { status: StoreIntegrationView['status'] }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Safepay connect form ─────────────────────────────────────────────────────
function SafepayConnectModal({ storeId, onClose, onSaved }: { storeId: string; onClose: () => void; onSaved: (v: StoreIntegrationView) => void }) {
  const [secretKey, setSecretKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [displayName, setDisplayName] = useState('Safepay');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!secretKey || !clientId || !webhookSecret) { setError('Secret key, client id, and webhook secret are all required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await apiConnectSafepay(storeId, { secretKey, clientId, webhookSecret, displayName: displayName || undefined });
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
      width={460}
      onClose={onClose}
      mobileSheet
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Connect</Button>
      </>}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[12px] text-slate">Get these from your Safepay Merchant Dashboard → API Keys. Sandbox keys (containing <code>_test_</code>) connect in sandbox mode; a <code>_live_</code> key switches this to live automatically.</p>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Secret Key</label>
          <input value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="sk_test_..."
            className="w-full px-3 py-2 text-[13px] font-mono border border-bone rounded-lg outline-none text-charcoal bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Client ID</label>
          <input value={clientId} onChange={e => setClientId(e.target.value)}
            className="w-full px-3 py-2 text-[13px] font-mono border border-bone rounded-lg outline-none text-charcoal bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Webhook Secret</label>
          <input value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)}
            className="w-full px-3 py-2 text-[13px] font-mono border border-bone rounded-lg outline-none text-charcoal bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Display Name (optional)</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Payment card (one per provider row: Safepay or the synthesized Stripe row) ──
function PaymentIntegrationCard({ integration, storeId, onChanged }: {
  integration: StoreIntegrationView; storeId: string; onChanged: () => void;
}) {
  const [showConnect, setShowConnect] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [togglingCheckout, setTogglingCheckout] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isStripe = integration.provider === 'stripe';
  const displayName = integration.config?.displayName ?? (isStripe ? 'Card payment (Stripe)' : integration.provider);

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

  async function toggleCheckout(next: boolean) {
    if (!integration.id) return;
    setTogglingCheckout(true);
    try {
      await apiUpdateIntegration(storeId, integration.id, { isEnabledForCheckout: next });
      onChanged();
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
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[42px] h-[42px] rounded-[10px] bg-brand-pale-orange flex items-center justify-center shrink-0">
            <CreditCard size={19} style={{ color: '#D97757' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-carbon truncate">{displayName}</p>
            <p className="text-[11px] text-slate">{integration.config?.currency ?? 'PKR'} · {integration.mode === 'live' ? 'Live' : 'Sandbox'}</p>
          </div>
        </div>
        <StatusPill status={integration.status} />
      </div>

      {isStripe ? (
        <>
          <p className="text-[12.5px] text-slate mb-3">Stripe is managed from your store's Payment Gateway settings, not here.</p>
          <Link to={`/store/${storeId}/settings`}>
            <Button size="sm" variant="outline" icon={<ExternalLink size={13} />}>
              {integration.status === 'connected' ? 'Manage in Settings' : 'Connect in Settings'}
            </Button>
          </Link>
        </>
      ) : integration.status === 'not_connected' || integration.status === 'disabled' ? (
        <>
          <p className="text-[12.5px] text-slate mb-3">Accept real customer payments through {displayName} on your storefront checkout.</p>
          <Button size="sm" onClick={() => setShowConnect(true)}>Connect</Button>
        </>
      ) : (
        <div className="flex flex-col gap-3">
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
              <Toggle checked={integration.isEnabledForCheckout} disabled={togglingCheckout} onChange={toggleCheckout} ariaLabel={`Enable ${displayName} at checkout`} />
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

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    apiListStoreIntegrations(storeId)
      .then(res => setData(res.data))
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
