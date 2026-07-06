import { useEffect, useState } from 'react';
import { History, Lock } from 'lucide-react';
import { Badge } from '@/components/comman/ui/Badge';
import { apiGetSessionHistory, apiForceCloseSession, type RegisterSession } from '@/api/services/pos/posSessions';
import { apiListRegisters, type PosRegister } from '@/api/services/pos/posRegisters';
import { apiGetEmployees, type PosEmployee } from '@/api/services/pos/posEmployees';
import { DarkModal, DarkField, DarkInput, DarkSelect, DarkButton, DarkEmptyState, DarkSkeleton, DarkTable } from './darkUi';

interface SessionsTabProps { storeId: string }

export function SessionsTab({ storeId }: SessionsTabProps) {
  const [sessions, setSessions] = useState<RegisterSession[]>([]);
  const [registers, setRegisters] = useState<PosRegister[]>([]);
  const [employees, setEmployees] = useState<PosEmployee[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [closing, setClosing] = useState<RegisterSession | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / 10));

  useEffect(() => {
    Promise.all([apiListRegisters(storeId), apiGetEmployees(storeId)])
      .then(([r, e]) => { setRegisters(r.data); setEmployees(e.data); })
      .catch(() => {});
  }, [storeId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetSessionHistory(storeId, { page, status: status ? (status as 'open' | 'closed') : undefined })
      .then(res => { if (!cancelled) { setSessions(res.data.sessions); setTotal(res.data.pagination.total); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load sessions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, page, status, refreshKey]);

  const registerName = (id: string) => registers.find(r => r._id === id)?.name ?? id;
  const employeeName = (id: string) => employees.find(e => e._id === id)?.name ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-semibold text-white">Session History</p>
        <DarkSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="max-w-[160px]">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </DarkSelect>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <DarkSkeleton key={i} />)}</div>
      ) : error ? (
        <p className="text-[13px] text-error">{error}</p>
      ) : sessions.length === 0 ? (
        <DarkEmptyState icon={<History size={24} className="text-brand-orange" />} title="No sessions yet" description="Register sessions will show up here once employees start opening shifts." />
      ) : (
        <>
          <DarkTable headers={['Register', 'Employee', 'Opened', 'Closed', 'Total Sales', 'Status', '']}>
            {sessions.map(s => (
              <tr key={s._id} className="border-b border-carbon last:border-0">
                <td className="px-4 py-[10px] text-[12px] text-white">{registerName(s.registerId)}</td>
                <td className="px-4 py-[10px] text-[12px] text-pos-faint">{employeeName(s.employeeId)}</td>
                <td className="px-4 py-[10px] text-[12px] text-pos-faint">{new Date(s.openedAt).toLocaleString()}</td>
                <td className="px-4 py-[10px] text-[12px] text-pos-faint">{s.closedAt ? new Date(s.closedAt).toLocaleString() : '—'}</td>
                <td className="px-4 py-[10px] text-[12px] text-white text-right">${s.totalSales.toFixed(2)}</td>
                <td className="px-4 py-[10px]"><Badge color={s.status === 'open' ? 'green' : 'gray'}>{s.status}</Badge></td>
                <td className="px-4 py-[10px] text-right">
                  {s.status === 'open' && (
                    <DarkButton variant="danger" icon={<Lock size={11} />} onClick={() => setClosing(s)} className="px-3! py-1! text-[11px]">
                      Force Close
                    </DarkButton>
                  )}
                </td>
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

      {closing && (
        <ForceCloseModal
          session={closing}
          registerLabel={registerName(closing.registerId)}
          onClose={() => setClosing(null)}
          onDone={() => { setClosing(null); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}

function ForceCloseModal({
  session, registerLabel, onClose, onDone,
}: {
  session: RegisterSession;
  registerLabel: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    setSaving(true);
    setError('');
    try {
      await apiForceCloseSession(session._id, reason || undefined);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force-close session.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DarkModal title={`Force Close — ${registerLabel}`} onClose={onClose} footer={
      <>
        <DarkButton variant="outline" onClick={onClose}>Cancel</DarkButton>
        <DarkButton variant="danger" onClick={submit} loading={saving}>Force Close Session</DarkButton>
      </>
    }>
      <p className="text-[13px] text-pos-faint mb-3">
        Use this when an employee left a register open without closing their shift (e.g. device crash or forgot to log out).
        This closes the session without a cash count — closing cash is left unrecorded.
      </p>
      <DarkField label="Reason (optional)">
        <DarkInput value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Device was left open overnight" />
      </DarkField>
      {error && <p className="text-[12px] text-error">{error}</p>}
    </DarkModal>
  );
}
