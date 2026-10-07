import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import client from '@/api/client';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { Button } from '@/components/comman/ui/Button';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';

interface PlatformCoupon {
  _id: string; code: string; discountType: string; discountValue?: number; value?: number;
  usageLimit?: number | null; expiryDate?: string | null; expiresAt?: string | null; isActive?: boolean;
}

/** Platform-wide coupons (`api/admin/marketing/coupons`) — list + shared CSV import. */
export default function AdminPlatformCoupons() {
  const [rows, setRows] = useState<PlatformCoupon[] | null>(null);
  const [error, setError] = useState('');

  const [tick, setTick] = useState(0);
  const load = () => { setError(''); setRows(null); setTick(t => t + 1); };
  useEffect(() => {
    let cancelled = false;
    client.get<never, { data: PlatformCoupon[] }>('/api/admin/marketing/coupons')
      .then(res => { if (!cancelled) setRows(res.data ?? []); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load coupons.'); });
    return () => { cancelled = true; };
  }, [tick]);

  const columns: TableColumn<PlatformCoupon>[] = [
    { key: 'code', header: 'Code', render: r => <span className="font-semibold text-charcoal">{r.code}</span> },
    { key: 'discountType', header: 'Type' },
    { key: 'value', header: 'Value', render: r => String(r.discountValue ?? r.value ?? '') },
    { key: 'usageLimit', header: 'Usage limit', render: r => String(r.usageLimit ?? 'Unlimited') },
    { key: 'expiry', header: 'Expires', render: r => { const d = r.expiryDate ?? r.expiresAt; return d ? new Date(d).toLocaleDateString() : 'Never'; } },
  ];

  return (
    <>
      <AdminPageHeader
        title="Platform Coupons"
        subtitle="Coupons valid across the platform."
        actions={<BulkImportButton entityLabel="platform coupons" basePath="/api/admin/marketing/coupons" onImported={load} />}
      />
      <div className="px-4 sm:px-7 py-5">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] text-slate">{error}</p>
            <Button onClick={load}>Retry</Button>
          </div>
        ) : rows && rows.length === 0 ? (
          <EmptyState icon={<Tag size={28} />} title="No platform coupons" description="Import a CSV to create platform coupons." />
        ) : (
          <Table<PlatformCoupon> columns={columns} data={rows ?? []} keyExtractor={r => r._id} loading={rows === null} />
        )}
      </div>
    </>
  );
}
