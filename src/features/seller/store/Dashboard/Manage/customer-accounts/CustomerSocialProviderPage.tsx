import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, Copy, Loader2, RefreshCw } from 'lucide-react';
import { useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { PageHeader } from '@/components/comman/ui/PageHeader';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { TokenStorage } from '@/api/services/auth';
import {
  apiConnectCustomerSocial, apiDisconnectCustomerSocial, apiGetCustomerSocialSetup, SOCIAL_PROVIDER_LABEL,
  type CustomerSocialProviderSetup, type CustomerSocialSetup, type SocialProviderKey,
} from '@/api/services/customerSocialLogin';

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — the value is still selectable */ }
  };
  return (
    <div className="mb-2.5">
      <p className="text-[11px] font-semibold text-slate mb-1">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-bone bg-cream px-3 py-2">
        <code className="flex-1 min-w-0 text-[12px] text-charcoal break-all select-all">{value}</code>
        <button type="button" onClick={copy} aria-label={`Copy ${label}`} className="flex items-center gap-1 text-[11.5px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer shrink-0">
          {copied ? <CheckCircle size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-bone bg-white px-3 py-2 text-[13px] text-charcoal outline-none focus:border-brand-orange';

/** Shopify's "Sign in with Google / Facebook" page: setup instructions to copy from, the two credentials to paste back,
 *  and Save / Disconnect. The secret is write-only — it is never read back, only a last-4 hint. */
export function CustomerSocialProviderPage() {
  const { provider: raw } = useParams();
  const { storeId } = useStoreWorkspace();
  const canEdit = hasNavPermission(TokenStorage.getUser(), 'settings.general.manage');
  const provider = raw === 'google' || raw === 'facebook' ? (raw as SocialProviderKey) : null;

  const [setup, setSetup] = useState<CustomerSocialSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiGetCustomerSocialSetup(storeId);
      setSetup(res.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load this sign-in method.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const current: CustomerSocialProviderSetup | undefined = setup?.providers.find(p => p.provider === provider);
  useEffect(() => { setClientId(current?.clientId ?? ''); setClientSecret(''); }, [current?.clientId, current?.status]);

  if (!provider) return <Navigate to={`/store/${storeId}/settings/customer-accounts/authentication`} replace />;

  const label = SOCIAL_PROVIDER_LABEL[provider];
  const idLabel = provider === 'google' ? 'Client ID' : 'App ID';
  const secretLabel = provider === 'google' ? 'Client secret' : 'App secret';
  const connected = current?.status === 'connected';

  const save = async () => {
    if (!storeId || saving || !canEdit) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiConnectCustomerSocial(storeId, provider, { clientId: clientId.trim(), clientSecret: clientSecret.trim() });
      setSetup(res.data);
      setClientSecret('');
      setMsg({ ok: true, text: `${label} sign-in saved. It now appears on your store's sign-in page.` });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!storeId || saving || !canEdit) return;
    if (!window.confirm(`Disconnect ${label} sign-in? Customers will no longer see the ${label} button on your store.`)) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiDisconnectCustomerSocial(storeId, provider);
      setSetup(res.data);
      setMsg({ ok: true, text: `${label} sign-in disconnected.` });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to disconnect.' });
    } finally {
      setSaving(false);
    }
  };

  const steps = provider === 'google'
    ? [
        <>In <b>Google Cloud Console</b>, create a project and configure the <b>OAuth consent screen</b> (app name, support email).</>,
        <>Go to <b>Credentials → Create credentials → OAuth client ID</b> and choose <b>Web application</b>.</>,
        <>Under <b>Authorized JavaScript origins</b>, add each store address below.</>,
        <>Under <b>Authorized redirect URIs</b>, add the redirect URI below.</>,
        <>Copy the <b>Client ID</b> and <b>Client secret</b> and paste them in the Credentials section, then Save.</>,
        <>Back in Google Cloud, click <b>Publish app</b>. Until it is published, only test users can sign in.</>,
      ]
    : [
        <>In <b>Meta for Developers</b>, create an app and choose <b>Authenticate and request data from users with Facebook Login</b>.</>,
        <>Add the <b>email</b> permission to the app.</>,
        <>In <b>Facebook Login → Settings</b>, add the redirect URI below under <b>Valid OAuth Redirect URIs</b>.</>,
        <>Add each store address below under the app's <b>Domains / Website</b> settings.</>,
        <>Copy the <b>App ID</b> and <b>App secret</b> and paste them in the Credentials section, then Save.</>,
        <>Switch the app to <b>Live</b> mode. Until it is live, only app roles can sign in.</>,
      ];

  return (
    <div className="max-w-[720px]">
      <Link to={`/store/${storeId}/settings/customer-accounts/authentication`} className="inline-flex items-center gap-1.5 text-[12px] text-slate no-underline hover:text-charcoal mb-3">
        <ArrowLeft size={13} /> Authentication
      </Link>
      <PageHeader
        title={`Sign in with ${label}`}
        description={`Let customers sign in to your store with their ${label} account. You create the ${label} app yourself, then paste its credentials here.`}
        actions={connected ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>Connected</span> : undefined}
      />

      {loading && (
        <div className="mt-5 flex flex-col gap-3" aria-busy="true" aria-label="Loading">
          <SkeletonBox height={220} rounded="12px" />
          <SkeletonBox height={160} rounded="12px" />
        </div>
      )}

      {!loading && loadError && (
        <div role="alert" className="mt-5 flex items-center gap-3 rounded-xl border border-bone bg-white p-4 text-[13px] text-error">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{loadError}</span>
          <button type="button" onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bone bg-white text-[12px] font-semibold text-charcoal cursor-pointer">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {!loading && !loadError && current && setup && (
        <>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone mt-5">
            <p className="text-[14px] font-semibold text-charcoal mb-1">Setup instructions</p>
            <ol className="text-[12.5px] text-charcoal pl-5 mb-4 leading-relaxed list-decimal">
              {steps.map((s, i) => <li key={i} className="mb-1">{s}</li>)}
            </ol>
            {setup.storeOrigins.map((o, i) => (
              <CopyField key={o} label={i === 0 ? 'Store address (Authorized JavaScript origin)' : 'Store address (another domain)'} value={o} />
            ))}
            <CopyField label="Redirect URI" value={current.redirectUri} />
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone mt-5">
            <p className="text-[14px] font-semibold text-charcoal mb-3">Credentials</p>
            <label className="block mb-3">
              <span className="block text-[11.5px] font-semibold text-slate mb-1">{idLabel}</span>
              <input className={inputCls} value={clientId} onChange={e => { setClientId(e.target.value); setMsg(null); }} disabled={!canEdit || saving} autoComplete="off" spellCheck={false} />
            </label>
            <label className="block">
              <span className="block text-[11.5px] font-semibold text-slate mb-1">{secretLabel}</span>
              <input
                className={inputCls} type="password" value={clientSecret} onChange={e => { setClientSecret(e.target.value); setMsg(null); }}
                disabled={!canEdit || saving} autoComplete="new-password" spellCheck={false}
                placeholder={connected && current.maskedSecret ? `${current.maskedSecret} — enter a new secret to replace it` : ''}
              />
            </label>

            {!canEdit && <p className="text-[11px] text-slate mt-3">You need the "Manage general settings" permission to change this.</p>}

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                type="button" onClick={save}
                disabled={saving || !canEdit || !clientId.trim() || !clientSecret.trim()}
                className="flex items-center gap-[7px] px-[18px] py-2 rounded-lg border-none text-[13px] font-semibold"
                style={{
                  background: !saving && canEdit && clientId.trim() && clientSecret.trim() ? '#D97757' : '#E8E6DC',
                  color: !saving && canEdit && clientId.trim() && clientSecret.trim() ? '#fff' : '#8C8A82',
                  cursor: !saving && canEdit && clientId.trim() && clientSecret.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
              {connected && canEdit && (
                <button type="button" onClick={disconnect} disabled={saving} className="px-[18px] py-2 rounded-lg border border-bone bg-white text-[13px] font-semibold text-error cursor-pointer">
                  Disconnect
                </button>
              )}
              {msg && (
                <span role="status" className="flex items-center gap-1.5 text-[12px]" style={{ color: msg.ok ? '#166534' : '#991B1B' }}>
                  {msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {msg.text}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
