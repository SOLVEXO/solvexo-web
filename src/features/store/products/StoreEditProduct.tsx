import { useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Package, Download } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import {
  apiGetMyProductById,
  apiEditPhysicalProduct, apiEditDigitalProduct,
  type StoreProduct, type ProductVariant,
} from '@/api/commerce/product';
import { getCachedProducts, updateCachedProduct, type ProductEntry } from './_cache';

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT   = "'Poppins', sans-serif";
const ACCENT = '#D97757';
const BORDER = '#E8E6DC';
const MUTED  = '#8C8A82';

type ProductStatus = 'draft' | 'active';

// ── Shared UI (same as Add page) ──────────────────────────────────────────────
const inputSt: CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: `1px solid ${BORDER}`, borderRadius: 8, outline: 'none',
  fontFamily: FONT, color: '#2C2A28', background: '#fff', boxSizing: 'border-box',
};
const textareaSt: CSSProperties = { ...inputSt, resize: 'vertical', minHeight: 82 };
const cardSt: CSSProperties = {
  background: '#fff', border: `1px solid ${BORDER}`,
  borderRadius: 10, padding: '20px 22px', marginBottom: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', display: 'block', marginBottom: 5, fontFamily: FONT }}>
        {label}{required && <span style={{ color: ACCENT }}> *</span>}
      </label>
      {children}
    </div>
  );
}
function SectionTitle({ title }: { title: string }) {
  return <p style={{ fontSize: 13, fontWeight: 700, color: '#141413', marginBottom: 14, fontFamily: FONT }}>{title}</p>;
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11, background: checked ? ACCENT : '#D1D5DB',
      border: 'none', cursor: 'pointer', padding: 0, position: 'relative', transition: 'background 0.18s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 0.18s' }} />
    </button>
  );
}
function TagInput({ tags, input, onInput, onAdd, onRemove }: {
  tags: string[]; input: string;
  onInput: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
}) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 5, background: '#fff' }}>
      {tags.map((t, i) => (
        <span key={i} style={{ background: '#FAF9F5', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '2px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
          {t}
          <button type="button" onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: MUTED, fontSize: 14, lineHeight: 1 }}>×</button>
        </span>
      ))}
      <input value={input} onChange={e => onInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(); } }}
        placeholder={tags.length === 0 ? 'Add tags, press Enter' : ''}
        style={{ border: 'none', outline: 'none', fontSize: 12, fontFamily: FONT, flex: '1 1 80px', minWidth: 80, background: 'transparent' }} />
    </div>
  );
}
function StatusRow({ status, onStatus }: { status: ProductStatus; onStatus: (v: ProductStatus) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['draft', 'active'] as const).map(s => (
        <button key={s} type="button" onClick={() => onStatus(s)} style={{
          flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontFamily: FONT,
          border: `1.5px solid ${status === s ? ACCENT : BORDER}`,
          background: status === s ? '#FBECE4' : '#fff', color: status === s ? ACCENT : MUTED,
          fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
        }}>{s}</button>
      ))}
    </div>
  );
}

// ── Form state types ──────────────────────────────────────────────────────────
const blankPhys = {
  name: '', description: '', price: '', compareAtPrice: '',
  stock: '', size: '', color: '', shippingWeight: '',
  status: 'draft' as ProductStatus, isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[],
};
const blankDig = {
  name: '', description: '', price: '', compareAtPrice: '',
  status: 'draft' as ProductStatus, isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[],
  fileUrl: '', fileName: '', fileSize: '', fileMime: '',
  downloadLimit: 'unlimited',
  linkExpiryDays: '', pdfStampingEnabled: false,
  licenseType: 'personal' as 'personal' | 'commercial',
  buyerDeliveryMessage: '',
};
type PhysForm = typeof blankPhys;
type DigForm  = typeof blankDig;

// ── Helpers to populate forms from API data ───────────────────────────────────
function physFormFromEntry(p: StoreProduct, v: ProductVariant): PhysForm {
  return {
    name: p.name, description: p.description,
    price: String(v.price),
    compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : '',
    stock: String(v.stock), size: v.size ?? '', color: v.color ?? '',
    shippingWeight: v.shippingWeight ?? '',
    status: p.status as ProductStatus, isListedOnSolvexo: p.isListedOnSolvexo,
    tags: [...p.tags], tagInput: '',
  };
}
function digFormFromEntry(p: StoreProduct, v: ProductVariant): DigForm {
  const d = p.digital;
  return {
    name: p.name, description: p.description,
    price: String(v.price),
    compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : '',
    status: p.status as ProductStatus, isListedOnSolvexo: p.isListedOnSolvexo,
    tags: [...p.tags], tagInput: '',
    fileUrl:  d?.files[0]?.url      ?? '',
    fileName: d?.files[0]?.name     ?? '',
    fileSize: d?.files[0]?.size != null ? String(d.files[0].size) : '',
    fileMime: d?.files[0]?.mimeType ?? '',
    downloadLimit:        d?.downloadLimit        ?? 'unlimited',
    linkExpiryDays:       d?.linkExpiryDays != null ? String(d.linkExpiryDays) : '',
    pdfStampingEnabled:   d?.pdfStampingEnabled   ?? false,
    licenseType:         (d?.licenseType as 'personal' | 'commercial') ?? 'personal',
    buyerDeliveryMessage: d?.buyerDeliveryMessage  ?? '',
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoreEditProduct() {
  const navigate             = useNavigate();
  const { state }            = useLocation() as { state: { entry?: ProductEntry } | null };
  const { productId = '' }   = useParams<{ productId: string }>();
  const { storeId }          = useStoreWorkspace();

  const [fetching,   setFetching]   = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [pType,      setPType]      = useState<'physical' | 'digital'>('physical');
  const [variantId,  setVariantId]  = useState<string | null>(null);
  const [phys,       setPhys]       = useState<PhysForm>(blankPhys);
  const [dig,        setDig]        = useState<DigForm>(blankDig);

  const sp = <K extends keyof PhysForm>(k: K, v: PhysForm[K]) => setPhys(f => ({ ...f, [k]: v }));
  const sd = <K extends keyof DigForm> (k: K, v: DigForm[K])  => setDig(f  => ({ ...f, [k]: v  }));

  // ── Load product on mount ──────────────────────────────────────────────────
  useEffect(() => {
    // 1. Try navigate state (fastest)
    const stateEntry = state?.entry;
    if (stateEntry) {
      init(stateEntry.product, stateEntry.variant);
      setFetching(false);
      return;
    }
    // 2. Try local cache
    const cached = getCachedProducts(storeId).find(e => e.product._id === productId);
    if (cached) {
      init(cached.product, cached.variant);
      setFetching(false);
      return;
    }
    // 3. Fetch from API
    apiGetMyProductById(productId)
      .then(res => {
        const p = res.data.product;
        // No variant from this endpoint — create a minimal stub
        const stub: ProductVariant = {
          _id: '', productId, sku: '', price: 0, compareAtPrice: null,
          size: null, color: null, stock: 0, shippingWeight: null,
          images: [], isDefault: true, status: 'active', isDelete: false,
          createdAt: '', updatedAt: '',
        };
        init(p, stub);
      })
      .catch(() => navigate(`/seller/store/${storeId}/products`, { replace: true }))
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function init(p: StoreProduct, v: ProductVariant) {
    setPType(p.productType);
    setVariantId(v._id || null);
    if (p.productType === 'physical') setPhys(physFormFromEntry(p, v));
    else                              setDig(digFormFromEntry(p, v));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      if (pType === 'physical') {
        const res = await apiEditPhysicalProduct(productId, {
          productId, name: phys.name, description: phys.description,
          subCategoryId: null, images: [], tags: phys.tags,
          isListedOnSolvexo: phys.isListedOnSolvexo, status: phys.status,
          price: Number(phys.price),
          compareAtPrice: phys.compareAtPrice ? Number(phys.compareAtPrice) : null,
          size: phys.size, color: phys.color,
          stock: Number(phys.stock), shippingWeight: phys.shippingWeight,
        });
        updateCachedProduct(storeId, productId, { product: res.data.product, variant: res.data.variant });
      } else {
        const files = dig.fileUrl ? [{
          url: dig.fileUrl,
          name: dig.fileName || dig.fileUrl.split('/').pop() || 'file',
          size: dig.fileSize ? Number(dig.fileSize) : 0,
          mimeType: dig.fileMime || 'application/octet-stream',
        }] : [];
        const res = await apiEditDigitalProduct(productId, {
          productId, variantId,
          name: dig.name, description: dig.description,
          status: dig.status, price: Number(dig.price),
          compareAtPrice: dig.compareAtPrice ? Number(dig.compareAtPrice) : null,
          digital: {
            files,
            downloadLimit:        dig.downloadLimit,
            linkExpiryDays:       dig.linkExpiryDays ? Number(dig.linkExpiryDays) : null,
            pdfStampingEnabled:   dig.pdfStampingEnabled,
            licenseType:          dig.licenseType,
            buyerDeliveryMessage: dig.buyerDeliveryMessage,
          },
        });
        updateCachedProduct(storeId, productId, { product: res.data.product, variant: res.data.variant });
      }
      navigate(`/seller/store/${storeId}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FAF9F5' }}>
        <Loader2 size={24} style={{ color: ACCENT, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const addTag = () => {
    if (pType === 'physical') {
      const v = phys.tagInput.replace(',', '').trim();
      if (v && !phys.tags.includes(v)) sp('tags', [...phys.tags, v]);
      sp('tagInput', '');
    } else {
      const v = dig.tagInput.replace(',', '').trim();
      if (v && !dig.tags.includes(v)) sd('tags', [...dig.tags, v]);
      sd('tagInput', '');
    }
  };

  return (
    <div style={{ fontFamily: FONT, background: '#FAF9F5', minHeight: '100vh' }}>
      {/* ── Page header ── */}
      <div style={{
        background: '#FFFFFF', borderBottom: `1px solid ${BORDER}`,
        padding: '14px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', gap: 5, padding: 0, fontSize: 13, fontFamily: FONT }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span style={{ color: BORDER, fontSize: 16 }}>|</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', lineHeight: 1.3 }}>Edit Product</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {pType === 'digital'
                ? <><Download size={12} style={{ color: MUTED }} /><span style={{ fontSize: 12, color: MUTED }}>Digital Product</span></>
                : <><Package  size={12} style={{ color: MUTED }} /><span style={{ fontSize: 12, color: MUTED }}>Physical Product</span></>}
            </div>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: saving ? '#E8E6DC' : ACCENT, color: saving ? MUTED : '#fff',
          border: 'none', borderRadius: 9, padding: '10px 20px',
          fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT,
        }}>
          {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Save Changes'}
        </button>
      </div>

      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div>
          {/* Basic info */}
          <div style={cardSt}>
            <SectionTitle title="Basic Information" />
            <Field label="Product Name" required>
              <input
                value={pType === 'physical' ? phys.name : dig.name}
                onChange={e => pType === 'physical' ? sp('name', e.target.value) : sd('name', e.target.value)}
                placeholder="Product name" style={inputSt} />
            </Field>
            <Field label="Description">
              <textarea
                value={pType === 'physical' ? phys.description : dig.description}
                onChange={e => pType === 'physical' ? sp('description', e.target.value) : sd('description', e.target.value)}
                placeholder="Describe your product…" style={{ ...textareaSt, marginBottom: 0 }} />
            </Field>
          </div>

          {/* Pricing */}
          <div style={cardSt}>
            <SectionTitle title="Pricing" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Price (Rs)" required>
                <input type="number" min="0"
                  value={pType === 'physical' ? phys.price : dig.price}
                  onChange={e => pType === 'physical' ? sp('price', e.target.value) : sd('price', e.target.value)}
                  placeholder="1500" style={inputSt} />
              </Field>
              <Field label="Compare At Price (Rs)">
                <input type="number" min="0"
                  value={pType === 'physical' ? phys.compareAtPrice : dig.compareAtPrice}
                  onChange={e => pType === 'physical' ? sp('compareAtPrice', e.target.value) : sd('compareAtPrice', e.target.value)}
                  placeholder="Original price" style={inputSt} />
              </Field>
            </div>
          </div>

          {/* Physical: Inventory */}
          {pType === 'physical' && (
            <div style={cardSt}>
              <SectionTitle title="Inventory & Shipping" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="Stock" required>
                  <input type="number" min="0" value={phys.stock}
                    onChange={e => sp('stock', e.target.value)} placeholder="50" style={inputSt} />
                </Field>
                <Field label="Size">
                  <input value={phys.size} onChange={e => sp('size', e.target.value)} placeholder="L, XL…" style={inputSt} />
                </Field>
                <Field label="Color">
                  <input value={phys.color} onChange={e => sp('color', e.target.value)} placeholder="Red…" style={inputSt} />
                </Field>
              </div>
              <Field label="Shipping Weight">
                <input value={phys.shippingWeight} onChange={e => sp('shippingWeight', e.target.value)} placeholder="e.g. 0.3kg" style={inputSt} />
              </Field>
            </div>
          )}

          {/* Digital: File + Delivery */}
          {pType === 'digital' && (
            <>
              <div style={cardSt}>
                <SectionTitle title="Digital File" />
                <Field label="File URL">
                  <input value={dig.fileUrl} onChange={e => sd('fileUrl', e.target.value)} placeholder="https://res.cloudinary.com/…" style={inputSt} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="File Name">
                    <input value={dig.fileName} onChange={e => sd('fileName', e.target.value)} placeholder="course.pdf" style={inputSt} />
                  </Field>
                  <Field label="MIME Type">
                    <input value={dig.fileMime} onChange={e => sd('fileMime', e.target.value)} placeholder="application/pdf" style={inputSt} />
                  </Field>
                </div>
              </div>
              <div style={cardSt}>
                <SectionTitle title="Delivery Settings" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Download Limit">
                    <input value={dig.downloadLimit} onChange={e => sd('downloadLimit', e.target.value)} placeholder="unlimited or 5" style={inputSt} />
                  </Field>
                  <Field label="Link Expiry (days)">
                    <input type="number" value={dig.linkExpiryDays} onChange={e => sd('linkExpiryDays', e.target.value)} placeholder="No expiry" style={inputSt} />
                  </Field>
                </div>
                <Field label="License Type">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['personal', 'commercial'] as const).map(l => (
                      <button key={l} type="button" onClick={() => sd('licenseType', l)} style={{
                        flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontFamily: FONT,
                        border: `1.5px solid ${dig.licenseType === l ? ACCENT : BORDER}`,
                        background: dig.licenseType === l ? '#FBECE4' : '#fff',
                        color: dig.licenseType === l ? ACCENT : MUTED,
                        fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
                      }}>{l}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Buyer Delivery Message">
                  <textarea value={dig.buyerDeliveryMessage} onChange={e => sd('buyerDeliveryMessage', e.target.value)}
                    placeholder="Thank you for your purchase!" style={textareaSt} />
                </Field>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', margin: 0 }}>PDF Stamping</p>
                    <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>Watermark with buyer's name</p>
                  </div>
                  <Toggle checked={dig.pdfStampingEnabled} onChange={v => sd('pdfStampingEnabled', v)} />
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          <div style={cardSt}>
            <SectionTitle title="Tags" />
            <TagInput
              tags={pType === 'physical' ? phys.tags : dig.tags}
              input={pType === 'physical' ? phys.tagInput : dig.tagInput}
              onInput={v => pType === 'physical' ? sp('tagInput', v) : sd('tagInput', v)}
              onAdd={addTag}
              onRemove={i => pType === 'physical'
                ? sp('tags', phys.tags.filter((_, idx) => idx !== i))
                : sd('tags', dig.tags.filter((_, idx) => idx !== i))}
            />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div>
          <div style={cardSt}>
            <SectionTitle title="Publish" />
            <Field label="Status">
              <StatusRow
                status={pType === 'physical' ? phys.status : dig.status}
                onStatus={v => pType === 'physical' ? sp('status', v) : sd('status', v)}
              />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 0' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', margin: 0 }}>Solvexo Marketplace</p>
                <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>Visible to all buyers</p>
              </div>
              <Toggle
                checked={pType === 'physical' ? phys.isListedOnSolvexo : dig.isListedOnSolvexo}
                onChange={v => pType === 'physical' ? sp('isListedOnSolvexo', v) : sd('isListedOnSolvexo', v)}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#DC2626', fontFamily: FONT }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={saving} style={{
            width: '100%', padding: '11px 0', borderRadius: 9,
            background: saving ? '#E8E6DC' : ACCENT, color: saving ? MUTED : '#fff',
            border: 'none', fontSize: 13, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
