import { useState } from 'react';
import { Card } from '@/components/comman/ui/Card';
import { Select, Input } from '@/components/comman/ui/Input';
import { Field } from '@/components/comman/ui/Field';
import { Badge } from '@/components/comman/ui/Badge';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { useAdminAiTransactions } from '@/hooks/admin/useAdminAiStudio';
import type { AdminTransactionRow } from '@/api/services/adminAiStudio';
import type { AiToolType } from '@/api/services/aiStudio';
import { Receipt } from 'lucide-react';

const STATUS_COLOR = { held: 'yellow', captured: 'green', refunded: 'gray' } as const;

export function TransactionsTab() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [toolUsed, setToolUsed] = useState<AiToolType | ''>('');
  const [status, setStatus] = useState<'held' | 'captured' | 'refunded' | ''>('');

  const { data, loading, error, refetch } = useAdminAiTransactions({
    page, limit: 20,
    storeId: storeId || undefined,
    toolUsed: toolUsed || undefined,
    status: status || undefined,
  });

  const columns: TableColumn<AdminTransactionRow>[] = [
    { key: 'storeId', header: 'Store ID' },
    { key: 'toolUsed', header: 'Tool' },
    { key: 'creditsCharged', header: 'Credits', align: 'right' },
    { key: 'status', header: 'Status', render: r => <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge> },
    { key: 'note', header: 'Note', render: r => <span className="text-slate truncate block max-w-[280px]">{r.note ?? '—'}</span> },
    { key: 'createdAt', header: 'Date', render: r => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex gap-3 flex-wrap">
          <Field label="Store ID" className="mb-0 flex-1 min-w-[200px]">
            <Input value={storeId} onChange={e => { setStoreId(e.target.value.trim()); setPage(1); }} placeholder="Filter by store ID" />
          </Field>
          <Field label="Tool" className="mb-0 w-[190px]">
            <Select value={toolUsed} onChange={e => { setToolUsed(e.target.value as AiToolType | ''); setPage(1); }}>
              <option value="">All tools</option>
              <option value="listing_writer">Listing Writer</option>
              <option value="price_optimizer">Price Optimizer</option>
              <option value="worksheet_builder">Worksheet Builder</option>
              <option value="seo_booster">SEO Booster</option>
              <option value="email_campaigns">Email Campaigns</option>
              <option value="image_enhancer">Image Enhancer</option>
            </Select>
          </Field>
          <Field label="Status" className="mb-0 w-[150px]">
            <Select value={status} onChange={e => { setStatus(e.target.value as typeof status); setPage(1); }}>
              <option value="">All</option>
              <option value="held">Held</option>
              <option value="captured">Captured</option>
              <option value="refunded">Refunded</option>
            </Select>
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
            loading={loading}
            emptyState={{
              icon: <Receipt size={28} className="text-slate/50" />,
              title: 'No transactions found',
              description: 'No AI credit transactions match these filters.',
            }}
            pagination={data ? {
              page: data.page, total: data.total, perPage: data.limit, onChange: setPage, label: 'transactions',
            } : undefined}
          />
        )}
      </Card>
    </div>
  );
}
