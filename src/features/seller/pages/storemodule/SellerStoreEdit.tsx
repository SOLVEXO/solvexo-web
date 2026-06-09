import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, Check, Loader, AlertTriangle, ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useGetStore } from '@/hooks/store/useGetStore';
import { useUpdateStore } from '@/hooks/store/useUpdateStore';
import type { ProductType } from '@/api/store';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRODUCT_TYPE_OPTIONS: { id: ProductType; label: string }[] = [
  { id: 'physical_products', label: 'Physical Products'   },
  { id: 'digital_downloads', label: 'Digital Downloads'   },
  { id: 'services',          label: 'Services / Bookings' },
  { id: 'in_person_pos',     label: 'In-Person / POS'    },
];

const CATEGORIES = [
  'Education & Learning', 'Art & Design', 'Handmade & Crafts',
  'Digital Downloads', 'Home & Lifestyle', 'Business & Productivity',
  'Fashion & Apparel', 'Technology', 'Arts & Crafts',
];

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#2C2A28',
  marginBottom: 6, fontFamily: "'Poppins', sans-serif",
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #E8E6DC', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: "'Poppins', sans-serif", color: '#2C2A28',
};

// ── Page ──────────────────────────────────────────────────────────────────────
export function SellerStoreEdit() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const { store: fetched, loading: fetchLoading, error: fetchError } = useGetStore(id);
  const update = useUpdateStore();

  const [initialized, setInitialized] = useState(false);
  const [name,         setName]         = useState('');
  const [logo,         setLogo]         = useState('');
  const [categoryId,   setCategoryId]   = useState('');
  const [description,  setDescription]  = useState('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // Initialize form once data arrives
  if (!initialized && fetched) {
    setName(fetched.name ?? '');
    setLogo(fetched.logo ?? '');
    setCategoryId(fetched.categoryId ?? '');
    setDescription(fetched.description ?? '');
    setProductTypes(fetched.productTypes ?? []);
    setInitialized(true);
  }

  const toggleType = (tid: ProductType) =>
    setProductTypes(prev => prev.includes(tid) ? prev.filter(x => x !== tid) : [...prev, tid]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!fetched) return;
    const result = await update.execute({
      storeId: fetched._id,
      name,
      logo,
      categoryId,
      description,
      productTypes,
    });
    if (result) navigate(`/seller/stores/${id}`);
  };

  // ── Loading ──
  if (fetchLoading) {
    return (
      <>
        <SellerPageHeader title="Edit Store" />
        <div style={{ padding: '20px 28px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E6DC', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="animate-pulse" style={{ width: 200, height: 20, borderRadius: 6, background: '#EDEBE2', marginBottom: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="animate-pulse" style={{ height: 42, borderRadius: 8, background: '#EDEBE2' }} />
              <div className="animate-pulse" style={{ height: 42, borderRadius: 8, background: '#EDEBE2' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Error ──
  if (fetchError || !fetched) {
    return (
      <>
        <SellerPageHeader title="Edit Store" subtitle="Could not load store." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 28px', color: '#C13030' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>{fetchError || 'Store not found.'}</span>
        </div>
      </>
    );
  }

  // ── Form ──
  return (
    <>
      <SellerPageHeader
        title={`Edit — ${fetched.name}`}
        subtitle={`/${fetched.slug}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(`/seller/stores/${id}`)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ArrowLeft size={14} /> Back to Store
            </span>
          </Button>
        }
      />

      <div style={{ padding: '20px 28px' }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E8E6DC',
          borderRadius: 12, padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Logo Upload ── */}
            <div>
              <label style={labelStyle}>Store Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Preview */}
                <div style={{
                  width: 80, height: 80, borderRadius: 14, flexShrink: 0,
                  background: '#FBECE4', border: '1px solid #EDEBE2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'relative',
                }}>
                  {logo
                    ? <img src={logo} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Store size={30} style={{ color: '#D97757' }} />
                  }
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#C13030', border: '2px solid #FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0,
                      }}
                    >
                      <X size={10} style={{ color: '#FFFFFF' }} />
                    </button>
                  )}
                </div>

                {/* Upload button */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid #D97757', background: '#FBECE4',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  color: '#B95A3A', fontFamily: "'Poppins', sans-serif",
                  transition: 'background 0.15s',
                }}>
                  <Upload size={13} />
                  {logo ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div style={{ height: 1, background: '#E8E6DC' }} />

            {/* ── Name + Category ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Store Name</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* ── Description ── */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* ── Product Types ── */}
            <div>
              <label style={labelStyle}>Product Types</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {PRODUCT_TYPE_OPTIONS.map(({ id: tid, label }) => {
                  const on = productTypes.includes(tid);
                  return (
                    <button key={tid} type="button" onClick={() => toggleType(tid)} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      border: `1.5px solid ${on ? '#D97757' : '#E8E6DC'}`,
                      background: on ? '#FBECE4' : '#FFFFFF',
                      color: on ? '#B95A3A' : '#8C8A82',
                      transition: 'all 0.15s', fontFamily: "'Poppins', sans-serif",
                    }}>
                      {on && <Check size={11} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Error ── */}
            {update.error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 8, background: '#FFF2F2', border: '1px solid #FDDEDE',
              }}>
                <AlertTriangle size={14} style={{ color: '#C13030', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#C13030', fontFamily: "'Poppins', sans-serif" }}>{update.error}</span>
              </div>
            )}

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <Button variant="primary" size="md" onClick={handleSave} disabled={update.loading}>
                {update.loading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Loader size={13} /> Saving…</span>
                  : 'Save Changes'}
              </Button>
              <Button variant="ghost" size="md" onClick={() => navigate(`/seller/stores/${id}`)} disabled={update.loading}>
                Cancel
              </Button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
