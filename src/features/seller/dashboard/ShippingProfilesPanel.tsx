import { useEffect, useState } from 'react';
import { Plus, Pencil, Package, MapPin } from 'lucide-react';
import { Button, Modal, Field, Input, EmptyState } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import {
  apiCreateShippingProfile, apiUpdateShippingProfile, apiDeleteShippingProfile, apiAssignProfileProducts, apiSearchProfileProducts,
  type ShippingProfile, type ShippingProfilesData, type ProfileProduct,
} from '@/api/services/shipping';
import { apiListLocations, apiUpdateLocation, type StoreLocation } from '@/api/services/product';

type View =
  | { kind: 'list' }
  | { kind: 'edit'; profile: ShippingProfile | null }
  | { kind: 'products'; profile: ShippingProfile }
  | { kind: 'location'; locationId: string; back: ShippingProfile | null };

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

// ── Ship-from address of one location (used as a profile's origin for Shippo + local-delivery radius) ──
function LocationAddressForm({ storeId, locationId, onBack }: { storeId: string; locationId: string; onBack: () => void }) {
  const [loc, setLoc] = useState<StoreLocation | null>(null);
  const [loadError, setLoadError] = useState('');
  const [f, setF] = useState({ addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: '', latitude: '', longitude: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiListLocations(storeId)
      .then(res => {
        if (cancelled) return;
        const found = (res.data ?? []).find(l => l._id === locationId) ?? null;
        if (!found) { setLoadError('Location not found.'); return; }
        setLoc(found);
        setF({
          addressLine1: found.addressLine1 ?? '', addressLine2: found.addressLine2 ?? '', city: found.city ?? '', state: found.state ?? '',
          zipCode: found.zipCode ?? '', country: found.country ?? '',
          latitude: found.latitude != null ? String(found.latitude) : '', longitude: found.longitude != null ? String(found.longitude) : '',
        });
      })
      .catch((e: unknown) => { if (!cancelled) setLoadError(errMsg(e, 'Failed to load the location.')); });
    return () => { cancelled = true; };
  }, [storeId, locationId]);

  const save = async () => {
    const lat = f.latitude.trim() === '' ? null : Number(f.latitude);
    const lng = f.longitude.trim() === '' ? null : Number(f.longitude);
    if ((lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) || (lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180))) {
      setError('Latitude must be between -90 and 90 and longitude between -180 and 180.'); return;
    }
    if ((lat === null) !== (lng === null)) { setError('Enter both latitude and longitude, or leave both empty.'); return; }
    setError(''); setSaving(true);
    try {
      await apiUpdateLocation(storeId, locationId, {
        addressLine1: f.addressLine1.trim(), addressLine2: f.addressLine2.trim(), city: f.city.trim(), state: f.state.trim(),
        zipCode: f.zipCode.trim(), country: f.country.trim(), latitude: lat, longitude: lng,
      });
      onBack();
    } catch (e) {
      setError(errMsg(e, 'Failed to save the address.'));
    } finally { setSaving(false); }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  if (loadError) return <p className="text-[12px] text-error">{loadError}</p>;
  if (!loc) return <p className="text-[12px] text-slate">Loading…</p>;
  return (
    <>
      <p className="text-[12px] text-slate mb-3">Ship-from address of <b>{loc.name}</b>. Live carrier rates and labels use it as the origin; coordinates enable local-delivery radius.</p>
      {error && <p className="text-[12px] text-error mb-3">{error}</p>}
      <Field label="Address"><Input value={f.addressLine1} onChange={set('addressLine1')} maxLength={200} placeholder="Street address" /></Field>
      <Field label="Apartment, suite, etc."><Input value={f.addressLine2} onChange={set('addressLine2')} maxLength={200} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City"><Input value={f.city} onChange={set('city')} /></Field>
        <Field label="State / Province"><Input value={f.state} onChange={set('state')} maxLength={100} /></Field>
        <Field label="Postal code"><Input value={f.zipCode} onChange={set('zipCode')} maxLength={20} /></Field>
        <Field label="Country (ISO code)" hint="e.g. PK, US"><Input value={f.country} onChange={set('country')} maxLength={60} placeholder="PK" /></Field>
        <Field label="Latitude" hint="Optional"><Input type="number" value={f.latitude} onChange={set('latitude')} placeholder="24.8607" /></Field>
        <Field label="Longitude" hint="Optional"><Input type="number" value={f.longitude} onChange={set('longitude')} placeholder="67.0011" /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="ghost" onClick={onBack} disabled={saving}>Back</Button>
        <Button variant="primary" onClick={save} loading={saving}>Save address</Button>
      </div>
    </>
  );
}

// ── Profile create / edit (name + ship-from locations) ──────────────────────
function ProfileEditor({ storeId, profile, data, onDone, onEditLocation, onChanged }: {
  storeId: string; profile: ShippingProfile | null; data: ShippingProfilesData;
  onDone: () => void; onEditLocation: (locationId: string) => void; onChanged: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? '');
  const [origins, setOrigins] = useState<string[]>(profile?.originLocationIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isGeneral = !!profile?.isGeneral;

  const toggle = (id: string) => setOrigins(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));

  const save = async () => {
    if (!isGeneral && !name.trim()) { setError('Profile name is required.'); return; }
    setError(''); setSaving(true);
    try {
      if (!profile) await apiCreateShippingProfile(storeId, { name: name.trim(), originLocationIds: origins });
      else await apiUpdateShippingProfile(storeId, profile._id, { ...(isGeneral ? {} : { name: name.trim() }), originLocationIds: origins });
      onChanged(); onDone();
    } catch (e) { setError(errMsg(e, 'Failed to save the profile.')); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!profile) return;
    setDeleting(true);
    try { await apiDeleteShippingProfile(storeId, profile._id); onChanged(); onDone(); }
    catch (e) { setError(errMsg(e, 'Failed to delete the profile.')); setConfirmDelete(false); }
    finally { setDeleting(false); }
  };

  return (
    <>
      {error && <p className="text-[12px] text-error mb-3">{error}</p>}
      <Field label="Profile name" required={!isGeneral}>
        <Input value={name} onChange={e => setName(e.target.value)} maxLength={80} disabled={isGeneral} placeholder="Fragile items" />
      </Field>
      <p className="text-[12px] font-semibold text-carbon mb-1">Ship from</p>
      <p className="text-[11.5px] text-slate mb-2">The first selected location is the origin used for live carrier rates, labels and local-delivery radius. With none selected the address from Integrations (Shippo) is used.</p>
      {data.locations.length === 0 ? (
        <p className="text-[12px] text-slate mb-3">You have no locations yet — add one under Inventory → Locations.</p>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {data.locations.map(l => (
            <div key={l._id} className="flex items-center justify-between gap-2 border border-bone rounded-lg px-3 py-2">
              <label className="flex items-center gap-2 text-[13px] text-carbon cursor-pointer min-w-0">
                <input type="checkbox" checked={origins.includes(l._id)} onChange={() => toggle(l._id)} />
                <span className="truncate">{l.name}{origins[0] === l._id ? ' (primary)' : ''}</span>
                <span className="text-[11.5px] text-slate truncate">{[l.addressLine1, l.city, l.country].filter(Boolean).join(', ') || 'No address yet'}</span>
              </label>
              <button type="button" className="text-[12px] text-brand-orange cursor-pointer bg-transparent border-none shrink-0" onClick={() => onEditLocation(l._id)}>Edit address</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 mt-2">
        {profile && !isGeneral ? <Button variant="ghost" onClick={() => setConfirmDelete(true)} disabled={saving}>Delete profile</Button> : <span />}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving}>{profile ? 'Save' : 'Create profile'}</Button>
        </div>
      </div>
      {confirmDelete && profile && (
        <ConfirmDialog
          title="Delete shipping profile"
          message={`Delete "${profile.name}"? Its ${profile.productCount} product(s) move back to the General profile and its ${profile.zoneCount} shipping rate(s) are removed.`}
          onConfirm={del}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
    </>
  );
}

// ── Products of a profile (search + bulk assign) ────────────────────────────
function ProfileProducts({ storeId, profile, generalId, onChanged, onBack }: {
  storeId: string; profile: ShippingProfile; generalId: string; onChanged: () => void; onBack: () => void;
}) {
  const [mode, setMode] = useState<'in' | 'all'>('in');
  const [q, setQ] = useState('');
  const [result, setResult] = useState<{ key: string; rows: ProfileProduct[]; error: string }>({ key: '', rows: [], error: '' });
  const [actionError, setActionError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const ref = profile.isGeneral ? 'general' : profile._id;
  const reqKey = `${q}|${mode}|${ref}|${reload}`;
  const loading = result.key !== reqKey;
  const rows = result.rows;
  const error = actionError || (loading ? '' : result.error);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      apiSearchProfileProducts(storeId, q.trim() || undefined, mode === 'in' ? ref : undefined)
        .then(res => { if (!cancelled) { setResult({ key: reqKey, rows: res.data ?? [], error: '' }); setSelected(new Set()); } })
        .catch((e: unknown) => { if (!cancelled) setResult({ key: reqKey, rows: [], error: errMsg(e, 'Failed to load products.') }); });
    }, q ? 250 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [storeId, q, mode, ref, reqKey]);

  const toggle = (id: string) => setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const apply = async (target: string) => {
    setBusy(true); setActionError('');
    try {
      await apiAssignProfileProducts(storeId, target, [...selected]);
      onChanged(); setReload(r => r + 1);
    } catch (e) { setActionError(errMsg(e, 'Failed to move the products.')); } finally { setBusy(false); }
  };
  const profileOf = (p: ProfileProduct) => (p.shippingProfileId && p.shippingProfileId !== generalId ? 'Custom profile' : 'General profile');

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Button size="sm" variant={mode === 'in' ? 'primary' : 'outline'} onClick={() => setMode('in')}>In {profile.name}</Button>
        {!profile.isGeneral && <Button size="sm" variant={mode === 'all' ? 'primary' : 'outline'} onClick={() => setMode('all')}>All products</Button>}
      </div>
      <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" />
      {error && <p className="text-[12px] text-error mt-2">{error}</p>}
      <div className="mt-3 flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
        {loading ? <p className="text-[12px] text-slate">Loading…</p> : rows.length === 0 ? (
          <EmptyState icon={<Package size={24} className="text-slate/50" />} title="No products" description={mode === 'in' ? 'No products use this profile yet.' : 'No matching physical products.'} />
        ) : rows.map(p => (
          <label key={p._id} className="flex items-center gap-2 border border-bone rounded-lg px-3 py-2 text-[13px] text-carbon cursor-pointer">
            <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggle(p._id)} />
            {p.image && <img src={p.image} alt="" className="w-7 h-7 rounded object-cover" />}
            <span className="truncate flex-1">{p.name}</span>
            <span className="text-[11px] text-slate shrink-0">{profileOf(p)}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 mt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        {!profile.isGeneral && mode === 'in' && (
          <Button variant="outline" disabled={selected.size === 0 || busy} loading={busy} onClick={() => apply('general')}>Move {selected.size || ''} to General</Button>
        )}
        {!profile.isGeneral && mode === 'all' && (
          <Button variant="primary" disabled={selected.size === 0 || busy} loading={busy} onClick={() => apply(profile._id)}>Add {selected.size || ''} to {profile.name}</Button>
        )}
      </div>
    </>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────
export function ShippingProfilesPanel({ storeId, data, onChanged, onClose }: {
  storeId: string; data: ShippingProfilesData; onChanged: () => void; onClose: () => void;
}) {
  const [view, setView] = useState<View>({ kind: 'list' });
  const locName = (id: string) => data.locations.find(l => l._id === id)?.name;
  const title = view.kind === 'list' ? 'Shipping profiles' : view.kind === 'edit' ? (view.profile ? `Edit ${view.profile.name}` : 'New shipping profile')
    : view.kind === 'products' ? `Products · ${view.profile.name}` : 'Ship-from address';

  return (
    <Modal title={title} onClose={onClose} width={560}>
      {view.kind === 'list' && (
        <>
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="text-[12px] text-slate">Group products that ship differently (fragile, heavy, from another warehouse) and give each group its own rates and ship-from location.</p>
            <Button size="sm" icon={<Plus size={13} />} onClick={() => setView({ kind: 'edit', profile: null })}>New profile</Button>
          </div>
          <div className="flex flex-col gap-2.5">
            {data.profiles.map(p => (
              <div key={p._id} className="border border-bone rounded-[10px] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-carbon">{p.name}{p.isGeneral && <span className="ml-2 text-[10.5px] font-medium text-slate bg-bone rounded px-1.5 py-0.5">Default</span>}</p>
                  <p className="text-[12px] text-slate">{p.productCount} product{p.productCount === 1 ? '' : 's'} · {p.zoneCount} rate{p.zoneCount === 1 ? '' : 's'}</p>
                  <p className="text-[11.5px] text-slate flex items-center gap-1"><MapPin size={11} /> {p.originLocationIds.map(locName).filter(Boolean).join(', ') || 'Ship from: integration address'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" icon={<Package size={13} />} onClick={() => setView({ kind: 'products', profile: p })}>Products</Button>
                  <Button size="sm" variant="outline" icon={<Pencil size={13} />} onClick={() => setView({ kind: 'edit', profile: p })}>Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {view.kind === 'edit' && (
        <ProfileEditor
          storeId={storeId} profile={view.profile} data={data} onChanged={onChanged}
          onDone={() => setView({ kind: 'list' })}
          onEditLocation={id => setView({ kind: 'location', locationId: id, back: view.profile })}
        />
      )}
      {view.kind === 'products' && (
        <ProfileProducts storeId={storeId} profile={view.profile} generalId={data.generalProfileId} onChanged={onChanged} onBack={() => setView({ kind: 'list' })} />
      )}
      {view.kind === 'location' && (
        <LocationAddressForm
          storeId={storeId} locationId={view.locationId}
          onBack={() => { onChanged(); setView({ kind: 'edit', profile: view.back }); }}
        />
      )}
    </Modal>
  );
}
