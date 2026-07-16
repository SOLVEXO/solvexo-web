import { useEffect, useState } from 'react';
import { Plus, Monitor } from 'lucide-react';
import { Badge } from '@/components/comman/ui/Badge';
import { apiAddRegister, apiListRegisters, apiUpdateRegister, apiRemoveRegister, type PosRegister } from '@/api/services/pos/posRegisters';
import { DarkModal, DarkField, DarkInput, DarkSelect, DarkButton, DarkEmptyState, DarkSkeleton, DarkTable } from './darkUi';

interface RegistersTabProps { storeId: string }

export function RegistersTab({ storeId }: RegistersTabProps) {
  const [registers, setRegisters] = useState<PosRegister[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing]     = useState<PosRegister | 'new' | null>(null);
  const [removing, setRemoving]   = useState<PosRegister | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiListRegisters(storeId)
      .then(res => { if (!cancelled) setRegisters(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load registers.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, refreshKey]);

  function reload() { setRefreshKey(k => k + 1); }

  async function confirmRemove() {
    if (!removing) return;
    setRemoveBusy(true);
    setRemoveError('');
    try {
      await apiRemoveRegister(storeId, removing._id);
      setRemoving(null);
      reload();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove register.');
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-semibold text-white">Registers</p>
        <DarkButton icon={<Plus size={13} />} onClick={() => setEditing('new')}>Add Register</DarkButton>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <DarkSkeleton key={i} />)}</div>
      ) : error ? (
        <p className="text-[13px] text-error">{error}</p>
      ) : registers.length === 0 ? (
        <DarkEmptyState
          icon={<Monitor size={24} className="text-brand-orange" />}
          title="No registers yet"
          description="Add at least one register so employees can open a shift and start selling."
          action={{ label: 'Add Register', onClick: () => setEditing('new') }}
        />
      ) : (
        <DarkTable headers={['Register', 'Default Float', 'Status', '']}>
          {registers.map(r => (
            <tr key={r._id} className="border-b border-carbon last:border-0">
              <td className="px-4 py-[10px] text-[12px] font-medium text-white">{r.name}</td>
              <td className="px-4 py-[10px] text-[12px] text-pos-faint">${r.defaultFloatCash.toFixed(2)}</td>
              <td className="px-4 py-[10px]"><Badge color={r.status === 'active' ? 'green' : 'gray'}>{r.status}</Badge></td>
              <td className="px-4 py-[10px]">
                <div className="flex justify-end gap-[6px]">
                  <button onClick={() => setEditing(r)} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint">
                    Edit
                  </button>
                  <button onClick={() => { setRemoving(r); setRemoveError(''); }} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-error">
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DarkTable>
      )}

      {editing && (
        <RegisterFormModal
          storeId={storeId}
          register={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}

      {removing && (
        <DarkModal title="Remove Register" width={400} onClose={() => setRemoving(null)} footer={
          <>
            <DarkButton variant="outline" onClick={() => setRemoving(null)} disabled={removeBusy}>Cancel</DarkButton>
            <DarkButton variant="danger" onClick={confirmRemove} loading={removeBusy}>Remove</DarkButton>
          </>
        }>
          <p className="text-[13px] text-pos-muted">
            Remove register <strong className="text-white">"{removing.name}"</strong>? It must have no open session.
          </p>
          {removeError && <p className="text-[12px] text-error mt-2">{removeError}</p>}
        </DarkModal>
      )}
    </div>
  );
}

function RegisterFormModal({
  storeId, register, onClose, onSaved,
}: {
  storeId: string;
  register: PosRegister | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!register;
  const [name, setName] = useState(register?.name ?? '');
  const [floatCash, setFloatCash] = useState(register ? String(register.defaultFloatCash) : '100');
  const [status, setStatus] = useState<'active' | 'inactive'>(register?.status ?? 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    if (!name.trim()) { setError('Register name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await apiUpdateRegister(storeId, register._id, { name, defaultFloatCash: parseFloat(floatCash) || 0, status });
      } else {
        await apiAddRegister(storeId, { name, defaultFloatCash: parseFloat(floatCash) || 0 });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save register.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DarkModal title={isEdit ? 'Edit Register' : 'Add Register'} onClose={onClose} footer={
      <>
        <DarkButton variant="outline" onClick={onClose}>Cancel</DarkButton>
        <DarkButton onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Add Register'}</DarkButton>
      </>
    }>
      <DarkField label="Register Name" required>
        <DarkInput value={name} onChange={e => setName(e.target.value)} placeholder="Register 1" />
      </DarkField>
      <DarkField label="Default Opening Float">
        <DarkInput leftAddon="$" inputMode="decimal" value={floatCash} onChange={e => setFloatCash(e.target.value)} placeholder="100.00" />
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
