import { useState } from 'react';
import { Package } from 'lucide-react';
import { Card } from '@/components/comman/ui/Card';
import { Select } from '@/components/comman/ui/Input';
import { Field } from '@/components/comman/ui/Field';
import { Button } from '@/components/comman/ui/Button';
import { Badge } from '@/components/comman/ui/Badge';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { AiSuggestionPanel } from '@/components/comman/seo';
import { EntityPickerModal } from '@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal';
import { useSeoAiSuggestionHistory, useGenerateSeoAiSuggestion, useAcceptSeoAiSuggestion } from '@/hooks/seller/seo/useSeoAi';
import { apiGetMyProductById } from '@/api/services/product';
import type { AiSeoEntityType } from '@/api/services/seo/seller/ai.service';

interface AiSeoTabProps {
  storeId: string;
}

export function AiSeoTab({ storeId }: AiSeoTabProps) {
  const [entityType, setEntityType] = useState<AiSeoEntityType>('product');
  const [product, setProduct] = useState<{ id: string; name: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const { data: history, loading: historyLoading, error, refetch } = useSeoAiSuggestionHistory(storeId, { page: 1, limit: 10 });
  const { generate, reset, generating, suggestion, error: genError, accept, accepting, acceptError, applied } = useGenerateSeoAiSuggestion();
  const rowAccept = useAcceptSeoAiSuggestion();

  const entityId = entityType === 'store' ? storeId : product?.id ?? '';

  const handlePick = async (ids: string[]) => {
    const id = ids[0];
    setPicking(false);
    if (!id) return;
    setProduct({ id, name: 'Selected product' });
    reset();
    try {
      const res = await apiGetMyProductById(id);
      const name = res.data.product?.name;
      if (name) setProduct({ id, name });
    } catch {
      // the id is still valid for generating; only the label stays generic
    }
  };

  const handleGenerate = async () => {
    if (!entityId) return;
    await generate(storeId, { entityType, entityId });
    refetch();
  };

  const handleAccept = async () => {
    if (!suggestion?.suggestionId) return;
    if (await accept(storeId, suggestion.suggestionId)) refetch();
  };

  const handleRowAccept = async (suggestionId: string) => {
    if (await rowAccept.accept(storeId, suggestionId)) refetch();
  };

  return (
    <div className="flex flex-col gap-5">
      {error && <AnalyticsErrorState message={error} onRetry={refetch} />}

      <Card>
        <p className="text-[13px] font-semibold text-carbon mb-3">Generate AI SEO Suggestion</p>
        <div className="flex gap-3 flex-wrap mb-3">
          <Field label="Entity Type" className="mb-0 w-[180px]">
            <Select value={entityType} onChange={e => { setEntityType(e.target.value as AiSeoEntityType); reset(); }}>
              <option value="product">Product</option>
              <option value="store">Store</option>
            </Select>
          </Field>
          {entityType === 'product' && (
            <Field label="Product" className="mb-0 flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 min-h-[40px]">
                {product ? (
                  <>
                    <span className="flex items-center gap-2 min-w-0 text-[13px] text-carbon">
                      <Package size={14} className="text-slate shrink-0" />
                      <span className="truncate">{product.name}</span>
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setPicking(true)}>Change</Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" icon={<Package size={12} />} onClick={() => setPicking(true)}>Choose product</Button>
                )}
              </div>
            </Field>
          )}
        </div>
        {entityType === 'store' && (
          <p className="text-[12px] text-slate mb-3">The suggestion is written for your store's home page title and description.</p>
        )}
        <p className="text-[11px] text-slate mb-3">Each generation costs AI credits from your store's wallet.</p>
        {genError && <p role="alert" className="text-[12px] text-error mb-3">{genError}</p>}
      </Card>

      <AiSuggestionPanel
        suggestion={suggestion}
        generating={generating}
        onGenerate={handleGenerate}
        onAccept={handleAccept}
        onDiscard={reset}
        accepting={accepting}
        acceptError={acceptError}
        applied={applied}
        appliedLabel={`Applied to your ${entityType === 'store' ? 'store' : 'product'}.`}
        canGenerate={!!entityId}
      />

      <Card>
        <p className="text-[13px] font-semibold text-carbon mb-3">Suggestion History</p>
        {rowAccept.error && (
          <p role="alert" className="text-[12px] text-error mb-2">{rowAccept.error}</p>
        )}
        {historyLoading ? (
          <p className="text-[12px] text-slate">Loading…</p>
        ) : (history?.items ?? []).length === 0 ? (
          <p className="text-[12px] text-slate py-4 text-center">No AI suggestions generated yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(history?.items ?? []).map(item => (
              <div key={item._id} className="flex items-center justify-between gap-3 py-2 border-b border-[#f0eee6] last:border-b-0">
                <div className="min-w-0">
                  <p className="text-[13px] text-carbon truncate">{item.suggestion.metaTitle || '—'}</p>
                  <p className="text-[11px] text-slate mt-[2px]">{item.entityType} · {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge color={item.accepted ? 'green' : 'gray'} size="sm">{item.accepted ? 'Applied' : 'Preview only'}</Badge>
                  {!item.accepted && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={rowAccept.acceptingId === item._id}
                      disabled={rowAccept.accepting}
                      onClick={() => handleRowAccept(item._id)}
                    >
                      Use this
                    </Button>
                  )}
                  <span className="text-[11px] text-slate">{item.creditsCost} credits</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <EntityPickerModal
        open={picking}
        onClose={() => setPicking(false)}
        mode="products"
        storeId={storeId}
        multiple={false}
        initialSelectedIds={product ? [product.id] : []}
        onConfirm={handlePick}
        title="Choose a product"
      />
    </div>
  );
}
