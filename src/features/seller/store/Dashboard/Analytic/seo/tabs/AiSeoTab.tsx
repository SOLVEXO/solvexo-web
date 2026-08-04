import { useState } from 'react';
import { Card } from '@/components/comman/ui/Card';
import { Select, Input } from '@/components/comman/ui/Input';
import { Field } from '@/components/comman/ui/Field';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { AiSuggestionPanel } from '@/components/comman/seo';
import { useSeoAiSuggestionHistory, useGenerateSeoAiSuggestion } from '@/hooks/seller/seo/useSeoAi';
import type { AiSeoEntityType } from '@/api/services/seo/seller/ai.service';

interface AiSeoTabProps {
  storeId: string;
}

export function AiSeoTab({ storeId }: AiSeoTabProps) {
  const [entityType, setEntityType] = useState<AiSeoEntityType>('product');
  const [entityId, setEntityId] = useState('');
  const { data: history, loading: historyLoading, error, refetch } = useSeoAiSuggestionHistory(storeId, { page: 1, limit: 10 });
  const { generate, reset, generating, suggestion, error: genError } = useGenerateSeoAiSuggestion();

  const handleGenerate = async () => {
    if (!entityId) return;
    await generate(storeId, { entityType, entityId });
    refetch();
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
          <Field label="Entity ID" className="mb-0 flex-1 min-w-[220px]">
            <Input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="Product ID (or this store's ID)" />
          </Field>
        </div>
        <p className="text-[11px] text-slate mb-3">Each generation costs AI credits from your store's wallet.</p>
        {genError && <p className="text-[12px] text-error mb-3">{genError}</p>}
      </Card>

      <AiSuggestionPanel
        suggestion={suggestion}
        generating={generating}
        onGenerate={handleGenerate}
        onAccept={reset}
        onDiscard={reset}
      />

      <Card>
        <p className="text-[13px] font-semibold text-carbon mb-3">Suggestion History</p>
        {historyLoading ? (
          <p className="text-[12px] text-slate">Loading…</p>
        ) : (history?.items ?? []).length === 0 ? (
          <p className="text-[12px] text-slate py-4 text-center">No AI suggestions generated yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(history?.items ?? []).map(item => (
              <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#f0eee6] last:border-b-0">
                <div className="min-w-0">
                  <p className="text-[13px] text-carbon truncate">{item.suggestion.metaTitle || '—'}</p>
                  <p className="text-[11px] text-slate mt-[2px]">{item.entityType} · {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-[11px] text-slate shrink-0">{item.creditsCost} credits</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
