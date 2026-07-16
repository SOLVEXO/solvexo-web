import { useEffect, useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import { Badge } from '@/components/comman/ui/Badge';
import { apiAddShift, apiListShifts, apiUpdateShift, apiDeleteShift, type PosShift } from '@/api/services/pos/posShifts';
import { DarkModal, DarkField, DarkInput, DarkSelect, DarkButton, DarkEmptyState, DarkSkeleton, DarkTable } from './darkUi';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ShiftsTabProps { storeId: string }

export function ShiftsTab({ storeId }: ShiftsTabProps) {
  const [shifts, setShifts]   = useState<PosShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<PosShift | 'new' | null>(null);
  const [deleting, setDeleting] = useState<PosShift | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteNeedsForce, setDeleteNeedsForce] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiListShifts(storeId)
      .then(res => { if (!cancelled) setShifts(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shifts.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, refreshKey]);

  function reload() { setRefreshKey(k => k + 1); }

  async function submitDelete(force = false) {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await apiDeleteShift(storeId, deleting._id, force);
      setDeleting(null);
      setDeleteNeedsForce(false);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete shift.';
      setDeleteError(msg);
      setDeleteNeedsForce(msg.toLowerCase().includes('force=true'));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-semibold text-white">Shifts</p>
        <DarkButton icon={<Plus size={13} />} onClick={() => setEditing('new')}>Add Shift</DarkButton>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <DarkSkeleton key={i} />)}</div>
      ) : error ? (
        <p className="text-[13px] text-error">{error}</p>
      ) : shifts.length === 0 ? (
        <DarkEmptyState
          icon={<Clock size={24} className="text-brand-orange" />}
          title="No shifts yet"
          description="Define shifts to organize when employees are scheduled to work."
          action={{ label: 'Add Shift', onClick: () => setEditing('new') }}
        />
      ) : (
        <DarkTable headers={['Shift', 'Time', 'Days', 'Status', '']}>
          {shifts.map(s => (
            <tr key={s._id} className="border-b border-carbon last:border-0">
              <td className="px-4 py-[10px] text-[12px] font-medium text-white">{s.name}</td>
              <td className="px-4 py-[10px] text-[12px] text-pos-faint">{s.startTime} – {s.endTime}</td>
              <td className="px-4 py-[10px] text-[12px] text-pos-faint">{(s.daysOfWeek ?? []).map(d => DAY_LABELS[d]).join(', ')}</td>
              <td className="px-4 py-[10px]"><Badge color={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Badge></td>
              <td className="px-4 py-[10px]">
                <div className="flex justify-end gap-[6px]">
                  <button onClick={() => setEditing(s)} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint">
                    Edit
                  </button>
                  <button onClick={() => { setDeleting(s); setDeleteError(''); setDeleteNeedsForce(false); }} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-error">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DarkTable>
      )}

      {editing && (
        <ShiftFormModal
          storeId={storeId}
          shift={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}

      {deleting && (
        <DarkModal title="Delete Shift" width={420} onClose={() => setDeleting(null)} footer={
          <>
            <DarkButton variant="outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</DarkButton>
            <DarkButton variant="danger" onClick={() => submitDelete(deleteNeedsForce)} loading={deleteBusy}>
              {deleteNeedsForce ? 'Remove & Delete Anyway' : 'Delete Shift'}
            </DarkButton>
          </>
        }>
          <p className="text-[13px] text-pos-muted">
            Delete shift <strong className="text-white">"{deleting.name}"</strong>?
          </p>
          {deleteError && <p className="text-[12px] text-error mt-2">{deleteError}</p>}
        </DarkModal>
      )}
    </div>
  );
}

function ShiftFormModal({
  storeId, shift, onClose, onSaved,
}: {
  storeId: string;
  shift: PosShift | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!shift;
  const [name, setName]           = useState(shift?.name ?? '');
  const [startTime, setStartTime] = useState(shift?.startTime ?? '09:00');
  const [endTime, setEndTime]     = useState(shift?.endTime ?? '17:00');
  const [days, setDays]           = useState<number[]>(shift?.daysOfWeek ?? [1, 2, 3, 4, 5]);
  const [status, setStatus]       = useState<'active' | 'inactive'>(shift?.status ?? 'active');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  }

  async function submit() {
    if (!name.trim() || !startTime || !endTime) { setError('Name, start time and end time are required.'); return; }
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await apiUpdateShift(storeId, shift._id, { name, startTime, endTime, daysOfWeek: days, status });
      } else {
        await apiAddShift(storeId, { name, startTime, endTime, daysOfWeek: days });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shift.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DarkModal title={isEdit ? 'Edit Shift' : 'Add Shift'} onClose={onClose} footer={
      <>
        <DarkButton variant="outline" onClick={onClose}>Cancel</DarkButton>
        <DarkButton onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Add Shift'}</DarkButton>
      </>
    }>
      <DarkField label="Shift Name" required>
        <DarkInput value={name} onChange={e => setName(e.target.value)} placeholder="Morning Shift" />
      </DarkField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DarkField label="Start Time" required>
          <DarkInput type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </DarkField>
        <DarkField label="End Time" required>
          <DarkInput type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </DarkField>
      </div>
      <DarkField label="Days of Week">
        <div className="flex gap-1 flex-wrap">
          {DAY_LABELS.map((label, d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`px-3 py-[6px] rounded-md text-[12px] font-medium cursor-pointer border ${
                days.includes(d) ? 'bg-brand-orange border-brand-orange text-white' : 'bg-carbon border-transparent text-pos-faint'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </DarkField>
      {isEdit && (
        <DarkField label="Status">
          <DarkSelect value={status} onChange={e => setStatus(e.target.value as 'active' | 'inactive')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </DarkSelect>
        </DarkField>
      )}
      {error && <p className="text-[12px] text-error">{error}</p>}
    </DarkModal>
  );
}
