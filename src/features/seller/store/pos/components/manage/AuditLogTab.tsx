import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { apiGetAuditLogs, type PosAuditLog } from '@/api/commerce/posAuditLogs';
import { DarkEmptyState, DarkSkeleton, DarkTable } from './darkUi';

interface AuditLogTabProps { storeId: string }

export function AuditLogTab({ storeId }: AuditLogTabProps) {
  const [logs, setLogs]       = useState<PosAuditLog[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const totalPages = Math.max(1, Math.ceil(total / 20));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGetAuditLogs(storeId, { page, limit: 20 })
      .then(res => { if (!cancelled) { setLogs(res.data.logs); setTotal(res.data.pagination.total); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load audit logs.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, page]);

  return (
    <div>
      <p className="text-[15px] font-semibold text-white mb-4">Audit Log</p>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <DarkSkeleton key={i} height={40} />)}</div>
      ) : error ? (
        <p className="text-[13px] text-error">{error}</p>
      ) : logs.length === 0 ? (
        <DarkEmptyState icon={<ScrollText size={24} className="text-brand-orange" />} title="No activity yet" description="Actions taken in the POS terminal will show up here." />
      ) : (
        <>
          <DarkTable headers={['Action', 'Target', 'Employee', 'When']}>
            {logs.map(l => (
              <tr key={l._id} className="border-b border-carbon last:border-0">
                <td className="px-4 py-[10px] text-[12px] font-medium text-white capitalize">{l.action.replace(/_/g, ' ')}</td>
                <td className="px-4 py-[10px] text-[12px] text-pos-faint">{l.targetType ?? '—'}</td>
                <td className="px-4 py-[10px] text-[12px] text-pos-faint">{l.employeeId ?? 'Store owner'}</td>
                <td className="px-4 py-[10px] text-[12px] text-pos-faint">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </DarkTable>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 px-4 py-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg bg-carbon border-0 text-white text-[11px] cursor-pointer disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-[11px] text-pos-muted">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-lg bg-carbon border-0 text-white text-[11px] cursor-pointer disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
