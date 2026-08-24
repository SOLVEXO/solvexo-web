import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Truck } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  apiGetShippingZones, apiCreateShippingZone, apiUpdateShippingZone, apiDeleteShippingZone,
  type ShippingZone,
} from '@/api/services/adminShippingZones';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { Input } from '@/components/comman/ui/Input';
import { Toggle } from '@/components/comman/ui/Toggle';
import { Table, type TableColumn } from '@/components/comman/ui/Table';

/**
 * Admin-only management for the platform-wide `ShippingZone` rate table —
 * previously this schema had zero write path anywhere in the app (every
 * row could only be created via direct DB manipulation). `ShippingZone` has
 * no per-store scoping at all (see the backend schema's doc comment), so
 * this stays admin-only rather than inventing seller-level ownership the
 * data model doesn't support.
 */
function ShippingZoneFormModal({ zone, onClose, onSaved }: { zone: ShippingZone | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!zone;
  const [country, setCountry] = useState(zone?.country ?? '');
  const [province, setProvince] = useState(zone?.province ?? '');
  const [city, setCity] = useState(zone?.city ?? '');
  const [shippingPrice, setShippingPrice] = useState(String(zone?.shippingPrice ?? ''));
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(zone?.estimatedDeliveryTime ?? '');
  const [isActive, setIsActive] = useState(zone?.status !== 'inactive');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!country.trim() || !shippingPrice) { setError('Country and shipping price are required.'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        country: country.trim(),
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        shippingPrice: Number(shippingPrice),
        estimatedDeliveryTime: estimatedDeliveryTime.trim() || undefined,
        status: (isActive ? 'active' : 'inactive') as 'active' | 'inactive',
      };
      if (isEdit) await apiUpdateShippingZone(zone._id, payload);
      else await apiCreateShippingZone(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shipping zone.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal mobileSheet
      title={isEdit ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
      width={480}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Add Zone'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Country" placeholder="Pakistan" value={country} onChange={e => setCountry(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Province / State (optional)" placeholder="Punjab" value={province} onChange={e => setProvince(e.target.value)} />
          <Input label="City (optional)" placeholder="Lahore" value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Shipping Price" type="number" min={0} step={0.01} value={shippingPrice} onChange={e => setShippingPrice(e.target.value)} />
          <Input label="Estimated Delivery (optional)" placeholder="3-5 Days" value={estimatedDeliveryTime} onChange={e => setEstimatedDeliveryTime(e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-charcoal">Active</span>
          <Toggle checked={isActive} onChange={setIsActive} />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

export function AdminShippingZones() {
  usePageTitle('Shipping Zones');
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [editing, setEditing] = useState<ShippingZone | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ShippingZone | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiGetShippingZones()
      .then(res => setZones(res.data ?? []))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load shipping zones.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const countries = useMemo(() => Array.from(new Set(zones.map(z => z.country))).sort(), [zones]);
  const filtered = useMemo(
    () => countryFilter ? zones.filter(z => z.country === countryFilter) : zones,
    [zones, countryFilter],
  );

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError('');
    try {
      await apiDeleteShippingZone(deleting._id);
      setDeleting(null);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete shipping zone.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns: TableColumn<ShippingZone>[] = [
    {
      key: 'location', header: 'Location',
      render: z => (
        <div>
          <p className="font-semibold text-charcoal">{z.country}</p>
          {(z.province || z.city) && <p className="text-[11px] text-slate">{[z.city, z.province].filter(Boolean).join(', ')}</p>}
        </div>
      ),
    },
    { key: 'shippingPrice', header: 'Price', render: z => <span className="text-charcoal font-semibold whitespace-nowrap">{z.shippingPrice.toLocaleString()}</span> },
    { key: 'estimatedDeliveryTime', header: 'Delivery Time', render: z => <span className="text-slate whitespace-nowrap">{z.estimatedDeliveryTime || '—'}</span> },
    {
      key: 'status', header: 'Status',
      render: z => (
        <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: z.status === 'active' ? '#EAF7EF' : '#F0EEE6', color: z.status === 'active' ? '#1E7A3C' : '#5A5852' }}>
          {z.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: z => (
        <div className="flex gap-[6px]">
          <Button size="xs" variant="outline" icon={<Pencil size={11} />} onClick={() => setEditing(z)}>Edit</Button>
          <Button size="xs" variant="danger" icon={<Trash2 size={11} />} onClick={() => { setDeleting(z); setActionError(''); }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="bg-white border-b border-bone px-4 sm:px-7 py-[14px] sticky top-0 z-10 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Shipping Zones</h1>
          <p className="text-[12px] text-slate mt-[2px]">{zones.length} zone{zones.length !== 1 ? 's' : ''} configured platform-wide</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setEditing('new')} className="shrink-0">Add Zone</Button>
      </div>

      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
        {actionError && (
          <div className="bg-error-bg border border-error-border rounded-lg px-4 py-2.5 text-[12.5px] text-error">
            {actionError}
          </div>
        )}
        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          <div className="px-5 py-[14px] border-b border-bone flex items-center gap-[10px] flex-wrap">
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
              <option value="">All Countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {error ? (
            <p className="px-4 py-6 text-center text-[13px] text-error">{error}</p>
          ) : (
            <Table
              columns={columns}
              data={filtered}
              keyExtractor={z => z._id}
              loading={loading}
              emptyState={{ icon: <Truck size={28} className="text-slate" />, title: 'No shipping zones configured yet' }}
            />
          )}
        </div>
      </div>

      {editing && (
        <ShippingZoneFormModal
          zone={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {deleting && (
        <Modal mobileSheet
          title="Delete Shipping Zone"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteBusy}>Delete Zone</Button>
            </>
          }
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            Delete the shipping zone for "<strong>{deleting.country}{deleting.city ? `, ${deleting.city}` : ''}</strong>"? This cannot be undone.
          </p>
          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}
    </div>
  );
}

export default AdminShippingZones;
