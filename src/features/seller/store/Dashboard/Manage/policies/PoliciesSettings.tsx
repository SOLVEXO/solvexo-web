import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Badge, Button, Card, SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import { apiCreatePolicyFromTemplate, apiListStorePages, type StorePageData, type StorePagePolicyType } from '@/api/services/storePages';

const POLICIES: { type: StorePagePolicyType; title: string; description: string }[] = [
  { type: 'privacy_policy', title: 'Privacy policy', description: 'How you collect, use and protect customer information. Linked at checkout.' },
  { type: 'terms_of_service', title: 'Terms of service', description: 'The rules for using your store and buying from it. Linked at checkout.' },
  { type: 'refund_policy', title: 'Refund policy', description: 'When customers can return an item and how refunds work.' },
  { type: 'shipping_policy', title: 'Shipping policy', description: 'Processing time, delivery, tracking and international orders.' },
];

/**
 * Settings → Policies: the four standard store policies in one place. "Create from template" makes the page from a
 * ready-made text (published, linked in the footer); "Edit" opens it in the normal page editor.
 */
export function PoliciesSettings({ canManage }: { canManage: boolean }) {
  const { storeId, store } = useStoreWorkspace();
  const navigate = useNavigate();
  const toast = useToast();
  const [pages, setPages] = useState<StorePageData[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<StorePagePolicyType | null>(null);

  const load = useCallback(() => {
    setError('');
    apiListStorePages(storeId)
      .then(res => setPages(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your policies.'));
  }, [storeId]);
  useEffect(() => { setPages(null); load(); }, [load]);

  const create = async (type: StorePagePolicyType) => {
    setBusy(type);
    try {
      const res = await apiCreatePolicyFromTemplate(storeId, type);
      toast.success(res.created ? 'Policy created and published. Review the text before you rely on it.' : 'This policy already exists.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the policy.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-[16px] font-bold text-charcoal">Policies</h2>
        <p className="mt-1 mb-0 text-[12.5px] text-slate">
          Customers see these in your footer and at checkout. The templates are a starting point: read them and adjust them to your business and your local law.
        </p>
      </div>

      {error ? (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-bone bg-white p-4 text-[13px] text-charcoal">
          <AlertCircle size={16} className="shrink-0 text-error" />
          <span className="flex-1">{error}</span>
          <Button variant="secondary" size="sm" onClick={load}>Retry</Button>
        </div>
      ) : pages === null ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] gap-3">
          {POLICIES.map(p => <SkeletonBox key={p.type} className="h-[132px] w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] gap-3">
          {POLICIES.map(policy => {
            const page = pages.find(pg => pg.policyType === policy.type);
            const live = page?.status === 'published';
            const url = page && live && store?.slug ? getStorefrontUrl(store.slug, `/${page.slug}`) : null;
            return (
              <Card key={policy.type}>
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-pale-orange text-brand-orange"><FileText size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 text-[14px] font-semibold text-charcoal">{policy.title}</h3>
                      <Badge color={!page ? 'gray' : live ? 'green' : 'yellow'} size="sm">{!page ? 'Not set up' : live ? 'Published' : 'Draft'}</Badge>
                    </div>
                    <p className="mt-1 mb-3 text-[12px] leading-relaxed text-slate">{policy.description}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {page ? (
                        <>
                          <Button size="sm" onClick={() => navigate(`/store/${storeId}/online-store/pages?page=${page._id}`)}>Edit</Button>
                          {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate no-underline hover:text-brand-orange">
                              View <ExternalLink size={12} />
                            </a>
                          )}
                        </>
                      ) : (
                        <Button size="sm" disabled={!canManage || busy !== null} onClick={() => create(policy.type)}>
                          {busy === policy.type && <Loader2 size={13} className="animate-spin" />} Create from template
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
