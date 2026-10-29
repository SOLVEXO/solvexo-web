import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/api/services/auth';
import {
  apiListSuppliers, apiCreateSupplier, apiUpdateSupplier, type Supplier,
} from '@/api/services/purchaseOrders';

type Form = { name: string; email: string; phone: string; address: string; notes: string };
const EMPTY: Form = { name: '', email: '', phone: '', address: '', notes: '' };

/** The people you buy stock from. Purchase orders and supplier returns pick from this list; archiving hides a supplier from
 *  those pickers without deleting its history. */
export default function SuppliersTab() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canManage = hasNavPermission(user as never, ['purchase_orders.manage']);
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiListSuppliers(storeId)
      .then(res => { setRows(res.data); setError(''); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load suppliers.'))
      .finally(() => setLoading(false));
  }, [storeId]);
  useEffect(() => { load(); }, [load]);

  const open = (s: Supplier | 'new') => {
    setFormError('');
    setForm(s === 'new' ? EMPTY : { name: s.name, email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '', notes: s.notes ?? '' });
    setEditing(s);
  };
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setFormError('');
    const payload = {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      address: form.address.trim(), notes: form.notes.trim(),
    };
    try {
      if (editing === 'new') {
        // empty optional fields are left out so the server does not validate a blank email
        const clean = Object.fromEntries(Object.entries(payload).filter(([k, v]) => k === 'name' || v !== '')) as { name: string };
        await apiCreateSupplier(storeId, clean);
      } else if (editing) {
        await apiUpdateSupplier(storeId, editing._id, payload);
      }
      toast.success('Supplier saved');
      setEditing(null); setLoading(true); load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save the supplier.');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (s: Supplier) => {
    setBusyId(s._id);
    try {
      await apiUpdateSupplier(storeId, s._id, { status: s.status === 'active' ? 'archived' : 'active' });
      setLoading(true); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update the supplier.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-[12px] pointer-coarse:text-[13px] text-slate max-w-[520px]">The suppliers you buy stock from. Pick them on purchase orders and supplier returns.</p>
        {canManage && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <BulkImportButton
              entityLabel="suppliers"
              basePath={`/api/purchase-orders/${storeId}/suppliers`}
              onImported={() => { setLoading(true); load(); }}
              notes={['A supplier whose name already exists is skipped, never overwritten.']}
            />
            <Button size="sm" icon={<Plus size={13} />} onClick={() => open('new')}>Add supplier</Button>
          </div>
        )}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-bone p-4 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-error">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => { setLoading(true); load(); }}>Retry</Button>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={64} rounded="10px" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Building2 size={28} className="text-brand-orange opacity-55" />} title="No suppliers yet" description="Add the businesses you buy stock from, then use them on purchase orders and returns." />
      ) : (
        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {rows.map(s => (
            <div key={s._id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] pointer-coarse:text-[15px] font-semibold text-charcoal sm:truncate">{s.name}</p>
                <p className="text-[11px] pointer-coarse:text-[13px] text-slate sm:truncate">{[s.email, s.phone, s.address].filter(Boolean).join(' · ') || 'No contact details'}</p>
              </div>
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <Badge color={s.status === 'active' ? 'green' : 'gray'} size="sm">{s.status === 'active' ? 'Active' : 'Archived'}</Badge>
                {canManage && (
                  <span className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => open(s)}>Edit</Button>
                    <Button size="sm" variant="secondary" loading={busyId === s._id} onClick={() => void toggleArchive(s)}>{s.status === 'active' ? 'Archive' : 'Restore'}</Button>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add supplier' : 'Edit supplier'} onClose={() => setEditing(null)} width={520} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving} disabled={!form.name.trim()}>Save</Button></div>}
        >
          <div className="flex flex-col gap-3">
            <Input label="Name" value={form.name} maxLength={120} onChange={set('name')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Email (optional)" type="email" value={form.email} onChange={set('email')} />
              <Input label="Phone (optional)" value={form.phone} onChange={set('phone')} />
            </div>
            <Input label="Address (optional)" value={form.address} onChange={set('address')} />
            <Input label="Notes (optional)" value={form.notes} onChange={set('notes')} />
            {formError && <p role="alert" className="text-[12px] text-error">{formError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
