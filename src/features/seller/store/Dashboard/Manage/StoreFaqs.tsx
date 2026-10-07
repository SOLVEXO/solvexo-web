import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import client from '@/api/client';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { Button } from '@/components/comman/ui/Button';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';

interface StoreFaq { _id: string; question: string; answer: string; order: number; isActive: boolean }

/** Store FAQs (`api/store-faq/:storeId`) — list + shared CSV import. */
export default function StoreFaqs() {
  const { storeId } = useStoreWorkspace();
  const [rows, setRows] = useState<StoreFaq[] | null>(null);
  const [error, setError] = useState('');

  const [tick, setTick] = useState(0);
  const load = () => { setError(''); setRows(null); setTick(t => t + 1); };
  useEffect(() => {
    let cancelled = false;
    client.get<never, { data: StoreFaq[] }>(`/api/store-faq/${storeId}`)
      .then(res => { if (!cancelled) setRows(res.data ?? []); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load FAQs.'); });
    return () => { cancelled = true; };
  }, [storeId, tick]);

  const columns: TableColumn<StoreFaq>[] = [
    { key: 'question', header: 'Question', render: r => <span className="font-medium text-charcoal">{r.question}</span> },
    { key: 'answer', header: 'Answer', render: r => <span className="text-slate line-clamp-2">{r.answer}</span> },
    { key: 'order', header: 'Order', width: '80px' },
    { key: 'isActive', header: 'Status', width: '100px', render: r => (r.isActive ? 'Active' : 'Inactive') },
  ];

  return (
    <>
      <StorePageHeader
        title="FAQs"
        subtitle="Questions shown on your storefront."
        actions={
          <BulkImportButton
            entityLabel="FAQs"
            basePath={`/api/store-faq/${storeId}`}
            onImported={load}
            notes={['A question that already exists (case-insensitive) is skipped, not duplicated.']}
          />
        }
      />
      <div className="px-4 md:px-7 py-5">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] text-slate">{error}</p>
            <Button onClick={load}>Retry</Button>
          </div>
        ) : rows && rows.length === 0 ? (
          <EmptyState icon={<HelpCircle size={28} />} title="No FAQs yet" description="Import a CSV to add your first FAQs." />
        ) : (
          <Table<StoreFaq> columns={columns} data={rows ?? []} keyExtractor={r => r._id} loading={rows === null} />
        )}
      </div>
    </>
  );
}
