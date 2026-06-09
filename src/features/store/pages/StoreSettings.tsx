import { useState, useEffect } from 'react';
import { Save, Store, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { apiUpdateStore, type ProductType } from '@/api/store';

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
  const box = (w: number | string, h: number) => (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: 6, background: '#E8E6DC' }} />
  );
  return (
    <div style={{ padding: '24px 28px', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E8E6DC', maxWidth: 600 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ marginBottom: 20 }}>
            {box(100, 12)}<div style={{ marginTop: 8 }}>{box('100%', 38)}</div>
          </div>
        ))}
        {box(120, 36)}
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#141413', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  border: '1px solid #E8E6DC', background: '#FAF9F5', color: '#141413',
  outline: 'none', fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box',
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreSettings() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();

  const [name,         setName]         = useState('');
  const [description,  setDescription]  = useState('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  // Sync form when store loads
  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setDescription(store.description ?? '');
    setProductTypes(store.productTypes ?? []);
  }, [store]);

  const toggleType = (t: ProductType) =>
    setProductTypes(prev => prev.includes(t) ? prev.filter(p => p !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, name, description, productTypes });
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
      JSON.stringify(productTypes.slice().sort()) !==
        JSON.stringify((store.productTypes ?? []).slice().sort()));

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <StorePageHeader
        title="Store Settings"
        subtitle={store?.name ?? ''}
        actions={
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: isDirty && !saving ? '#D97757' : '#E8E6DC',
              color: isDirty && !saving ? '#fff' : '#8C8A82',
              fontSize: 13, fontWeight: 600, cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            Save Changes
          </button>
        }
      />

      {loading ? <SettingsSkeleton /> : (
        <div style={{ padding: '24px 28px' }}>

          {/* Status message */}
          {saveMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 8, marginBottom: 18,
              background: saveMsg.ok ? '#F0FDF4' : '#FFF1F2',
              border: `1px solid ${saveMsg.ok ? '#BBF7D0' : '#FECDD3'}`,
              color: saveMsg.ok ? '#166534' : '#991B1B',
              fontSize: 13,
            }}>
              {saveMsg.ok
                ? <CheckCircle size={15} />
                : <AlertCircle size={15} />}
              {saveMsg.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* Left column */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E8E6DC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: '#FBECE4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Store size={15} style={{ color: '#D97757' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#141413' }}>Basic Information</p>
              </div>

              <Field label="Store Name *">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your store name"
                  style={INPUT_STYLE}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your store…"
                  rows={4}
                  style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 90 }}
                />
              </Field>

              <Field label="Store URL">
                <input
                  value={store?.slug ?? ''}
                  readOnly
                  style={{ ...INPUT_STYLE, color: '#8C8A82', cursor: 'default', background: '#F3F2EC' }}
                />
                <p style={{ fontSize: 10, color: '#8C8A82', marginTop: 4 }}>URL slug cannot be changed.</p>
              </Field>

              <Field label="Plan">
                <input
                  value={store?.plan ?? ''}
                  readOnly
                  style={{ ...INPUT_STYLE, color: '#8C8A82', cursor: 'default', background: '#F3F2EC' }}
                />
              </Field>
            </div>

            {/* Right column */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E8E6DC' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 8 }}>Product Types</p>
              <p style={{ fontSize: 11, color: '#8C8A82', marginBottom: 16 }}>What kind of products will you sell?</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ALL_PRODUCT_TYPES.map(t => {
                  const active = productTypes.includes(t);
                  return (
                    <div
                      key={t}
                      onClick={() => toggleType(t)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                        border: `1px solid ${active ? '#D97757' : '#E8E6DC'}`,
                        background: active ? '#FBECE4' : '#FAF9F5',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${active ? '#D97757' : '#CBCABA'}`,
                        background: active ? '#D97757' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {active && <CheckCircle size={11} style={{ color: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#D97757' : '#141413' }}>
                        {PRODUCT_TYPE_LABELS[t]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Read-only info */}
              <div style={{ marginTop: 24, borderTop: '1px solid #E8E6DC', paddingTop: 18 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#141413', marginBottom: 12 }}>Store Info</p>
                {[
                  { label: 'Status',   value: store?.status   ?? '—' },
                  { label: 'Seller',   value: store?.sellerType ?? '—' },
                  { label: 'AI Credits', value: String(store?.aiCredits ?? 0) },
                ].map(r => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, padding: '6px 0',
                    borderBottom: '1px solid #F3F2EC',
                  }}>
                    <span style={{ color: '#8C8A82' }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: '#141413' }}>{r.value}</span>
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
