import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, ChevronRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { PageHeader } from '@/components/comman/ui/PageHeader';
import { apiGetCustomerSocialSetup, SOCIAL_PROVIDER_LABEL, type CustomerSocialSetup } from '@/api/services/customerSocialLogin';
import { PreviewButton, ProviderLogo, StatusBadge } from './socialProviderUi';
import { formatWhen, providerState } from './socialProviderUtils';

/** Shopify Settings -> Customer accounts -> Authentication: the social sign-in methods, each with Connect (not set up)
 *  or Manage (connected), next to a preview of the sign-in page. Only connected methods show on the store's login page. */
export function CustomerAuthenticationPage() {
  const { storeId } = useStoreWorkspace();
  const [setup, setSetup] = useState<CustomerSocialSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiGetCustomerSocialSetup(storeId);
      setSetup(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sign-in methods.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const base = `/store/${storeId}/settings/customer-accounts/authentication`;
  const connectedProviders = setup?.providers.filter(p => p.status === 'connected') ?? [];

  return (
    <div className="w-full px-4 lg:px-7 pt-5 pb-10">
      <Link to={`/store/${storeId}/settings`} className="inline-flex items-center gap-1.5 text-[12px] text-slate no-underline hover:text-charcoal mb-3">
        <ArrowLeft size={13} /> Settings
      </Link>
      <PageHeader
        title="Authentication"
        description="Let customers sign in to your store with a social account. Only the methods you connect appear on your store's sign-in page."
        actions={setup ? (
          <span className="text-[12px] text-slate">
            <b className="text-charcoal">{connectedProviders.length}</b> of {setup.providers.length} connected
          </span>
        ) : undefined}
      />

      {!loading && error && (
        <div role="alert" className="mt-5 flex items-center gap-3 rounded-xl border border-bone bg-white p-4 text-[13px] text-error">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bone bg-white text-[12px] font-semibold text-charcoal cursor-pointer">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {!loading && !error && setup && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {setup.providers.map(p => {
              const label = SOCIAL_PROVIDER_LABEL[p.provider];
              const state = providerState(p.status, p.lastError);
              const verified = formatWhen(p.lastVerifiedAt);
              return (
                <li key={p.provider}>
                  <Link
                    to={`${base}/${p.provider}`}
                    className="group flex items-center gap-4 rounded-xl border border-bone bg-white p-4 sm:p-5 no-underline transition-colors hover:border-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
                  >
                    <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-bone bg-cream flex items-center justify-center shrink-0">
                      <ProviderLogo provider={p.provider} size={24} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-[14.5px] font-semibold text-charcoal">{label}</p>
                        <StatusBadge state={state} />
                      </div>
                      <p className="text-[12px] text-slate mt-1 leading-relaxed">
                        {state === 'attention'
                          ? 'The last connection test failed. Open this method to fix it, or customers may not be able to sign in.'
                          : state === 'connected'
                            ? `Customers can sign in with ${label} on your store.${verified ? ` Verified ${verified}.` : ''}`
                            : `Add your own ${label} app so customers can sign in with one tap.`}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-brand-orange shrink-0">
                      <span className="hidden sm:inline">{state === 'not_connected' ? 'Connect' : 'Manage'}</span>
                      <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <aside className="rounded-xl border border-bone bg-white p-5 lg:sticky lg:top-4" aria-label="Sign-in page preview">
            <p className="text-[13.5px] font-semibold text-charcoal">What customers will see</p>
            <p className="text-[12px] text-slate mt-1 leading-relaxed">A preview of the buttons on your store&apos;s sign-in page.</p>
            <div className="mt-4 rounded-lg border border-bone bg-cream p-4 flex flex-col gap-2.5">
              {connectedProviders.length > 0 ? (
                <>
                  {connectedProviders.map(p => <PreviewButton key={p.provider} provider={p.provider} label={SOCIAL_PROVIDER_LABEL[p.provider]} />)}
                  <div className="flex items-center gap-3 my-1" aria-hidden="true">
                    <span className="flex-1 h-px bg-bone" /><span className="text-[11px] text-slate">or</span><span className="flex-1 h-px bg-bone" />
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-slate text-center py-1">No social buttons yet. Connect a method to show it here.</p>
              )}
              <div className="rounded-lg border border-bone bg-white px-3 py-2.5 text-[12px] text-slate">Email address</div>
              <div className="rounded-lg border border-bone bg-white px-3 py-2.5 text-[12px] text-slate">Password</div>
            </div>
            <ul className="m-0 mt-4 p-0 list-none flex flex-col gap-2 text-[12px] text-slate">
              <li className="flex items-start gap-2"><CheckCircle size={14} className="shrink-0 mt-px text-[#16A34A]" /> Customers can always use email and password too.</li>
              <li className="flex items-start gap-2"><ShieldCheck size={14} className="shrink-0 mt-px text-[#16A34A]" /> Your app secret is stored encrypted and never shown again.</li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
