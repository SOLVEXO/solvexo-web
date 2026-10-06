import { useEffect, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { MapPin, Truck, Tag, PackageSearch, AlertCircle, Plus, Pencil, Trash2, Link2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStoreShippingZones } from '@/hooks/shipping/useStoreShippingZones';
import { useShippingProfiles } from '@/hooks/shipping/useShippingProfiles';
import { ShippingProfilesPanel } from './ShippingProfilesPanel';
import { groupZonesByRegion } from '@/utils/shippingZoneDisplay';
import { useShippingCarriers } from '@/hooks/shipping/useShippingCarriers';
import { Button, SkeletonBox, EmptyState, Modal, Field, Input, Select, Toggle, ActionMenu, type ActionMenuItem } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import type { ShippingZone, ShippingCarrier, ShippingZoneType, ShippingRateType } from '@/api/services/shipping';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';

// ── Data ──────────────────────────────────────────────────────────────────────
const TABS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 'zones',    Icon: MapPin,        label: 'Zones'              },
  { id: 'local',    Icon: PackageSearch, label: 'Local Delivery'     },
  { id: 'pickup',   Icon: MapPin,        label: 'Local Pickup'       },
  { id: 'carriers', Icon: Truck,         label: 'Carriers'           },
  { id: 'labels',   Icon: Tag,           label: 'Labels & Tracking'  },
];

// ── Zone create/edit modal (Zones tab: full country/province/city; Local
// Delivery tab: just a delivery-area name, no country/province) ─────────────
function ZoneFormModal({ storeId, zoneType, zone, profileRef, prefill, onClose, onSaved }: {
  storeId: string;
  zoneType: ShippingZoneType;
  zone?: ShippingZone | null;
  profileRef: string;
  /** "Add rate" inside a region card prefills the region. */
  prefill?: { country: string; province: string; regionName: string } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!zone;
  const isLocal = zoneType === 'local_delivery';
  const isPickup = zoneType === 'pickup';
  const { store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);
  const { create, update } = useStoreShippingZones(storeId, zoneType, profileRef);
  const [name, setName] = useState(zone?.name ?? '');
  const [regionName, setRegionName] = useState(zone?.regionName ?? prefill?.regionName ?? '');
  const [radiusKm, setRadiusKm] = useState(zone?.radiusKm != null ? String(zone.radiusKm) : '');
  const [rateType, setRateType] = useState<ShippingRateType>(zone?.rateType ?? 'flat');
  const [tiers, setTiers] = useState<{ min: string; max: string; price: string }[]>(
    (zone?.rateTiers ?? []).map(t => ({ min: String(t.min), max: t.max == null ? '' : String(t.max), price: String(t.price) })),
  );
  const [freeAbove, setFreeAbove] = useState(zone?.freeShippingThreshold != null ? String(zone.freeShippingThreshold) : '');
  const [pickupAddress, setPickupAddress] = useState(zone?.pickupAddress ?? '');
  const [pickupInstructions, setPickupInstructions] = useState(zone?.pickupInstructions ?? '');
  const [country, setCountry] = useState(zone?.country ?? prefill?.country ?? (isLocal ? 'Local Delivery' : isPickup ? 'Local Pickup' : ''));
  const [province, setProvince] = useState(zone?.province ?? prefill?.province ?? '');
  const [city, setCity] = useState(zone?.city ?? '');
  const [price, setPrice] = useState(String(zone?.shippingPrice ?? ''));
  const [minDays, setMinDays] = useState(zone?.minDays != null ? String(zone.minDays) : '');
  const [maxDays, setMaxDays] = useState(zone?.maxDays != null ? String(zone.maxDays) : '');
  const [postcodes, setPostcodes] = useState((zone?.postalCodes ?? []).join(', '));
  const [minOrder, setMinOrder] = useState(zone?.minOrderAmount != null ? String(zone.minOrderAmount) : '');
  const [eta, setEta] = useState(zone?.estimatedDeliveryTime ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(zone?.status ?? 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!isLocal && !isPickup && !country.trim()) { setError('Country is required.'); return; }
    if (isPickup && !pickupAddress.trim()) { setError('Pickup address is required.'); return; }
    if (!isPickup && !city.trim()) { setError(isLocal ? 'Delivery area is required.' : 'City is required.'); return; }
    const tiered = !isPickup && !isLocal && rateType !== 'flat';
    const priceNum = isPickup || tiered ? 0 : Number(price);
    if (!isPickup && !tiered && (!price.trim() || Number.isNaN(priceNum) || priceNum < 0)) { setError('Enter a valid price.'); return; }
    let rateTiers: { min: number; max: number | null; price: number }[] | undefined;
    if (tiered) {
      rateTiers = [];
      for (const t of tiers) {
        const min = Number(t.min); const max = t.max.trim() === '' ? null : Number(t.max); const tp = Number(t.price);
        if (t.min.trim() === '' || t.price.trim() === '' || Number.isNaN(min) || Number.isNaN(tp) || (max !== null && Number.isNaN(max))) {
          setError('Fill in minimum and price for every tier.'); return;
        }
        rateTiers.push({ min, max, price: tp });
      }
      if (rateTiers.length === 0) { setError('Add at least one rate tier.'); return; }
    }
    const freeNum = freeAbove.trim() === '' ? null : Number(freeAbove);
    if (freeNum !== null && (Number.isNaN(freeNum) || freeNum < 0)) { setError('Enter a valid free-shipping amount.'); return; }
    const parseDay = (v: string) => (v.trim() === '' ? null : Number(v));
    const minD = parseDay(minDays); const maxD = parseDay(maxDays);
    if ([minD, maxD].some(d => d !== null && (!Number.isInteger(d) || d < 0 || d > 365))) { setError('Delivery days must be whole numbers between 0 and 365.'); return; }
    if (minD !== null && maxD !== null && maxD < minD) { setError('Maximum delivery days must be at least the minimum.'); return; }
    const minOrderNum = minOrder.trim() === '' ? null : Number(minOrder);
    if (minOrderNum !== null && (Number.isNaN(minOrderNum) || minOrderNum < 0)) { setError('Enter a valid minimum order amount.'); return; }
    const radiusNum = radiusKm.trim() === '' ? null : Number(radiusKm);
    if (isLocal && radiusNum !== null && (Number.isNaN(radiusNum) || radiusNum < 0.1 || radiusNum > 500)) { setError('Radius must be between 0.1 and 500 km.'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...(!isLocal && !isPickup ? { regionName: regionName.trim() || null } : {}),
        ...(isLocal ? { radiusKm: radiusNum } : {}),
        minDays: isPickup ? null : minD,
        maxDays: isPickup ? null : maxD,
        minOrderAmount: isPickup ? null : minOrderNum,
        ...(isLocal ? { postalCodes: postcodes.split(/[,\n]/).map(p => p.trim()).filter(Boolean) } : {}),
        country: isLocal ? 'Local Delivery' : isPickup ? 'Local Pickup' : country.trim(),
        province: isLocal || isPickup ? undefined : (province.trim() || undefined),
        city: isPickup ? undefined : city.trim(),
        shippingPrice: priceNum,
        estimatedDeliveryTime: eta.trim() || undefined,
        status,
        name: name.trim() || undefined,
        ...(isPickup
          ? { pickupAddress: pickupAddress.trim(), pickupInstructions: pickupInstructions.trim() || undefined }
          : { rateType: tiered ? rateType : 'flat' as ShippingRateType, rateTiers: tiered ? rateTiers : [], freeShippingThreshold: freeNum }),
      };
      if (isEdit && zone) await update(zone._id, payload);
      else await create(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? `Edit ${isPickup ? 'pickup location' : isLocal ? 'delivery area' : 'zone'}` : `New ${isPickup ? 'pickup location' : isLocal ? 'delivery area' : 'shipping zone'}`}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>{isEdit ? 'Save' : 'Create'}</Button>
      </>}
    >
      {error && <p className="text-[12px] text-error mb-3">{error}</p>}
      <Field label="Name" hint={isPickup ? 'Shown to buyers, e.g. "Pick up at our Karachi shop".' : 'Optional — shown to buyers at checkout, e.g. "Standard" or "Express".'}>
        <Input value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder={isPickup ? 'Pick up at our shop' : 'Standard'} />
      </Field>
      {isPickup && (
        <>
          <Field label="Pickup address" required>
            <Input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} maxLength={300} placeholder="Shop 4, Main Boulevard, Karachi" />
          </Field>
          <Field label="Pickup instructions" hint="Optional — opening hours, what to bring.">
            <Input value={pickupInstructions} onChange={e => setPickupInstructions(e.target.value)} maxLength={500} placeholder="Bring your order number. Open 10am–8pm." />
          </Field>
        </>
      )}
      {!isLocal && !isPickup && (
        <Field label="Country" required hint="Picked from a real list — checkout matches this exactly against a buyer's own country, so a typo here would silently hide this zone from every buyer.">
          <Select value={country} onChange={e => setCountry(e.target.value)}>
            <option value="" disabled>Select country</option>
            {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
          </Select>
        </Field>
      )}
      {!isLocal && !isPickup && (
        <Field label="Province / State" hint="Optional">
          <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="Sindh" />
        </Field>
      )}
      {!isLocal && !isPickup && (
        <Field label="Region name" hint="Optional — rates with the same country, province and region name are shown together in one region card, e.g. 'Domestic'.">
          <Input value={regionName} onChange={e => setRegionName(e.target.value)} maxLength={80} placeholder="Domestic" />
        </Field>
      )}
      {!isPickup && (
        <Field label={isLocal ? 'Delivery area' : 'City'} required>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder={isLocal ? 'e.g. DHA Phase 6' : 'Karachi'} />
        </Field>
      )}
      {!isPickup && !isLocal && (
        <Field label="Rate type" hint="Flat charges one price; the other two pick a price from the cart's total weight or order value.">
          <Select value={rateType} onChange={e => setRateType(e.target.value as ShippingRateType)}>
            <option value="flat">Flat rate</option>
            <option value="weight">Based on order weight (kg)</option>
            <option value="price">Based on order price</option>
          </Select>
        </Field>
      )}
      {!isPickup && (isLocal || rateType === 'flat') && (
        <Field label={`Price (${symbol})`} required hint={`In your store's own currency — ${store?.baseCurrency ?? 'PKR'}.`}>
          <Input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} placeholder="200" />
        </Field>
      )}
      {!isPickup && !isLocal && rateType !== 'flat' && (
        <div className="mb-4">
          <p className="text-[12px] font-semibold text-carbon mb-1.5">Rate tiers</p>
          <p className="text-[11.5px] text-slate mb-2">
            {rateType === 'weight' ? 'Weight in kg (from each product variant).' : `Order subtotal in ${store?.baseCurrency ?? 'PKR'}.`} Leave "Max" empty for no upper limit. Tiers must not overlap; a cart that fits no tier can't use this zone.
          </p>
          <div className="flex flex-col gap-2">
            {tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input type="number" min={0} value={t.min} placeholder="Min" aria-label="Tier minimum" onChange={e => setTiers(ts => ts.map((x, j) => j === i ? { ...x, min: e.target.value } : x))} />
                <Input type="number" min={0} value={t.max} placeholder="Max" aria-label="Tier maximum" onChange={e => setTiers(ts => ts.map((x, j) => j === i ? { ...x, max: e.target.value } : x))} />
                <Input type="number" min={0} value={t.price} placeholder={`Price (${symbol})`} aria-label="Tier price" onChange={e => setTiers(ts => ts.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
                <button type="button" aria-label="Remove tier" className="p-1.5 text-slate hover:text-error cursor-pointer bg-transparent border-none" onClick={() => setTiers(ts => ts.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" icon={<Plus size={13} />} onClick={() => setTiers(ts => [...ts, { min: '', max: '', price: '' }])}>Add tier</Button>
        </div>
      )}
      {isLocal && (
        <Field label="Delivery radius (km)" hint="Optional — buyers whose map-pinned address is within this distance of the profile's ship-from location (set its coordinates in Manage profiles) are offered this option. Takes precedence over the postcode list when both locations have coordinates.">
          <Input type="number" min={0.1} max={500} value={radiusKm} onChange={e => setRadiusKm(e.target.value)} placeholder="10" />
        </Field>
      )}
      {isLocal && (
        <Field label="Postal codes" hint="Optional — comma-separated. When set, this option is offered only to buyers whose postcode is on the list (otherwise it matches by delivery area above).">
          <Input value={postcodes} onChange={e => setPostcodes(e.target.value)} placeholder="75500, 75600" />
        </Field>
      )}
      {!isPickup && (
        <Field label={`Minimum order (${symbol})`} hint="Optional — hide this option for orders below this subtotal.">
          <Input type="number" min={0} value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="1000" />
        </Field>
      )}
      {!isPickup && (
        <Field label={`Free shipping over (${symbol})`} hint="Optional — order subtotal at/above which this option is free.">
          <Input type="number" min={0} value={freeAbove} onChange={e => setFreeAbove(e.target.value)} placeholder="5000" />
        </Field>
      )}
      <Field label={isPickup ? 'Ready for pickup in' : 'Estimated delivery time'} hint={isPickup ? 'Optional, e.g. 2 hours' : 'Optional, e.g. 2-4 Days'}>
        <Input value={eta} onChange={e => setEta(e.target.value)} placeholder="2-4 Days" />
      </Field>
      {!isPickup && (
        <Field label="Delivery window (days)" hint="Optional — checkout shows an 'Arrives <date range>' line counted from today.">
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={365} value={minDays} onChange={e => setMinDays(e.target.value)} placeholder="Min" aria-label="Minimum delivery days" />
            <Input type="number" min={0} max={365} value={maxDays} onChange={e => setMaxDays(e.target.value)} placeholder="Max" aria-label="Maximum delivery days" />
          </div>
        </Field>
      )}
      <Field label="Status">
        <Select value={status} onChange={e => setStatus(e.target.value as 'active' | 'inactive')}>
          <option value="active">Active — shown to buyers at checkout</option>
          <option value="inactive">Inactive — hidden from checkout</option>
        </Select>
      </Field>
    </Modal>
  );
}

// ── Carrier create/edit modal ────────────────────────────────────────────────
function CarrierFormModal({ storeId, carrier, onClose, onSaved }: {
  storeId: string;
  carrier?: ShippingCarrier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!carrier;
  const { create, update } = useShippingCarriers(storeId);
  const [name, setName] = useState(carrier?.name ?? '');
  const [template, setTemplate] = useState(carrier?.trackingUrlTemplate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Carrier name is required.'); return; }
    if (template.trim() && !template.includes('{tracking}')) {
      setError('Tracking URL must contain a {tracking} placeholder.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = { name: name.trim(), trackingUrlTemplate: template.trim() || undefined };
      if (isEdit && carrier) await update(carrier._id, payload);
      else await create(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit carrier' : 'New carrier'}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>{isEdit ? 'Save' : 'Add'}</Button>
      </>}
    >
      {error && <p className="text-[12px] text-error mb-3">{error}</p>}
      <Field label="Carrier name" required>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="TCS" />
      </Field>
      <Field
        label="Tracking URL template"
        hint="Optional — must include a {tracking} placeholder, e.g. https://www.tcscourier.com/track/{tracking}. Used to auto-build a real tracking link when you mark an order as shipped."
      >
        <Input value={template} onChange={e => setTemplate(e.target.value)} placeholder="https://example.com/track/{tracking}" />
      </Field>
    </Modal>
  );
}

// ── Zone list (shared by Zones + Local Delivery tabs) ───────────────────────
function ZoneList({ storeId, zoneType, profileRef }: { storeId: string; zoneType: ShippingZoneType; profileRef: string }) {
  const isLocal = zoneType === 'local_delivery';
  const isPickup = zoneType === 'pickup';
  const noun = isPickup ? 'pickup location' : isLocal ? 'delivery area' : 'zone';
  const { store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);
  const { zones, loading, error, refetch, update, remove } = useStoreShippingZones(storeId, zoneType, profileRef);
  const [formZone, setFormZone] = useState<ShippingZone | null | undefined>(undefined);
  const [formPrefill, setFormPrefill] = useState<{ country: string; province: string; regionName: string } | null>(null);
  const [deleteZone, setDeleteZone] = useState<ShippingZone | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteZone) return;
    setDeleting(true);
    try {
      await remove(deleteZone._id);
      setDeleteZone(null);
    } finally {
      setDeleting(false);
    }
  };

  // Shopify region cards: several named rates (Standard / Express / by weight) under one country + province.
  const regions = isLocal || isPickup ? null : groupZonesByRegion(zones);
  const renderRow = (zone: ShippingZone, nested = false) => {
            const menuItems: ActionMenuItem[] = [
              { label: 'Edit', onClick: () => { setFormPrefill(null); setFormZone(zone); } },
              { label: zone.status === 'active' ? 'Deactivate' : 'Activate', onClick: () => update(zone._id, { status: zone.status === 'active' ? 'inactive' : 'active' }) },
              { label: 'Delete', onClick: () => setDeleteZone(zone), danger: true },
            ];
            return (
              <div key={zone._id} className={nested ? 'px-4 sm:px-[22px] py-3 border-t border-bone' : 'bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-[18px]'}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-carbon mb-[3px]">
                      {zone.name ? `${zone.name} · ` : ''}{isPickup ? (zone.pickupAddress ?? '') : isLocal ? zone.city : `${zone.city}${zone.province ? `, ${zone.province}` : ''}`}
                    </p>
                    <p className="text-xs text-slate">
                      {!isLocal && !isPickup && `${zone.country} · `}
                      {isPickup
                        ? (zone.estimatedDeliveryTime ? `Ready in ${zone.estimatedDeliveryTime}` : 'No ready time set')
                        : (zone.estimatedDeliveryTime ? `Est. delivery ${zone.estimatedDeliveryTime}` : 'No ETA set')}
                      {zone.minOrderAmount != null && zone.minOrderAmount > 0 && ` · Min order ${symbol}${fmt2(zone.minOrderAmount)}`}
                      {zone.postalCodes && zone.postalCodes.length > 0 && ` · ${zone.postalCodes.length} postcode${zone.postalCodes.length === 1 ? '' : 's'}`}
                      {zone.freeShippingThreshold != null && ` · Free over ${symbol}${fmt2(zone.freeShippingThreshold)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-brand-orange">
                      {isPickup ? 'Free'
                        : zone.rateType === 'weight' || zone.rateType === 'price' ? `By ${zone.rateType} · ${zone.rateTiers?.length ?? 0} tiers`
                        : `${symbol}${fmt2(zone.shippingPrice)}`}
                    </span>
                    <span className={`px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold ${zone.status === 'active' ? 'bg-[#e3f4ea] text-[#1e7a3c]' : 'bg-bone text-slate'}`}>
                      {zone.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <ActionMenu items={menuItems} />
                  </div>
                </div>
              </div>
            );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-carbon">{isPickup ? 'Pickup locations' : isLocal ? 'Delivery areas' : 'Your shipping zones'}</p>
          <p className="text-xs text-slate mt-0.5">
            {isPickup
              ? 'Let buyers collect their order from you for free — shown as a shipping option at checkout.'
              : isLocal
              ? 'Offer a flat local-delivery rate for a specific area — shown to buyers as another shipping option at checkout.'
              : 'Your own rates (flat, by weight or by order price) — shown to your buyers at checkout.'}
          </p>
        </div>
        <Button icon={<Plus size={13} />} size="sm" onClick={() => { setFormPrefill(null); setFormZone(null); }}>
          {isPickup ? 'Add Location' : isLocal ? 'Add Area' : 'Add Zone'}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3.5">
          {[1, 2].map(i => <SkeletonBox key={i} height={80} rounded="10px" />)}
        </div>
      ) : error ? (
        <div className="bg-white border border-bone rounded-[10px] px-5 py-8 text-center">
          <p className="text-[13px] text-error mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
        </div>
      ) : zones.length === 0 ? (
        <EmptyState
          icon={<MapPin size={28} className="text-slate/50" />}
          title={isPickup ? 'No pickup locations yet' : isLocal ? 'No delivery areas yet' : 'No shipping zones yet'}
          description={isPickup ? 'Add a location so buyers can pick their order up in person.' : isLocal ? 'Add an area to offer local delivery to nearby buyers.' : 'Add a zone to set your shipping rates. Until you do, buyers can\'t pick a shipping method at checkout.'}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {regions
            ? regions.map(region => (
                <div key={region.key} className="bg-white border border-bone rounded-[10px] overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-[22px] py-3 bg-fog">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-carbon truncate">{region.label}</p>
                      <p className="text-xs text-slate">{region.country}{region.province ? ` · ${region.province}` : ''} · {region.zones.length} rate{region.zones.length === 1 ? '' : 's'}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Plus size={13} />}
                      onClick={() => { setFormPrefill({ country: region.country, province: region.province, regionName: region.regionName }); setFormZone(null); }}
                    >
                      Add rate
                    </Button>
                  </div>
                  {region.zones.map(z => renderRow(z, true))}
                </div>
              ))
            : zones.map(z => renderRow(z))}
        </div>
      )}

      {formZone !== undefined && (
        <ZoneFormModal
          storeId={storeId}
          zoneType={zoneType}
          zone={formZone}
          profileRef={profileRef}
          prefill={formPrefill}
          onClose={() => setFormZone(undefined)}
          onSaved={refetch}
        />
      )}
      {deleteZone && (
        <ConfirmDialog
          title={`Delete ${noun}`}
          message={`Remove "${deleteZone.name || deleteZone.city || deleteZone.pickupAddress}"? Buyers will no longer be able to select this ${isPickup ? 'pickup location' : isLocal ? 'delivery area' : 'shipping option'} at checkout.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteZone(null)}
          loading={deleting}
        />
      )}
    </>
  );
}

// ── Carriers tab ─────────────────────────────────────────────────────────────
function CarriersTab({ storeId }: { storeId: string }) {
  const { carriers, loading, error, refetch, update, remove } = useShippingCarriers(storeId);
  const [formCarrier, setFormCarrier] = useState<ShippingCarrier | null | undefined>(undefined);
  const [deleteCarrier, setDeleteCarrier] = useState<ShippingCarrier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteCarrier) return;
    setDeleting(true);
    try {
      await remove(deleteCarrier._id);
      setDeleteCarrier(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-carbon">Your carriers</p>
          <p className="text-xs text-slate mt-0.5">
            Saved here, these show up as quick-pick options — with an auto-built tracking link — when you mark an order as shipped in Orders.
          </p>
        </div>
        <Button icon={<Plus size={13} />} size="sm" onClick={() => setFormCarrier(null)}>Add Carrier</Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3.5">
          {[1, 2].map(i => <SkeletonBox key={i} height={64} rounded="10px" />)}
        </div>
      ) : error ? (
        <div className="bg-white border border-bone rounded-[10px] px-5 py-8 text-center">
          <p className="text-[13px] text-error mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
        </div>
      ) : carriers.length === 0 ? (
        <EmptyState icon={<Truck size={28} className="text-slate/50" />} title="No carriers yet" description="Add the couriers you actually ship with — e.g. TCS, Leopards, DHL." />
      ) : (
        <div className="flex flex-col gap-3">
          {carriers.map(c => (
            <div key={c._id} className="bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-[14px] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-carbon mb-[2px]">{c.name}</p>
                {c.trackingUrlTemplate ? (
                  <p className="text-xs text-slate flex items-center gap-1 truncate"><Link2 size={11} className="shrink-0" /> {c.trackingUrlTemplate}</p>
                ) : (
                  <p className="text-xs text-slate/70">No tracking URL template</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={c.isActive} onChange={v => update(c._id, { isActive: v })} ariaLabel={`${c.isActive ? 'Deactivate' : 'Activate'} ${c.name}`} size="sm" />
                <button type="button" onClick={() => setFormCarrier(c)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-0 cursor-pointer text-slate hover:bg-fog hover:text-carbon" aria-label={`Edit ${c.name}`}>
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => setDeleteCarrier(c)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-0 cursor-pointer text-slate hover:bg-[#FDECEA] hover:text-error" aria-label={`Delete ${c.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formCarrier !== undefined && (
        <CarrierFormModal storeId={storeId} carrier={formCarrier} onClose={() => setFormCarrier(undefined)} onSaved={refetch} />
      )}
      {deleteCarrier && (
        <ConfirmDialog
          title="Delete carrier"
          message={`Remove "${deleteCarrier.name}"? It'll no longer appear as a quick-pick option when marking an order as shipped.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteCarrier(null)}
          loading={deleting}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SellerShipping() {
  usePageTitle('Shipping');
  const { storeId } = useStoreWorkspace();
  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs('zones');
  // Shopify shipping profile whose rates are being managed ('general' = the default profile).
  const [profileRef, setProfileRef] = useState('general');
  const [showProfiles, setShowProfiles] = useState(false);
  const { data: profilesData, error: profilesError, refetch: refetchProfiles } = useShippingProfiles(storeId);
  const activeProfile = profilesData?.profiles.find(p => (p.isGeneral ? 'general' : p._id) === profileRef);
  // The selected profile may have been deleted in the manager.
  useEffect(() => {
    if (profilesData && profileRef !== 'general' && !profilesData.profiles.some(p => p._id === profileRef)) setProfileRef('general');
  }, [profilesData, profileRef]);
  const showProfileBar = activeTab === 'zones' || activeTab === 'local' || activeTab === 'pickup';

  return (
    <>
      <StorePageHeader
        title="Shipping"
        subtitle="Your own shipping zones, local delivery, and carriers — used at your store's checkout."
      />

      <div className="px-4 lg:px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Tab bar ── */}
        <div className="border-b border-bone overflow-x-auto -mx-7 px-7 sm:mx-0 sm:px-0 sm:overflow-visible">
          <div className="flex items-center gap-0 w-max sm:w-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] cursor-pointer border-none bg-transparent transition-all duration-[120ms] -mb-px whitespace-nowrap shrink-0"
                style={{
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  borderBottom: `2px solid ${activeTab === tab.id ? '#D97757' : 'transparent'}`,
                  color: activeTab === tab.id ? '#B95A3A' : '#8C8A82',
                }}
              >
                <tab.Icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {showProfileBar && (
          <div className="bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] text-slate">Shipping profile</p>
              {profilesError ? (
                <p className="text-[12px] text-error">{profilesError} <button type="button" className="underline cursor-pointer bg-transparent border-none text-error" onClick={refetchProfiles}>Retry</button></p>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={profileRef} onChange={e => setProfileRef(e.target.value)} aria-label="Shipping profile">
                    {(profilesData?.profiles ?? []).map(p => <option key={p._id} value={p.isGeneral ? 'general' : p._id}>{p.name}</option>)}
                    {!profilesData && <option value="general">General profile</option>}
                  </Select>
                  {activeProfile && <span className="text-[11.5px] text-slate whitespace-nowrap">{activeProfile.productCount} product{activeProfile.productCount === 1 ? '' : 's'}</span>}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => setShowProfiles(true)} disabled={!profilesData}>Manage profiles</Button>
          </div>
        )}

        {isVisited('zones')    && <div className={paneClassName('zones')}><ZoneList storeId={storeId} zoneType="shipping" profileRef={profileRef} /></div>}
        {isVisited('local')    && <div className={paneClassName('local')}><ZoneList storeId={storeId} zoneType="local_delivery" profileRef={profileRef} /></div>}
        {isVisited('pickup')   && <div className={paneClassName('pickup')}><ZoneList storeId={storeId} zoneType="pickup" profileRef={profileRef} /></div>}
        {isVisited('carriers') && <div className={paneClassName('carriers')}><CarriersTab storeId={storeId} /></div>}

        {showProfiles && profilesData && (
          <ShippingProfilesPanel
            storeId={storeId}
            data={profilesData}
            onChanged={refetchProfiles}
            onClose={() => setShowProfiles(false)}
          />
        )}

        {activeTab === 'labels' && (
          <div className="bg-white border border-bone rounded-[10px] px-6 py-10 flex flex-col items-center text-center gap-2">
            <AlertCircle size={24} className="text-slate/60" />
            <p className="text-[13px] font-semibold text-carbon">Labels are bought from each order</p>
            <p className="text-xs text-slate max-w-[460px] leading-relaxed">
              Connect your Shippo account in Integrations, then open an order and use "Buy shipping label" — the cheapest available rate is purchased, the order is marked shipped and the tracking number is saved. If you ship with your own courier instead, add the tracking number from the order page: pick a carrier from the Carriers tab above and the tracking link is built automatically.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
