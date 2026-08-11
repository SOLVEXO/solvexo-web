import { useState } from 'react';
import { Card } from '@/components/comman/ui/Card';
import { Select, Input } from '@/components/comman/ui/Input';
import { Field } from '@/components/comman/ui/Field';
import { Badge } from '@/components/comman/ui/Badge';
import { Modal } from '@/components/comman/ui/Modal';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { useAdminAiGenerations, useAdminAiGeneration } from '@/hooks/admin/useAdminAiStudio';
import type { AdminGenerationRow, AiGenerationScope } from '@/api/services/adminAiStudio';
import type { AiToolType } from '@/api/services/aiStudio';
import { Sparkles } from 'lucide-react';

const TOOL_OPTIONS: { value: AiToolType | ''; label: string }[] = [
  { value: '', label: 'All tools' },
  { value: 'listing_writer', label: 'Listing Writer' },
  { value: 'price_optimizer', label: 'Price Optimizer' },
  { value: 'worksheet_builder', label: 'Worksheet Builder' },
  { value: 'seo_booster', label: 'SEO Booster' },
  { value: 'email_campaigns', label: 'Email Campaigns' },
  { value: 'image_enhancer', label: 'Image Enhancer' },
];

const STATUS_COLOR = { succeeded: 'green', failed: 'red', processing: 'blue' } as const;

export function GenerationsTab() {
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<AiGenerationScope | ''>('');
  const [toolType, setToolType] = useState<AiToolType | ''>('');
  const [status, setStatus] = useState<'processing' | 'succeeded' | 'failed' | ''>('');
  const [storeId, setStoreId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useAdminAiGenerations({
    page, limit: 20,
    scope: scope || undefined,
    toolType: toolType || undefined,
    status: status || undefined,
    storeId: storeId || undefined,
  });

  const columns: TableColumn<AdminGenerationRow>[] = [
    { key: 'toolType', header: 'Tool', render: r => TOOL_OPTIONS.find(t => t.value === r.toolType)?.label ?? r.toolType },
    { key: 'scope', header: 'Scope', render: r => <Badge color={r.scope === 'platform' ? 'orange' : 'gray'}>{r.scope}</Badge> },
    { key: 'store', header: 'Store', render: r => r.storeName ? <span>{r.storeName}</span> : <span className="text-slate">—</span> },
    { key: 'status', header: 'Status', render: r => <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge> },
    { key: 'creditsCharged', header: 'Credits', align: 'right' },
    { key: 'createdAt', header: 'Created', render: r => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex gap-3 flex-wrap">
          <Field label="Scope" className="mb-0 w-[150px]">
            <Select value={scope} onChange={e => { setScope(e.target.value as AiGenerationScope | ''); setPage(1); }}>
              <option value="">All</option>
              <option value="seller">Seller</option>
              <option value="platform">Platform</option>
            </Select>
          </Field>
          <Field label="Tool" className="mb-0 w-[190px]">
            <Select value={toolType} onChange={e => { setToolType(e.target.value as AiToolType | ''); setPage(1); }}>
              {TOOL_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Status" className="mb-0 w-[150px]">
            <Select value={status} onChange={e => { setStatus(e.target.value as typeof status); setPage(1); }}>
              <option value="">All</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
            </Select>
          </Field>
          <Field label="Store ID" className="mb-0 flex-1 min-w-[200px]">
            <Input value={storeId} onChange={e => { setStoreId(e.target.value.trim()); setPage(1); }} placeholder="Filter by store ID" />
          </Field>
        </div>
      </Card>

      <Card padding="none">
        {error ? (
          <div className="p-5"><AnalyticsErrorState message={error} onRetry={refetch} /></div>
        ) : (
          <Table
            columns={columns}
            data={data?.items ?? []}
            keyExtractor={r => r._id}
            onRowClick={r => setSelectedId(r._id)}
            loading={loading}
            emptyState={{
              icon: <Sparkles size={28} className="text-slate/50" />,
              title: 'No generations found',
              description: 'No AI Studio generations match these filters.',
            }}
            pagination={data ? {
              page: data.page, total: data.total, perPage: data.limit, onChange: setPage, label: 'generations',
            } : undefined}
          />
        )}
      </Card>

      {selectedId && <GenerationDetailModal generationId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function GenerationDetailModal({ generationId, onClose }: { generationId: string; onClose: () => void }) {
  const { data, loading } = useAdminAiGeneration(generationId);

  return (
    <Modal title="Generation Detail" onClose={onClose} width={640} mobileSheet>
      {loading || !data ? (
        <p className="text-[12px] text-slate">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div><span className="text-slate">Tool: </span><span className="text-carbon font-medium">{data.toolType}</span></div>
            <div><span className="text-slate">Scope: </span><span className="text-carbon font-medium">{data.scope}</span></div>
            <div><span className="text-slate">Status: </span><span className="text-carbon font-medium">{data.status}</span></div>
            <div><span className="text-slate">Credits: </span><span className="text-carbon font-medium">{data.creditsCharged}</span></div>
            {data.storeName && <div><span className="text-slate">Store: </span><span className="text-carbon font-medium">{data.storeName}</span></div>}
            <div><span className="text-slate">Provider: </span><span className="text-carbon font-medium">{data.providerUsed ?? '—'}</span></div>
          </div>
          {data.errorMessage && (
            <p className="text-[12px] text-error bg-error-bg rounded-md px-3 py-2">{data.errorMessage}</p>
          )}
          <div>
            <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-2">Input</p>
            <pre className="bg-cream border border-bone rounded-lg p-3 text-[11.5px] leading-[1.6] text-charcoal overflow-auto max-h-[160px] whitespace-pre-wrap break-words">
              {JSON.stringify(data.inputPayload, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-2">Output</p>
            <pre className="bg-cream border border-bone rounded-lg p-3 text-[11.5px] leading-[1.6] text-charcoal overflow-auto max-h-[220px] whitespace-pre-wrap break-words">
              {data.outputPayload ? JSON.stringify(data.outputPayload, null, 2) : '—'}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
}
