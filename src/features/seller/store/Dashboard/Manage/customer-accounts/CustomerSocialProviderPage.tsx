import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { PasswordField } from '@/components/comman/ui/PasswordField';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowDown, ArrowLeft, CheckCircle, Copy, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { PageHeader } from '@/components/comman/ui/PageHeader';
import { Modal } from '@/components/comman/ui/Modal';
import { TokenStorage } from '@/api/services/auth';
import {
  apiConnectCustomerSocial, apiDisconnectCustomerSocial, apiGetCustomerSocialSetup, apiTestCustomerSocial, SOCIAL_PROVIDER_LABEL,
  type CustomerSocialProviderSetup, type CustomerSocialSetup, type SocialProviderKey,
} from '@/api/services/customerSocialLogin';
import { PreviewButton, ProviderLogo, StatusBadge } from './socialProviderUi';
import { formatWhen, providerState } from './socialProviderUtils';

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
    <div className="mt-2.5">
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

const inputCls = 'w-full rounded-lg border border-bone bg-white px-3 py-2.5 text-[13px] text-charcoal outline-none focus:border-brand-orange disabled:bg-cream disabled:cursor-not-allowed';

/** "solvexo.store" from "https://api.solvexo.store/..." — the root domain Google/Facebook ask for as an authorized domain. */
function rootDomain(url: string): string {
  try {
    return new URL(url).hostname.split('.').slice(-2).join('.');
  } catch {
    return '';
  }
}

function hostOf(origin: string): string {
  try { return new URL(origin).hostname; } catch { return origin; }
}

interface Step { body: ReactNode; fields?: { label: string; value: string }[] }

/** Shopify's "Sign in with Google / Facebook" page: a step-by-step guide on the left, the credentials form (with Test
 *  connection and Disconnect) and a preview on the right. The secret is write-only — only a last-4 hint ever comes back. */
export function CustomerSocialProviderPage() {
  const { provider: raw } = useParams();
  const { storeId } = useStoreWorkspace();
  const canEdit = hasNavPermission(TokenStorage.getUser(), 'settings.general.manage');
  const provider = raw === 'google' || raw === 'facebook' ? (raw as SocialProviderKey) : null;
  const idFieldId = useId();
  const secretFieldId = useId();

  const [setup, setSetup] = useState<CustomerSocialSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [busy, setBusy] = useState<'save' | 'test' | 'disconnect' | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
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
  const state = providerState(current?.status ?? 'not_connected', current?.lastError ?? null);
  const working = busy !== null;
  const canSave = !working && canEdit && !!clientId.trim() && !!clientSecret.trim();
  const verifiedAt = formatWhen(current?.lastVerifiedAt);

  const save = async () => {
    if (!storeId || !canSave) return;
    setBusy('save');
    setMsg(null);
    try {
      const res = await apiConnectCustomerSocial(storeId, provider, { clientId: clientId.trim(), clientSecret: clientSecret.trim() });
      setSetup(res.data);
      setClientSecret('');
      setMsg({ ok: true, text: `${label} accepted your credentials. The ${label} button now appears on your store's sign-in page.` });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to save.' });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    if (!storeId || working || !canEdit) return;
    setBusy('test');
    setMsg(null);
    try {
      const res = await apiTestCustomerSocial(storeId, provider);
      setSetup(res.data);
      setMsg({ ok: res.ok, text: res.message ?? (res.ok ? `${label} accepted your credentials.` : `${label} rejected your credentials.`) });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Test failed. Try again.' });
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    if (!storeId || working || !canEdit) return;
    setBusy('disconnect');
    setMsg(null);
    try {
      const res = await apiDisconnectCustomerSocial(storeId, provider);
      setSetup(res.data);
      setConfirmDisconnect(false);
      setMsg({ ok: true, text: `${label} sign-in disconnected.` });
    } catch (err) {
      setConfirmDisconnect(false);
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to disconnect.' });
    } finally {
      setBusy(null);
    }
  };

  const redirectUri = current?.redirectUri ?? '';
  const origins = setup?.storeOrigins ?? [];
  const originFields = origins.map((o, i) => ({
    label: provider === 'google'
      ? (i === 0 ? 'Store address (Authorized JavaScript origin)' : 'Store address — another domain')
      : (i === 0 ? 'Store address (Site URL)' : 'Store address — another domain'),
    value: o,
  }));
  const domainValues = provider === 'google'
    ? [rootDomain(redirectUri)]
    : Array.from(new Set([rootDomain(redirectUri), ...origins.map(hostOf)]));
  const domainFields = domainValues.filter(Boolean).map((d, i) => ({
    label: provider === 'google' ? 'Authorized domain' : `App domain${domainValues.length > 1 ? ` ${i + 1}` : ''}`,
    value: d,
  }));

  const steps: Step[] = provider === 'google'
    ? [
        { body: <>In <b>Google Cloud Console</b>, create a project and open <b>OAuth consent screen</b>. Add your app name, support email and your store&apos;s <b>Privacy Policy link</b>, and add this <b>Authorized domain</b>.</>, fields: domainFields },
        { body: <>Go to <b>Credentials → Create credentials → OAuth client ID</b> and choose <b>Web application</b>.</> },
        { body: <>Under <b>Authorized JavaScript origins</b>, add each store address.</>, fields: originFields },
        { body: <>Under <b>Authorized redirect URIs</b>, add this redirect URI.</>, fields: [{ label: 'Redirect URI', value: redirectUri }] },
        { body: <>Copy the <b>Client ID</b> and <b>Client secret</b> and paste them into the Credentials box, then <b>Save</b>.</> },
        { body: <>Back in Google Cloud, click <b>Publish app</b>. Until it is published, only test users can sign in.</> },
      ]
    : [
        { body: <>In <b>Meta for Developers</b>, create an app and choose <b>Authenticate and request data from users with Facebook Login</b>.</> },
        { body: <>In <b>App settings → Basic</b>, add your store&apos;s <b>Privacy Policy URL</b>, these <b>App Domains</b> and your store address as the <b>Site URL</b>.</>, fields: [...domainFields, ...originFields] },
        { body: <>In <b>Facebook Login → Settings</b>, add this redirect URI under <b>Valid OAuth Redirect URIs</b>.</>, fields: [{ label: 'Redirect URI', value: redirectUri }] },
        { body: <>Make sure the <b>email</b> permission is available for the app (it is by default).</> },
        { body: <>Copy the <b>App ID</b> and <b>App secret</b> from <b>App settings → Basic</b>, paste them into the Credentials box, then <b>Save</b>.</> },
        { body: <>Switch the app to <b>Live</b> mode. Until it is live, only people with a role on the app can sign in.</> },
      ];

  return (
    <div className="w-full px-4 lg:px-7 pt-5 pb-10">
      <Link to={`/store/${storeId}/settings/customer-accounts/authentication`} className="inline-flex items-center gap-1.5 text-[12px] text-slate no-underline hover:text-charcoal mb-3">
        <ArrowLeft size={13} /> Authentication
      </Link>
      <PageHeader
        title={`Sign in with ${label}`}
        description={`Let customers sign in to your store with their ${label} account. You create the ${label} app yourself, then paste its credentials here.`}
        actions={current ? <StatusBadge state={state} /> : undefined}
      />

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
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
          {connected && current.lastError && (
            <div role="alert" className="lg:col-span-2 flex items-start gap-2.5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3.5 text-[12.5px] text-[#991B1B]">
              <AlertCircle size={15} className="shrink-0 mt-px" />
              <span>The last check failed: {current.lastError} Customers may not be able to sign in with {label} until this is fixed.</span>
            </div>
          )}

          <section className="rounded-xl border border-bone bg-white p-5 sm:p-6" aria-labelledby="guide-title">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 id="guide-title" className="text-[15px] font-semibold text-charcoal">Set up your {label} app</h2>
                <p className="text-[12px] text-slate mt-0.5">Follow these {steps.length} steps. It takes about 5 minutes.</p>
              </div>
              <a href="#credentials" className="lg:hidden inline-flex items-center gap-1 text-[12px] font-semibold text-brand-orange no-underline">
                Already have your keys? <ArrowDown size={13} />
              </a>
            </div>
            <ol className="m-0 mt-5 p-0 list-none flex flex-col">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3.5">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="w-7 h-7 rounded-full bg-brand-pale-orange text-brand-orange text-[12px] font-bold flex items-center justify-center">{i + 1}</span>
                    {i < steps.length - 1 && <span className="flex-1 w-px bg-bone my-1" aria-hidden="true" />}
                  </div>
                  <div className={`min-w-0 flex-1 ${i < steps.length - 1 ? 'pb-5' : ''}`}>
                    <p className="text-[13px] text-charcoal leading-relaxed pt-[3px]">{s.body}</p>
                    {s.fields?.filter(f => f.value).map(f => <CopyField key={f.label + f.value} label={f.label} value={f.value} />)}
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 pt-4 border-t border-bone text-[11.5px] text-slate leading-relaxed">
              Add a new domain to your store later? Come back here and add its address to your {label} app too, or customers on that domain won&apos;t be able to sign in.
            </p>
          </section>

          <div className="flex flex-col gap-5 lg:sticky lg:top-4">
            <section id="credentials" className="rounded-xl border border-bone bg-white p-5 sm:p-6 scroll-mt-4" aria-labelledby="cred-title">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <h2 id="cred-title" className="text-[15px] font-semibold text-charcoal flex items-center gap-2.5">
                  <ProviderLogo provider={provider} size={20} /> Credentials
                </h2>
                {connected && verifiedAt && !current.lastError && (
                  <span className="flex items-center gap-1 text-[11.5px] text-[#166534]"><CheckCircle size={13} /> Verified {verifiedAt}</span>
                )}
              </div>

              <div className="mb-3.5">
                <label htmlFor={idFieldId} className="block text-[11.5px] font-semibold text-slate mb-1">{idLabel}</label>
                <input
                  id={idFieldId} className={inputCls} value={clientId} onChange={e => { setClientId(e.target.value); setMsg(null); }}
                  disabled={!canEdit || working} autoComplete="off" spellCheck={false}
                  placeholder={provider === 'google' ? '1234567890-abc123.apps.googleusercontent.com' : '1234567890123456'}
                />
              </div>
              <div>
                <label htmlFor={secretFieldId} className="block text-[11.5px] font-semibold text-slate mb-1">{secretLabel}</label>
                <PasswordField
                  id={secretFieldId} className={inputCls} value={clientSecret} onChange={e => { setClientSecret(e.target.value); setMsg(null); }}
                  disabled={!canEdit || working} autoComplete="new-password" spellCheck={false}
                  placeholder={connected && current.maskedSecret ? `${current.maskedSecret} — enter a new one to replace` : ''}
                />
                <p className="flex items-start gap-1.5 text-[11px] text-slate mt-2 leading-relaxed">
                  <ShieldCheck size={13} className="shrink-0 mt-px text-[#16A34A]" />
                  We check these with {label} when you save. The secret is stored encrypted and never shown again.
                </p>
              </div>

              {!canEdit && <p className="text-[11.5px] text-slate mt-3">You need the &quot;Manage general settings&quot; permission to change this.</p>}

              <div className="flex flex-col gap-2.5 mt-5">
                <button
                  type="button" onClick={save} disabled={!canSave}
                  className="flex items-center justify-center gap-[7px] w-full px-[18px] py-2.5 rounded-lg border-none text-[13px] font-semibold"
                  style={{ background: canSave ? '#D97757' : '#E8E6DC', color: canSave ? '#fff' : '#8C8A82', cursor: canSave ? 'pointer' : 'not-allowed' }}
                >
                  {busy === 'save' && <Loader2 size={14} className="animate-spin" />}
                  {busy === 'save' ? `Checking with ${label}...` : connected ? 'Save new credentials' : `Connect ${label}`}
                </button>
                {connected && canEdit && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button type="button" onClick={test} disabled={working} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-bone bg-white text-[13px] font-semibold text-charcoal cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                      {busy === 'test' && <Loader2 size={14} className="animate-spin" />}
                      {busy === 'test' ? 'Testing...' : 'Test connection'}
                    </button>
                    <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={working} className="px-3 py-2.5 rounded-lg border border-bone bg-white text-[13px] font-semibold text-error cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                      Disconnect
                    </button>
                  </div>
                )}
              </div>

              <div role="status" aria-live="polite" className="min-h-[20px] mt-3">
                {msg && (
                  <span className="flex items-start gap-1.5 text-[12.5px] leading-relaxed" style={{ color: msg.ok ? '#166534' : '#991B1B' }}>
                    {msg.ok ? <CheckCircle size={14} className="shrink-0 mt-px" /> : <AlertCircle size={14} className="shrink-0 mt-px" />}
                    {msg.text}
                  </span>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-bone bg-white p-5" aria-label="Preview">
              <p className="text-[13px] font-semibold text-charcoal">What customers will see</p>
              <div className="mt-3 rounded-lg border border-bone bg-cream p-4">
                <PreviewButton provider={provider} label={label} />
              </div>
              <p className="text-[11.5px] text-slate mt-2.5 leading-relaxed">
                {connected ? 'This button is live on your store\'s sign-in page.' : 'This button appears once the method is connected.'}
              </p>
            </section>
          </div>
        </div>
      )}

      {confirmDisconnect && (
        <Modal
          title={`Disconnect ${label} sign-in?`}
          onClose={() => { if (busy !== 'disconnect') setConfirmDisconnect(false); }}
          width={420}
          mobileSheet
          footer={
            <>
              <button type="button" onClick={() => setConfirmDisconnect(false)} disabled={busy === 'disconnect'} className="px-4 py-2 rounded-lg border border-bone bg-white text-[13px] font-semibold text-charcoal cursor-pointer disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={disconnect} disabled={busy === 'disconnect'} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-[13px] font-semibold text-white cursor-pointer disabled:opacity-60" style={{ background: '#B91C1C' }}>
                {busy === 'disconnect' && <Loader2 size={14} className="animate-spin" />}
                Disconnect
              </button>
            </>
          }
        >
          <p className="text-[13px] text-charcoal leading-relaxed">
            Customers will no longer see the {label} button on your store, and customers who signed up with {label} won&apos;t be able to use it to sign in. You can connect it again at any time.
          </p>
        </Modal>
      )}
    </div>
  );
}
