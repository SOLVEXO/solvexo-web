import { useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Download, Loader2,
} from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import {
  apiCreatePhysicalProduct, apiCreateDigitalProduct,
} from '@/api/commerce/product';
import { addCachedProduct } from './_cache';

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT   = "'Poppins', sans-serif";
const ACCENT = '#D97757';
const BORDER = '#E8E6DC';
const MUTED  = '#8C8A82';

type ProductType   = 'physical' | 'digital';
type ProductStatus = 'draft' | 'active';

// ── Shared UI ─────────────────────────────────────────────────────────────────
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
  return (
    <p style={{ fontSize: 13, fontWeight: 700, color: '#141413', marginBottom: 14, fontFamily: FONT }}>
      {title}
    </p>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11,
      background: checked ? ACCENT : '#D1D5DB',
      border: 'none', cursor: 'pointer', padding: 0,
      position: 'relative', transition: 'background 0.18s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: 8, background: '#fff',
        transition: 'left 0.18s',
      }} />
    </button>
  );
}

function TagInput({ tags, input, onInput, onAdd, onRemove }: {
  tags: string[]; input: string;
  onInput: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
}) {
  return (
    <div style={{
      border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px',
      display: 'flex', flexWrap: 'wrap', gap: 5, background: '#fff',
    }}>
      {tags.map((t, i) => (
        <span key={i} style={{
          background: '#FAF9F5', border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: '2px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT,
        }}>
          {t}
          <button type="button" onClick={() => onRemove(i)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: MUTED, fontSize: 14, lineHeight: 1 }}>
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => onInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(); } }}
        placeholder={tags.length === 0 ? 'Add tags, press Enter' : ''}
        style={{ border: 'none', outline: 'none', fontSize: 12, fontFamily: FONT, flex: '1 1 80px', minWidth: 80, background: 'transparent' }}
      />
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
          background: status === s ? '#FBECE4' : '#fff',
          color: status === s ? ACCENT : MUTED,
          fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
        }}>{s}</button>
      ))}
    </div>
  );
}

// ── Initial form state ────────────────────────────────────────────────────────
const initPhys = {
  name: '', description: '', price: '', compareAtPrice: '',
  stock: '', size: '', color: '', shippingWeight: '',
  status: 'draft' as ProductStatus, isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[],
};
const initDig = {
  name: '', description: '', price: '', compareAtPrice: '',
  status: 'draft' as ProductStatus, isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[],
  fileUrl: '', fileName: '', fileSize: '', fileMime: '',
  downloadLimit: 'unlimited',
  linkExpiryDays: '', pdfStampingEnabled: false,
  licenseType: 'personal' as 'personal' | 'commercial',
  buyerDeliveryMessage: '',
};
type PhysForm = typeof initPhys;
type DigForm  = typeof initDig;

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreAddProduct() {
  const navigate          = useNavigate();
  const { storeId, store } = useStoreWorkspace();

  const supportsPhysical = !store || store.productTypes.includes('physical_products');
  const supportsDigital  = !store || store.productTypes.includes('digital_downloads');

  const [pType,  setPType]  = useState<ProductType>('physical');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [phys,   setPhys]   = useState<PhysForm>(initPhys);
  const [dig,    setDig]    = useState<DigForm>(initDig);

  const sp = <K extends keyof PhysForm>(k: K, v: PhysForm[K]) => setPhys(f => ({ ...f, [k]: v }));
  const sd = <K extends keyof DigForm> (k: K, v: DigForm[K])  => setDig(f  => ({ ...f, [k]: v  }));

  const addPhysTag = () => {
    const v = phys.tagInput.replace(',', '').trim();
    if (v && !phys.tags.includes(v)) sp('tags', [...phys.tags, v]);
    sp('tagInput', '');
  };
  const addDigTag = () => {
    const v = dig.tagInput.replace(',', '').trim();
    if (v && !dig.tags.includes(v)) sd('tags', [...dig.tags, v]);
    sd('tagInput', '');
  };

  const handleSubmit = async () => {
    setError('');
    if (pType === 'physical') {
      if (!phys.name || !phys.price || !phys.stock) {
        setError('Name, price, and stock are required.'); return;
      }
    } else {
      if (!dig.name || !dig.price) {
        setError('Name and price are required.'); return;
      }
    }
    setSaving(true);
    try {
      if (pType === 'physical') {
        const res = await apiCreatePhysicalProduct({
          storeId, name: phys.name, description: phys.description,
          subCategoryId: null, images: [], tags: phys.tags,
          isListedOnSolvexo: phys.isListedOnSolvexo, status: phys.status,
          price: Number(phys.price),
          compareAtPrice: phys.compareAtPrice ? Number(phys.compareAtPrice) : null,
          size: phys.size, color: phys.color,
          stock: Number(phys.stock), shippingWeight: phys.shippingWeight,
        });
        addCachedProduct(storeId, { product: res.data.product, variant: res.data.defaultVariant });
      } else {
        const files = dig.fileUrl ? [{
          url: dig.fileUrl,
          name: dig.fileName || dig.fileUrl.split('/').pop() || 'file',
          size: dig.fileSize ? Number(dig.fileSize) : 0,
          mimeType: dig.fileMime || 'application/octet-stream',
        }] : [];
        const res = await apiCreateDigitalProduct({
          storeId, name: dig.name, description: dig.description,
          productType: 'digital', subCategoryId: null, images: [], tags: dig.tags,
          isListedOnSolvexo: dig.isListedOnSolvexo, status: dig.status,
          price: Number(dig.price),
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
        addCachedProduct(storeId, { product: res.data.product, variant: res.data.defaultVariant });
      }
      navigate(`/seller/store/${storeId}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: FONT, background: '#FAF9F5', minHeight: '100vh' }}>
      {/* ── Page header ── */}
      <div style={{
        background: '#FFFFFF', borderBottom: `1px solid ${BORDER}`,
        padding: '14px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: MUTED,
            display: 'flex', alignItems: 'center', gap: 5, padding: 0,
            fontSize: 13, fontFamily: FONT,
          }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span style={{ color: BORDER, fontSize: 16 }}>|</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', lineHeight: 1.3 }}>Add Product</h1>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Fill in the details below to create a new product</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: saving ? '#E8E6DC' : ACCENT,
          color: saving ? MUTED : '#fff',
          border: 'none', borderRadius: 9, padding: '10px 20px',
          fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT,
        }}>
          {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Create Product'}
        </button>
      </div>

      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div>
          {/* Type selector */}
          <div style={{ ...cardSt }}>
            <SectionTitle title="Product Type" />
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { t: 'physical' as const, Icon: Package,  label: 'Physical Product', desc: 'Shipped to customers',  enabled: supportsPhysical },
                { t: 'digital'  as const, Icon: Download, label: 'Digital Product',  desc: 'Downloadable file',     enabled: supportsDigital  },
              ]).map(({ t, Icon, label, desc, enabled }) => {
                const isSelected = pType === t;
                return (
                  <button
                    key={t}
                    onClick={() => enabled && setPType(t)}
                    disabled={!enabled}
                    style={{
                      flex: 1, padding: '14px 16px', borderRadius: 9, fontFamily: FONT,
                      cursor: enabled ? 'pointer' : 'not-allowed',
                      border: `2px solid ${isSelected ? ACCENT : enabled ? BORDER : '#E8E6DC'}`,
                      background: isSelected ? '#FBECE4' : enabled ? '#fff' : '#F9F8F5',
                      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                      opacity: enabled ? 1 : 0.5,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: isSelected ? '#fff' : '#FAF9F5',
                      border: `1px solid ${isSelected ? ACCENT : BORDER}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} style={{ color: isSelected ? ACCENT : MUTED }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isSelected ? ACCENT : enabled ? '#141413' : MUTED, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>
                        {enabled ? desc : 'Not available in your store plan'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic info */}
          <div style={{ ...cardSt }}>
            <SectionTitle title="Basic Information" />
            <Field label="Product Name" required>
              <input value={pType === 'physical' ? phys.name : dig.name}
                onChange={e => pType === 'physical' ? sp('name', e.target.value) : sd('name', e.target.value)}
                placeholder={pType === 'physical' ? 'e.g. Cotton T-Shirt' : 'e.g. Web Design Course'}
                style={inputSt} />
            </Field>
            <Field label="Description">
              <textarea value={pType === 'physical' ? phys.description : dig.description}
                onChange={e => pType === 'physical' ? sp('description', e.target.value) : sd('description', e.target.value)}
                placeholder="Describe your product…"
                style={{ ...textareaSt, marginBottom: 0 }} />
            </Field>
          </div>

          {/* Pricing */}
          <div style={{ ...cardSt }}>
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
            <div style={{ ...cardSt }}>
              <SectionTitle title="Inventory & Shipping" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="Stock Quantity" required>
                  <input type="number" min="0" value={phys.stock}
                    onChange={e => sp('stock', e.target.value)} placeholder="50" style={inputSt} />
                </Field>
                <Field label="Size">
                  <input value={phys.size} onChange={e => sp('size', e.target.value)}
                    placeholder="L, XL, 42…" style={inputSt} />
                </Field>
                <Field label="Color">
                  <input value={phys.color} onChange={e => sp('color', e.target.value)}
                    placeholder="Red, Blue…" style={inputSt} />
                </Field>
              </div>
              <Field label="Shipping Weight">
                <input value={phys.shippingWeight} onChange={e => sp('shippingWeight', e.target.value)}
                  placeholder="e.g. 0.3kg" style={inputSt} />
              </Field>
            </div>
          )}

          {/* Digital: File + Delivery */}
          {pType === 'digital' && (
            <>
              <div style={{ ...cardSt }}>
                <SectionTitle title="Digital File" />
                <Field label="File URL">
                  <input value={dig.fileUrl} onChange={e => sd('fileUrl', e.target.value)}
                    placeholder="https://res.cloudinary.com/…" style={inputSt} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="File Name">
                    <input value={dig.fileName} onChange={e => sd('fileName', e.target.value)}
                      placeholder="course.pdf" style={inputSt} />
                  </Field>
                  <Field label="MIME Type">
                    <input value={dig.fileMime} onChange={e => sd('fileMime', e.target.value)}
                      placeholder="application/pdf" style={inputSt} />
                  </Field>
                </div>
              </div>

              <div style={{ ...cardSt }}>
                <SectionTitle title="Delivery Settings" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Download Limit">
                    <input value={dig.downloadLimit} onChange={e => sd('downloadLimit', e.target.value)}
                      placeholder="unlimited or 5" style={inputSt} />
                  </Field>
                  <Field label="Link Expiry (days)">
                    <input type="number" value={dig.linkExpiryDays}
                      onChange={e => sd('linkExpiryDays', e.target.value)}
                      placeholder="No expiry" style={inputSt} />
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
                  <textarea value={dig.buyerDeliveryMessage}
                    onChange={e => sd('buyerDeliveryMessage', e.target.value)}
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
          <div style={{ ...cardSt }}>
            <SectionTitle title="Tags" />
            <TagInput
              tags={pType === 'physical' ? phys.tags : dig.tags}
              input={pType === 'physical' ? phys.tagInput : dig.tagInput}
              onInput={v => pType === 'physical' ? sp('tagInput', v) : sd('tagInput', v)}
              onAdd={pType === 'physical' ? addPhysTag : addDigTag}
              onRemove={i => pType === 'physical'
                ? sp('tags', phys.tags.filter((_, idx) => idx !== i))
                : sd('tags', dig.tags.filter((_, idx) => idx !== i))}
            />
            <p style={{ fontSize: 11, color: MUTED, marginTop: 6, fontFamily: FONT }}>
              Press Enter or comma to add a tag
            </p>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div>
          {/* Publish */}
          <div style={{ ...cardSt }}>
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

          {/* Summary / tips */}
          <div style={{ ...cardSt, background: '#FAF9F5', boxShadow: 'none' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#141413', marginBottom: 10, fontFamily: FONT }}>
              {pType === 'physical' ? 'Physical Product Tips' : 'Digital Product Tips'}
            </p>
            {pType === 'physical' ? (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: MUTED, lineHeight: 1.8 }}>
                <li>Set accurate stock to prevent overselling</li>
                <li>Add size &amp; color to help customers choose</li>
                <li>Include shipping weight for accurate rates</li>
              </ul>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: MUTED, lineHeight: 1.8 }}>
                <li>Use Cloudinary or S3 for hosted files</li>
                <li>Set download limit to control access</li>
                <li>PDF stamping deters unauthorized sharing</li>
              </ul>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginTop: 4,
              background: '#FEF2F2', border: '1px solid #FECACA',
              fontSize: 12, color: '#DC2626', fontFamily: FONT,
            }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={saving} style={{
            width: '100%', marginTop: 4, padding: '11px 0', borderRadius: 9,
            background: saving ? '#E8E6DC' : ACCENT, color: saving ? MUTED : '#fff',
            border: 'none', fontSize: 13, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Create Product'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
