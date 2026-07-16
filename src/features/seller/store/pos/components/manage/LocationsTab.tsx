import { useEffect, useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { Badge } from '@/components/comman/ui/Badge';
import {
  apiCreateLocation, apiListLocations, apiUpdateLocation, apiArchiveLocation, apiGetLocationsOverview,
  type StoreLocation, type LocationsOverview,
} from '@/api/services/pos/posLocations';
import { DarkModal, DarkField, DarkInput, DarkSelect, DarkButton, DarkEmptyState, DarkSkeleton, DarkTable } from './darkUi';

interface LocationsTabProps { storeId: string }

export function LocationsTab({ storeId }: LocationsTabProps) {
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [overview, setOverview] = useState<LocationsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<StoreLocation | 'new' | null>(null);
  const [archiving, setArchiving] = useState<StoreLocation | null>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [archiveNeedsForce, setArchiveNeedsForce] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([apiListLocations(storeId), apiGetLocationsOverview(storeId)])
      .then(([locRes, ovRes]) => { if (!cancelled) { setLocations(locRes.data); setOverview(ovRes.data); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load locations.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, refreshKey]);

  function reload() { setRefreshKey(k => k + 1); }

  async function submitArchive(force = false) {
    if (!archiving) return;
    setArchiveBusy(true);
    setArchiveError('');
    try {
      await apiArchiveLocation(storeId, archiving._id, force);
      setArchiving(null);
      setArchiveNeedsForce(false);
      reload();
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : 'Failed to archive location.');
      setArchiveNeedsForce(true);
    } finally {
      setArchiveBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-semibold text-white">Locations</p>
        <DarkButton icon={<Plus size={13} />} onClick={() => setEditing('new')}>Add Location</DarkButton>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <DarkSkeleton key={i} />)}</div>
      ) : error ? (
        <p className="text-[13px] text-error">{error}</p>
      ) : locations.length === 0 ? (
        <DarkEmptyState
          icon={<MapPin size={24} className="text-brand-orange" />}
          title="No locations yet"
          description="Add a branch to track registers, employees, and sales per physical location."
          action={{ label: 'Add Location', onClick: () => setEditing('new') }}
        />
      ) : (
        <>
          {overview && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-carbon rounded-xl px-4 py-3">
                <p className="text-[10px] text-pos-faint uppercase tracking-wide mb-1">Combined Sales (30d)</p>
                <p className="text-[18px] font-bold text-white">${overview.combinedTotalSales.toFixed(2)}</p>
              </div>
              <div className="bg-carbon rounded-xl px-4 py-3">
                <p className="text-[10px] text-pos-faint uppercase tracking-wide mb-1">Combined Transactions</p>
                <p className="text-[18px] font-bold text-white">{overview.combinedTransactionCount}</p>
              </div>
            </div>
          )}

          <DarkTable headers={['Branch', 'City', 'Sales (30d)', 'Status', '']}>
            {locations.map(loc => {
              const stats = overview?.byLocation.find(r => r.locationId === loc._id);
              return (
                <tr key={loc._id} className="border-b border-carbon last:border-0">
                  <td className="px-4 py-[10px] text-[12px] font-medium text-white">{loc.name}</td>
                  <td className="px-4 py-[10px] text-[12px] text-pos-faint">{loc.city ?? '—'}</td>
                  <td className="px-4 py-[10px] text-[12px] text-pos-faint">${(stats?.totalSales ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-[10px]"><Badge color={loc.status === 'active' ? 'green' : 'gray'}>{loc.status}</Badge></td>
                  <td className="px-4 py-[10px]">
                    <div className="flex justify-end gap-[6px]">
                      <button onClick={() => setEditing(loc)} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint">
                        Edit
                      </button>
                      {loc.status !== 'archived' && (
                        <button onClick={() => { setArchiving(loc); setArchiveError(''); setArchiveNeedsForce(false); }} className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-error">
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </DarkTable>
        </>
      )}

      {editing && (
        <LocationFormModal
          storeId={storeId}
          location={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}

      {archiving && (
        <DarkModal title="Archive Location" width={400} onClose={() => setArchiving(null)} footer={
          <>
            <DarkButton variant="outline" onClick={() => setArchiving(null)} disabled={archiveBusy}>Cancel</DarkButton>
            <DarkButton variant="danger" onClick={() => submitArchive(archiveNeedsForce)} loading={archiveBusy}>
              {archiveNeedsForce ? 'Archive Anyway' : 'Archive'}
            </DarkButton>
          </>
        }>
          <p className="text-[13px] text-pos-muted">
            Archive branch <strong className="text-white">"{archiving.name}"</strong>?
          </p>
          {archiveError && <p className="text-[12px] text-error mt-2">{archiveError}</p>}
        </DarkModal>
      )}
    </div>
  );
}

function LocationFormModal({
  storeId, location, onClose, onSaved,
}: {
  storeId: string;
  location: StoreLocation | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!location;
  const [name, setName] = useState(location?.name ?? '');
  const [addressLine1, setAddressLine1] = useState(location?.addressLine1 ?? '');
  const [city, setCity] = useState(location?.city ?? '');
  const [phone, setPhone] = useState(location?.phone ?? '');
  const [status, setStatus] = useState<'active' | 'archived'>(location?.status ?? 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!name.trim()) { setError('Location name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await apiUpdateLocation(storeId, location._id, { name, addressLine1, city, phone, status });
      } else {
        await apiCreateLocation(storeId, { name, addressLine1, city, phone });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DarkModal title={isEdit ? 'Edit Location' : 'Add Location'} onClose={onClose} footer={
      <>
        <DarkButton variant="outline" onClick={onClose}>Cancel</DarkButton>
        <DarkButton onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Add Location'}</DarkButton>
      </>
    }>
      <DarkField label="Branch Name" required>
        <DarkInput value={name} onChange={e => setName(e.target.value)} placeholder="North Karachi" />
      </DarkField>
      <DarkField label="Address">
        <DarkInput value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="Street address" />
      </DarkField>
      <DarkField label="City">
        <DarkInput value={city} onChange={e => setCity(e.target.value)} placeholder="Karachi" />
      </DarkField>
      <DarkField label="Phone">
        <DarkInput value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 1234567" />
      </DarkField>
      {isEdit && (
        <DarkField label="Status">
          <DarkSelect value={status} onChange={e => setStatus(e.target.value as 'active' | 'archived')}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </DarkSelect>
        </DarkField>
      )}
      {error && <p className="text-[12px] text-error">{error}</p>}
    </DarkModal>
  );
}
