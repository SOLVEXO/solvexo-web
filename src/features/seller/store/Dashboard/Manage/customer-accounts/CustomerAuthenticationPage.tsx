import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { PageHeader } from '@/components/comman/ui/PageHeader';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { apiGetCustomerSocialSetup, SOCIAL_PROVIDER_LABEL, type CustomerSocialSetup } from '@/api/services/customerSocialLogin';

/** Shopify Settings -> Customer accounts -> Authentication -> Manage: the list of social sign-in methods, each
 *  with Connect (not set up) or Manage (connected). Only connected ones show up on the store's login page. */
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

  return (
    <div className="max-w-[720px]">
      <Link to={`/store/${storeId}/settings`} className="inline-flex items-center gap-1.5 text-[12px] text-slate no-underline hover:text-charcoal mb-3">
        <ArrowLeft size={13} /> Settings
      </Link>
      <PageHeader
        title="Authentication"
        description="Let customers sign in to your store with a social account. Only the methods you connect appear on your store's sign-in page."
      />

      <div className="bg-white rounded-xl border border-bone mt-5 overflow-hidden">
        {loading && (
          <div className="p-4 flex flex-col gap-3" aria-busy="true" aria-label="Loading sign-in methods">
            <SkeletonBox height={44} rounded="8px" />
            <SkeletonBox height={44} rounded="8px" />
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="p-4 flex items-center gap-3 text-[13px] text-error">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bone bg-white text-[12px] font-semibold text-charcoal cursor-pointer">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && setup && (
          <ul className="m-0 p-0 list-none">
            {setup.providers.map((p, i) => {
              const connected = p.status === 'connected';
              return (
                <li key={p.provider} className={i > 0 ? 'border-t border-bone' : ''}>
                  <Link to={`${base}/${p.provider}`} className="flex items-center gap-3 px-4 py-3.5 no-underline hover:bg-cream transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-charcoal">{SOCIAL_PROVIDER_LABEL[p.provider]}</p>
                      <p className="text-[11.5px] text-slate">
                        {connected ? `Customers can sign in with ${SOCIAL_PROVIDER_LABEL[p.provider]} on your store.` : 'Not connected'}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: connected ? '#DCFCE7' : '#F1EFE7', color: connected ? '#166534' : '#6B6960' }}
                    >
                      {connected ? 'Connected' : 'Not connected'}
                    </span>
                    <span className="flex items-center gap-1 text-[12.5px] font-semibold text-brand-orange">
                      {connected ? 'Manage' : 'Connect'} <ChevronRight size={14} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
