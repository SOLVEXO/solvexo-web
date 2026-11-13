import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import { Badge, SkeletonBox, Button } from '@/components/comman/ui';
import { apiListLocations, apiCreateLocation, apiArchiveLocation, type StoreLocation } from '@/api/services/product';
import { apiListBins, apiCreateBin, apiDeleteBin, type Bin } from '@/api/services/staff';

/** Locations (branches and warehouses) with their bins. One component for both the
 *  Settings -> Locations tab and the Inventory "Manage Locations" window, so they never drift apart.
 *  `onChanged` runs after a location is added, archived or imported (Inventory refreshes its stock list). */
export function LocationsPanel({ storeId, onChanged }: { storeId: string; onChanged?: () => void }) {
  const [allLocations, setAllLocations] = useState<StoreLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationCity, setNewLocationCity] = useState('');
  const [newLocationType, setNewLocationType] = useState<'store' | 'warehouse'>('store');
  const [addingLocation, setAddingLocation] = useState(false);

  const reload = useCallback(() => apiListLocations(storeId).then(res => setAllLocations(res.data ?? [])), [storeId]);

  useEffect(() => {
    let off = false;
    apiListLocations(storeId)
      .then(res => { if (!off) { setAllLocations(res.data ?? []); setLocationsError(''); } })
      .catch((err: unknown) => { if (!off) setLocationsError(err instanceof Error ? err.message : 'Failed to load locations.'); })
      .finally(() => { if (!off) setLocationsLoading(false); });
    return () => { off = true; };
  }, [storeId]);

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) { setLocationsError('Location name is required'); return; }
    setAddingLocation(true);
    setLocationsError('');
    try {
      await apiCreateLocation(storeId, { name: newLocationName.trim(), city: newLocationCity.trim() || undefined, type: newLocationType });
      setNewLocationName('');
      setNewLocationCity('');
      setNewLocationType('store');
      await reload();
      onChanged?.();
    } catch (err: unknown) {
      setLocationsError(err instanceof Error ? err.message : 'Failed to add location.');
    } finally {
      setAddingLocation(false);
    }
  };

  const handleArchiveLocation = async (locationId: string) => {
    setLocationsError('');
    try {
      await apiArchiveLocation(storeId, locationId);
      await reload();
      onChanged?.();
    } catch (err: unknown) {
      setLocationsError(err instanceof Error ? err.message : 'Failed to archive location.');
    }
  };

  // Bins (shelf-level places inside one location), opened inline under the location's row.
  const [binsOpenFor, setBinsOpenFor] = useState<string | null>(null);
  const [binsByLocation, setBinsByLocation] = useState<Record<string, Bin[]>>({});
  const [binsLoading, setBinsLoading] = useState(false);
  const [newBinCode, setNewBinCode] = useState('');
  const [addingBin, setAddingBin] = useState(false);
  const [binsError, setBinsError] = useState('');

  const toggleBins = (locationId: string) => {
    if (binsOpenFor === locationId) { setBinsOpenFor(null); return; }
    setBinsOpenFor(locationId);
    setBinsError('');
    setNewBinCode('');
    if (!binsByLocation[locationId]) {
      setBinsLoading(true);
      apiListBins(storeId, locationId)
        .then(res => setBinsByLocation(prev => ({ ...prev, [locationId]: res.data })))
        .catch((err: unknown) => setBinsError(err instanceof Error ? err.message : 'Failed to load bins.'))
        .finally(() => setBinsLoading(false));
    }
  };

  const handleAddBin = async (locationId: string) => {
    if (!newBinCode.trim()) { setBinsError('A bin code is required'); return; }
    setAddingBin(true);
    setBinsError('');
    try {
      await apiCreateBin(storeId, locationId, { code: newBinCode.trim() });
      setNewBinCode('');
      const res = await apiListBins(storeId, locationId);
      setBinsByLocation(prev => ({ ...prev, [locationId]: res.data }));
    } catch (err: unknown) {
      setBinsError(err instanceof Error ? err.message : 'Failed to add bin.');
    } finally {
      setAddingBin(false);
    }
  };

  const handleDeleteBin = async (locationId: string, binId: string) => {
    setBinsError('');
    try {
      await apiDeleteBin(storeId, binId);
      const res = await apiListBins(storeId, locationId);
      setBinsByLocation(prev => ({ ...prev, [locationId]: res.data }));
    } catch (err: unknown) {
      setBinsError(err instanceof Error ? err.message : 'Failed to delete bin.');
    }
  };

  const active = allLocations.filter(l => l.status === 'active');

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-slate">
        Add a physical branch/warehouse to start tracking stock per-location. A single location
        behaves exactly like before — location tracking only turns on once you add a second one.
      </p>
      <div>
        <BulkImportButton
          entityLabel="locations"
          basePath={`/api/pos/locations/${storeId}`}
          onImported={() => { reload().catch(() => undefined); onChanged?.(); }}
          notes={['Your plan\'s location limit applies; rows over the limit fail. Bins are managed per location in this window.']}
        />
      </div>

      {locationsLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonBox key={i} height={44} rounded="8px" />)}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#f3f2ec]">
          {active.map(loc => (
            <div key={loc._id} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-charcoal flex items-center gap-1.5">
                    {loc.name}
                    <Badge color={loc.type === 'warehouse' ? 'blue' : 'green'}>{loc.type === 'warehouse' ? 'Warehouse' : 'Store'}</Badge>
                    {loc.isDefault ? <span className="text-[10.5px] text-slate">(default)</span> : null}
                  </p>
                  {loc.city && <p className="text-[11px] text-slate">{loc.city}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBins(loc._id)}
                    className="text-[11px] font-medium text-brand-deep-orange bg-transparent border-none cursor-pointer hover:underline"
                  >
                    {binsOpenFor === loc._id ? 'Hide bins' : 'Bins'}{binsByLocation[loc._id]?.length ? ` (${binsByLocation[loc._id].length})` : ''}
                  </button>
                  <button
                    onClick={() => handleArchiveLocation(loc._id)}
                    title="Archive location"
                    className="flex items-center justify-center w-[26px] h-[26px] text-error border border-bone rounded-[6px] cursor-pointer transition-colors duration-150 hover:bg-error-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {binsOpenFor === loc._id && (
                <div className="mt-2 ml-2 pl-3 border-l-2 border-bone flex flex-col gap-2">
                  {binsLoading && !binsByLocation[loc._id] ? (
                    <SkeletonBox height={28} rounded="6px" />
                  ) : (
                    <>
                      {(binsByLocation[loc._id] ?? []).map(bin => (
                        <div key={bin._id} className="flex items-center justify-between gap-2">
                          <span className="text-[12px] text-charcoal">{bin.code}{bin.zone || bin.aisle || bin.shelf ? ` — ${[bin.zone, bin.aisle, bin.shelf].filter(Boolean).join(' / ')}` : ''}</span>
                          <button onClick={() => handleDeleteBin(loc._id, bin._id)} className="text-error bg-transparent border-none cursor-pointer" title="Delete bin">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {(binsByLocation[loc._id] ?? []).length === 0 && <p className="text-[11px] text-slate">No bins yet at this location.</p>}
                      <div className="flex gap-1.5">
                        <input
                          value={newBinCode}
                          onChange={e => setNewBinCode(e.target.value)}
                          placeholder="Bin code (e.g. A3-B2)"
                          aria-label="Bin code"
                          className="flex-1 border border-bone rounded-[6px] px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                        />
                        <Button size="xs" variant="secondary" onClick={() => handleAddBin(loc._id)} loading={addingBin}>Add</Button>
                      </div>
                      {binsError && <p className="text-[11px] text-error">{binsError}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {active.length === 0 && (
            <p className="text-[12px] text-slate py-2">No locations yet — add your first one below.</p>
          )}
        </div>
      )}

      <div className="border-t border-[#f3f2ec] pt-4 flex flex-col gap-2">
        <p className="text-[12px] font-semibold text-charcoal">Add a location</p>
        <input
          value={newLocationName}
          onChange={e => setNewLocationName(e.target.value)}
          placeholder="Location name (e.g. North Karachi)"
          aria-label="Location name"
          className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
        />
        <input
          value={newLocationCity}
          onChange={e => setNewLocationCity(e.target.value)}
          placeholder="City (optional)"
          aria-label="City"
          className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setNewLocationType('store')}
            className={`flex-1 rounded-[8px] py-2 text-[12.5px] font-medium cursor-pointer border transition-colors ${newLocationType === 'store' ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange' : 'bg-white border-bone text-slate hover:bg-cream'}`}
          >
            Store (retail/POS)
          </button>
          <button
            onClick={() => setNewLocationType('warehouse')}
            className={`flex-1 rounded-[8px] py-2 text-[12.5px] font-medium cursor-pointer border transition-colors ${newLocationType === 'warehouse' ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange' : 'bg-white border-bone text-slate hover:bg-cream'}`}
          >
            Warehouse (fulfillment)
          </button>
        </div>
        <Button variant="secondary" onClick={handleAddLocation} loading={addingLocation}>Add Location</Button>
        {locationsError && <p role="alert" className="text-[12px] text-error">{locationsError}</p>}
      </div>
    </div>
  );
}
