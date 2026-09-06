import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { MapPin, Truck, Tag, PackageSearch, AlertCircle, Plus, Pencil, Trash2, Link2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStoreShippingZones } from '@/hooks/shipping/useStoreShippingZones';
import { useShippingCarriers } from '@/hooks/shipping/useShippingCarriers';
import { Button, SkeletonBox, EmptyState, Modal, Field, Input, Select, Toggle, ActionMenu, type ActionMenuItem } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import type { ShippingZone, ShippingCarrier } from '@/api/services/shipping';
import { currencySymbol, fmt2 } from '@/utils/currency';

// ── Data ──────────────────────────────────────────────────────────────────────
const TABS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 'zones',    Icon: MapPin,        label: 'Zones'              },
  { id: 'local',    Icon: PackageSearch, label: 'Local Delivery'     },
  { id: 'carriers', Icon: Truck,         label: 'Carriers'           },
  { id: 'labels',   Icon: Tag,           label: 'Labels & Tracking'  },
];

// ── Zone create/edit modal (Zones tab: full country/province/city; Local
// Delivery tab: just a delivery-area name, no country/province) ─────────────
function ZoneFormModal({ storeId, zoneType, zone, onClose, onSaved }: {
  storeId: string;
  zoneType: 'shipping' | 'local_delivery';
  zone?: ShippingZone | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!zone;
  const isLocal = zoneType === 'local_delivery';
  const { store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);
  const { create, update } = useStoreShippingZones(storeId, zoneType);
  const [country, setCountry] = useState(zone?.country ?? (isLocal ? 'Local Delivery' : ''));
  const [province, setProvince] = useState(zone?.province ?? '');
  const [city, setCity] = useState(zone?.city ?? '');
  const [price, setPrice] = useState(String(zone?.shippingPrice ?? ''));
  const [eta, setEta] = useState(zone?.estimatedDeliveryTime ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(zone?.status ?? 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!isLocal && !country.trim()) { setError('Country is required.'); return; }
    if (!city.trim()) { setError(isLocal ? 'Delivery area is required.' : 'City is required.'); return; }
    const priceNum = Number(price);
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) { setError('Enter a valid price.'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        country: isLocal ? 'Local Delivery' : country.trim(),
        province: isLocal ? undefined : (province.trim() || undefined),
        city: city.trim(),
        shippingPrice: priceNum,
        estimatedDeliveryTime: eta.trim() || undefined,
        status,
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
      title={isEdit ? `Edit ${isLocal ? 'delivery area' : 'zone'}` : `New ${isLocal ? 'delivery area' : 'shipping zone'}`}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>{isEdit ? 'Save' : 'Create'}</Button>
      </>}
    >
      {error && <p className="text-[12px] text-error mb-3">{error}</p>}
      {!isLocal && (
        <Field label="Country" required>
          <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Pakistan" />
        </Field>
      )}
      {!isLocal && (
        <Field label="Province / State" hint="Optional">
          <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="Sindh" />
        </Field>
      )}
      <Field label={isLocal ? 'Delivery area' : 'City'} required>
        <Input value={city} onChange={e => setCity(e.target.value)} placeholder={isLocal ? 'e.g. DHA Phase 6' : 'Karachi'} />
      </Field>
      <Field label={`Price (${symbol})`} required hint={`In your store's own currency — ${store?.baseCurrency ?? 'PKR'}.`}>
        <Input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} placeholder="200" />
      </Field>
      <Field label="Estimated delivery time" hint="Optional, e.g. 2-4 Days">
        <Input value={eta} onChange={e => setEta(e.target.value)} placeholder="2-4 Days" />
      </Field>
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
function ZoneList({ storeId, zoneType }: { storeId: string; zoneType: 'shipping' | 'local_delivery' }) {
  const isLocal = zoneType === 'local_delivery';
  const { store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);
  const { zones, loading, error, refetch, update, remove } = useStoreShippingZones(storeId, zoneType);
  const [formZone, setFormZone] = useState<ShippingZone | null | undefined>(undefined);
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

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-carbon">{isLocal ? 'Delivery areas' : 'Your shipping zones'}</p>
          <p className="text-xs text-slate mt-0.5">
            {isLocal
              ? 'Offer a flat local-delivery rate for a specific area — shown to buyers as another shipping option at checkout.'
              : 'Real, per-store rates — shown to your own buyers at checkout instead of the platform default.'}
          </p>
        </div>
        <Button icon={<Plus size={13} />} size="sm" onClick={() => setFormZone(null)}>
          {isLocal ? 'Add Area' : 'Add Zone'}
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
          title={isLocal ? 'No delivery areas yet' : 'No shipping zones yet'}
          description={isLocal ? 'Add an area to offer local delivery to nearby buyers.' : 'Add a zone to set your own real shipping rates. Until you do, buyers checking out on your store see the platform default zones.'}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {zones.map(zone => {
            const menuItems: ActionMenuItem[] = [
              { label: 'Edit', onClick: () => setFormZone(zone) },
              { label: zone.status === 'active' ? 'Deactivate' : 'Activate', onClick: () => update(zone._id, { status: zone.status === 'active' ? 'inactive' : 'active' }) },
              { label: 'Delete', onClick: () => setDeleteZone(zone), danger: true },
            ];
            return (
              <div key={zone._id} className="bg-white border border-bone rounded-[10px] px-4 sm:px-[22px] py-[18px]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-carbon mb-[3px]">
                      {isLocal ? zone.city : `${zone.city}${zone.province ? `, ${zone.province}` : ''}`}
                    </p>
                    <p className="text-xs text-slate">
                      {!isLocal && `${zone.country} · `}{zone.estimatedDeliveryTime ? `Est. delivery ${zone.estimatedDeliveryTime}` : 'No ETA set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-brand-orange">{symbol}{fmt2(zone.shippingPrice)}</span>
                    <span className={`px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold ${zone.status === 'active' ? 'bg-[#e3f4ea] text-[#1e7a3c]' : 'bg-bone text-slate'}`}>
                      {zone.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <ActionMenu items={menuItems} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formZone !== undefined && (
        <ZoneFormModal
          storeId={storeId}
          zoneType={zoneType}
          zone={formZone}
          onClose={() => setFormZone(undefined)}
          onSaved={refetch}
        />
      )}
      {deleteZone && (
        <ConfirmDialog
          title={`Delete ${isLocal ? 'delivery area' : 'zone'}`}
          message={`Remove "${deleteZone.city}"? Buyers will no longer be able to select this ${isLocal ? 'delivery area' : 'shipping option'} at checkout.`}
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
  const [activeTab, setActiveTab] = useState('zones');

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

        {activeTab === 'zones' && <ZoneList storeId={storeId} zoneType="shipping" />}
        {activeTab === 'local' && <ZoneList storeId={storeId} zoneType="local_delivery" />}
        {activeTab === 'carriers' && <CarriersTab storeId={storeId} />}

        {activeTab === 'labels' && (
          <div className="bg-white border border-bone rounded-[10px] px-6 py-10 flex flex-col items-center text-center gap-2">
            <AlertCircle size={24} className="text-slate/60" />
            <p className="text-[13px] font-semibold text-carbon">Buying & printing shipping labels isn't available yet</p>
            <p className="text-xs text-slate max-w-[420px] leading-relaxed">
              Real label purchase/printing needs a connected carrier account (e.g. USPS, UPS, FedEx — typically via a service like EasyPost or Shippo). Solvexo isn't connected to one yet, so this tab intentionally doesn't fake it. Once your parcel is booked with a courier yourself, add the tracking number from the Orders page — pick a carrier from the Carriers tab above and the tracking link is built automatically.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
