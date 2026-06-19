import { useState, useEffect } from 'react';
import { Save, Store, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { apiUpdateStore, type ProductType } from '@/api/commerce/store';
import { ImageUpload } from '@/components/comman/ui';

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  physical_products: 'Physical Products',
  digital_downloads: 'Digital Downloads',
  services:          'Services',
  in_person_pos:     'In-Person / POS',
};
const ALL_PRODUCT_TYPES: ProductType[] = [
  'physical_products', 'digital_downloads', 'services', 'in_person_pos',
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SettingsSkeleton() {
  const box = (w: string, h: number) => (
    <div className="animate-pulse rounded-[6px] bg-bone" style={{ width: w, height: h }} />
  );
  return (
    <div className="px-7 py-6">
      <div className="bg-white rounded-xl p-6 border border-bone max-w-[600px]">
        {[1,2,3,4].map(i => (
          <div key={i} className="mb-5">
            {box('100px', 12)}<div className="mt-2">{box('100%', 38)}</div>
          </div>
        ))}
        {box('120px', 36)}
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="text-[12px] font-semibold text-charcoal block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-[9px] rounded-lg text-[13px] border border-bone bg-bone text-charcoal outline-none box-border";

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreSettings() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();

  const [name,         setName]         = useState('');
  const [description,  setDescription]  = useState('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [logo,         setLogo]         = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  // Sync form when store loads
  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setDescription(store.description ?? '');
    setProductTypes(store.productTypes ?? []);
    setLogo(store.logo ?? '');
  }, [store]);

  const toggleType = (t: ProductType) =>
    setProductTypes(prev => prev.includes(t) ? prev.filter(p => p !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, name, description, productTypes, logo });
      refetch();
      setSaveMsg({ ok: true, text: 'Store updated successfully.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update store.' });
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    !!store &&
    (name !== store.name ||
      description !== (store.description ?? '') ||
      logo !== (store.logo ?? '') ||
      JSON.stringify(productTypes.slice().sort()) !==
        JSON.stringify((store.productTypes ?? []).slice().sort()));

  return (
    <div>
      <StorePageHeader
        title="Store Settings"
        subtitle={store?.name ?? ''}
        actions={
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="flex items-center gap-[7px] px-[18px] py-2 rounded-lg border-none text-[13px] font-semibold transition-all duration-150"
            style={{
              background: isDirty && !saving ? '#D97757' : '#E8E6DC',
              color: isDirty && !saving ? '#fff' : '#8C8A82',
              cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        }
      />

      {loading ? <SettingsSkeleton /> : (
        <div className="px-7 py-6">

          {/* Status message */}
          {saveMsg && (
            <div
              className="flex items-center gap-2 px-[14px] py-[10px] rounded-lg mb-[18px] text-[13px] border"
              style={{
                background: saveMsg.ok ? '#F0FDF4' : '#FFF1F2',
                borderColor: saveMsg.ok ? '#BBF7D0' : '#FECDD3',
                color: saveMsg.ok ? '#166534' : '#991B1B',
              }}
            >
              {saveMsg.ok
                ? <CheckCircle size={15} />
                : <AlertCircle size={15} />}
              {saveMsg.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5 items-start">

            {/* Left column */}
            <div className="bg-white rounded-xl p-6 border border-bone">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-[30px] h-[30px] rounded-lg bg-brand-pale-orange flex items-center justify-center">
                  <Store size={15} className="text-brand-orange" />
                </div>
                <p className="text-[14px] font-semibold text-charcoal">Basic Information</p>
              </div>

              <Field label="Store Logo">
                <div className="flex items-center gap-4">
                  <ImageUpload
                    value={logo ? [logo] : []}
                    onChange={urls => setLogo(urls[0] ?? '')}
                    maxFiles={1}
                  />
                  <div>
                    <p className="text-[12px] text-charcoal font-medium">Upload a logo</p>
                    <p className="text-[11px] text-slate mt-0.5">PNG, JPG or WebP</p>
                  </div>
                </div>
              </Field>

              <Field label="Store Name *">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your store name"
                  className={inputCls}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your store…"
                  rows={4}
                  className={`${inputCls} resize-y min-h-[90px]`}
                />
              </Field>

              <Field label="Store URL">
                <input
                  value={store?.slug ?? ''}
                  readOnly
                  className={`${inputCls} text-slate cursor-default bg-[#F3F2EC]`}
                />
                <p className="text-[10px] text-slate mt-1">URL slug cannot be changed.</p>
              </Field>

              <Field label="Plan">
                <input
                  value={store?.plan ?? ''}
                  readOnly
                  className={`${inputCls} text-slate cursor-default bg-[#F3F2EC]`}
                />
              </Field>
            </div>

            {/* Right column */}
            <div className="bg-white rounded-xl p-6 border border-bone">
              <p className="text-[14px] font-semibold text-charcoal mb-2">Product Types</p>
              <p className="text-[11px] text-slate mb-4">What kind of products will you sell?</p>

              <div className="flex flex-col gap-2.5">
                {ALL_PRODUCT_TYPES.map(t => {
                  const active = productTypes.includes(t);
                  return (
                    <div
                      key={t}
                      onClick={() => toggleType(t)}
                      className="flex items-center gap-3 px-[14px] py-3 rounded-[9px] cursor-pointer transition-all duration-150 border"
                      style={{
                        borderColor: active ? '#D97757' : '#E8E6DC',
                        background: active ? '#FBECE4' : '#FAF9F5',
                      }}
                    >
                      <div
                        className="w-[18px] h-[18px] rounded-[5px] shrink-0 flex items-center justify-center"
                        style={{
                          border: `2px solid ${active ? '#D97757' : '#CBCABA'}`,
                          background: active ? '#D97757' : 'transparent',
                        }}
                      >
                        {active && <CheckCircle size={11} className="text-white" />}
                      </div>
                      <span
                        className="text-[13px]"
                        style={{ fontWeight: active ? 600 : 400, color: active ? '#D97757' : '#141413' }}
                      >
                        {PRODUCT_TYPE_LABELS[t]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Read-only info */}
              <div className="mt-6 border-t border-bone pt-[18px]">
                <p className="text-[12px] font-semibold text-charcoal mb-3">Store Info</p>
                {[
                  { label: 'Status',   value: store?.status   ?? '—' },
                  { label: 'Seller',   value: store?.sellerType ?? '—' },
                  { label: 'AI Credits', value: String(store?.aiCredits ?? 0) },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-[12px] py-1.5 border-b border-[#F3F2EC]">
                    <span className="text-slate">{r.label}</span>
                    <span className="font-semibold text-charcoal">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
