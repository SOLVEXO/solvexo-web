import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Download, Loader2,
} from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import {
  apiCreatePhysicalProduct, apiCreateDigitalProduct,
} from '@/api/commerce/product';
import { addCachedProduct } from './_cache';
import { ImageUpload, FileUpload, type PrivateUploadData } from '@/components/comman/ui';

// ── Constants ─────────────────────────────────────────────────────────────────
type ProductType   = 'physical' | 'digital';
type ProductStatus = 'draft' | 'active';

// ── Shared UI ─────────────────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border";
const textareaCls = `${inputCls} resize-y min-h-[82px]`;
const cardCls = "bg-white border border-bone rounded-[10px] px-[22px] py-5 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]";

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="mb-[14px]">
      <label className="text-[12px] font-medium text-[#4A4945] block mb-[5px]">
        {label}{required && <span className="text-brand-orange"> *</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-[13px] font-bold text-charcoal mb-[14px]">
      {title}
    </p>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-10 h-[22px] rounded-[11px] border-none cursor-pointer p-0 relative transition-colors duration-[180ms] shrink-0"
      style={{ background: checked ? '#D97757' : '#D1D5DB' }}
    >
      <span
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-[left] duration-[180ms]"
        style={{ left: checked ? 21 : 3 }}
      />
    </button>
  );
}

function TagInput({ tags, input, onInput, onAdd, onRemove }: {
  tags: string[]; input: string;
  onInput: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
}) {
  return (
    <div className="border border-bone rounded-lg px-[10px] py-[6px] flex flex-wrap gap-[5px] bg-white">
      {tags.map((t, i) => (
        <span key={i} className="bg-bone border border-bone rounded-[6px] px-2 py-[2px] text-[12px] flex items-center gap-1">
          {t}
          <button type="button" onClick={() => onRemove(i)}
            className="bg-transparent border-none cursor-pointer p-0 text-slate text-[14px] leading-none">
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => onInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(); } }}
        placeholder={tags.length === 0 ? 'Add tags, press Enter' : ''}
        className="border-none outline-none text-[12px] flex-[1_1_80px] min-w-[80px] bg-transparent"
      />
    </div>
  );
}

function StatusRow({ status, onStatus }: { status: ProductStatus; onStatus: (v: ProductStatus) => void }) {
  return (
    <div className="flex gap-2">
      {(['draft', 'active'] as const).map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onStatus(s)}
          className="flex-1 py-[9px] rounded-lg cursor-pointer text-[13px] font-medium capitalize transition-all duration-150"
          style={{
            border: `1.5px solid ${status === s ? '#D97757' : '#E8E6DC'}`,
            background: status === s ? '#FBECE4' : '#fff',
            color: status === s ? '#D97757' : '#8C8A82',
          }}
        >{s}</button>
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
  images: [] as string[],
};
const initDig = {
  name: '', description: '', price: '', compareAtPrice: '',
  status: 'draft' as ProductStatus, isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[],
  images: [] as string[],
  fileData: null as PrivateUploadData | null,
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
          subCategoryId: null, images: phys.images, tags: phys.tags,
          isListedOnSolvexo: phys.isListedOnSolvexo, status: phys.status,
          price: Number(phys.price),
          compareAtPrice: phys.compareAtPrice ? Number(phys.compareAtPrice) : null,
          size: phys.size, color: phys.color,
          stock: Number(phys.stock), shippingWeight: phys.shippingWeight,
        });
        addCachedProduct(storeId, { product: res.data.product, variant: res.data.defaultVariant });
      } else {
        const files = dig.fileData ? [{
          url:      dig.fileData.publicId,
          name:     dig.fileData.fileName,
          size:     dig.fileData.fileSize,
          mimeType: dig.fileData.mimeType,
        }] : [];
        const res = await apiCreateDigitalProduct({
          storeId, name: dig.name, description: dig.description,
          productType: 'digital', subCategoryId: null, images: dig.images, tags: dig.tags,
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
    <div className="bg-bone min-h-screen">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-bone px-7 py-[14px] flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-transparent border-none cursor-pointer text-slate flex items-center gap-[5px] p-0 text-[13px]"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-bone text-[16px]">|</span>
          <div>
            <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Add Product</h1>
            <p className="text-[12px] text-slate mt-0.5">Fill in the details below to create a new product</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-1.5 border-none rounded-[9px] px-5 py-[10px] text-[13px] font-semibold"
          style={{
            background: saving ? '#E8E6DC' : '#D97757',
            color: saving ? '#8C8A82' : '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Create Product'}
        </button>
      </div>

      <div className="px-7 py-6 grid gap-5 items-start" style={{ gridTemplateColumns: '1fr 320px' }}>

        {/* ── Left column ── */}
        <div>
          {/* Type selector */}
          <div className={cardCls}>
            <SectionTitle title="Product Type" />
            <div className="flex gap-2.5">
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
                    className="flex-1 px-4 py-[14px] rounded-[9px] flex items-center gap-3 text-left transition-all duration-150"
                    style={{
                      cursor: enabled ? 'pointer' : 'not-allowed',
                      border: `2px solid ${isSelected ? '#D97757' : enabled ? '#E8E6DC' : '#E8E6DC'}`,
                      background: isSelected ? '#FBECE4' : enabled ? '#fff' : '#F9F8F5',
                      opacity: enabled ? 1 : 0.5,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-[9px] shrink-0 flex items-center justify-center border"
                      style={{
                        background: isSelected ? '#fff' : '#FAF9F5',
                        borderColor: isSelected ? '#D97757' : '#E8E6DC',
                      }}
                    >
                      <Icon size={16} style={{ color: isSelected ? '#D97757' : '#8C8A82' }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold m-0" style={{ color: isSelected ? '#D97757' : enabled ? '#141413' : '#8C8A82' }}>{label}</p>
                      <p className="text-[11px] text-slate mt-[2px] mb-0">
                        {enabled ? desc : 'Not available in your store plan'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Images */}
          <div className={cardCls}>
            <SectionTitle title="Product Images" />
            <ImageUpload
              value={pType === 'physical' ? phys.images : dig.images}
              onChange={urls => pType === 'physical' ? sp('images', urls) : sd('images', urls)}
              maxFiles={5}
            />
            <p className="text-[11px] text-slate mt-2">PNG, JPG or WebP. Up to 5 images.</p>
          </div>

          {/* Basic info */}
          <div className={cardCls}>
            <SectionTitle title="Basic Information" />
            <Field label="Product Name" required>
              <input value={pType === 'physical' ? phys.name : dig.name}
                onChange={e => pType === 'physical' ? sp('name', e.target.value) : sd('name', e.target.value)}
                placeholder={pType === 'physical' ? 'e.g. Cotton T-Shirt' : 'e.g. Web Design Course'}
                className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={pType === 'physical' ? phys.description : dig.description}
                onChange={e => pType === 'physical' ? sp('description', e.target.value) : sd('description', e.target.value)}
                placeholder="Describe your product…"
                className={`${textareaCls} mb-0`} />
            </Field>
          </div>

          {/* Pricing */}
          <div className={cardCls}>
            <SectionTitle title="Pricing" />
            <div className="grid grid-cols-2 gap-[14px]">
              <Field label="Price (Rs)" required>
                <input type="number" min="0"
                  value={pType === 'physical' ? phys.price : dig.price}
                  onChange={e => pType === 'physical' ? sp('price', e.target.value) : sd('price', e.target.value)}
                  placeholder="1500" className={inputCls} />
              </Field>
              <Field label="Compare At Price (Rs)">
                <input type="number" min="0"
                  value={pType === 'physical' ? phys.compareAtPrice : dig.compareAtPrice}
                  onChange={e => pType === 'physical' ? sp('compareAtPrice', e.target.value) : sd('compareAtPrice', e.target.value)}
                  placeholder="Original price" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Physical: Inventory */}
          {pType === 'physical' && (
            <div className={cardCls}>
              <SectionTitle title="Inventory & Shipping" />
              <div className="grid grid-cols-3 gap-[14px]">
                <Field label="Stock Quantity" required>
                  <input type="number" min="0" value={phys.stock}
                    onChange={e => sp('stock', e.target.value)} placeholder="50" className={inputCls} />
                </Field>
                <Field label="Size">
                  <input value={phys.size} onChange={e => sp('size', e.target.value)}
                    placeholder="L, XL, 42…" className={inputCls} />
                </Field>
                <Field label="Color">
                  <input value={phys.color} onChange={e => sp('color', e.target.value)}
                    placeholder="Red, Blue…" className={inputCls} />
                </Field>
              </div>
              <Field label="Shipping Weight">
                <input value={phys.shippingWeight} onChange={e => sp('shippingWeight', e.target.value)}
                  placeholder="e.g. 0.3kg" className={inputCls} />
              </Field>
            </div>
          )}

          {/* Digital: File + Delivery */}
          {pType === 'digital' && (
            <>
              <div className={cardCls}>
                <SectionTitle title="Digital File" />
                <FileUpload
                  value={dig.fileData}
                  onChange={v => sd('fileData', v)}
                  label="Click to upload your digital file"
                />
              </div>

              <div className={cardCls}>
                <SectionTitle title="Delivery Settings" />
                <div className="grid grid-cols-2 gap-[14px]">
                  <Field label="Download Limit">
                    <input value={dig.downloadLimit} onChange={e => sd('downloadLimit', e.target.value)}
                      placeholder="unlimited or 5" className={inputCls} />
                  </Field>
                  <Field label="Link Expiry (days)">
                    <input type="number" value={dig.linkExpiryDays}
                      onChange={e => sd('linkExpiryDays', e.target.value)}
                      placeholder="No expiry" className={inputCls} />
                  </Field>
                </div>
                <Field label="License Type">
                  <div className="flex gap-2">
                    {(['personal', 'commercial'] as const).map(l => (
                      <button key={l} type="button" onClick={() => sd('licenseType', l)}
                        className="flex-1 py-[9px] rounded-lg cursor-pointer text-[12px] font-medium capitalize transition-all duration-150"
                        style={{
                          border: `1.5px solid ${dig.licenseType === l ? '#D97757' : '#E8E6DC'}`,
                          background: dig.licenseType === l ? '#FBECE4' : '#fff',
                          color: dig.licenseType === l ? '#D97757' : '#8C8A82',
                        }}>{l}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Buyer Delivery Message">
                  <textarea value={dig.buyerDeliveryMessage}
                    onChange={e => sd('buyerDeliveryMessage', e.target.value)}
                    placeholder="Thank you for your purchase!" className={textareaCls} />
                </Field>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-charcoal m-0">PDF Stamping</p>
                    <p className="text-[11px] text-slate mt-[2px] mb-0">Watermark with buyer's name</p>
                  </div>
                  <Toggle checked={dig.pdfStampingEnabled} onChange={v => sd('pdfStampingEnabled', v)} />
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          <div className={cardCls}>
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
            <p className="text-[11px] text-slate mt-1.5">
              Press Enter or comma to add a tag
            </p>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div>
          {/* Publish */}
          <div className={cardCls}>
            <SectionTitle title="Publish" />
            <Field label="Status">
              <StatusRow
                status={pType === 'physical' ? phys.status : dig.status}
                onStatus={v => pType === 'physical' ? sp('status', v) : sd('status', v)}
              />
            </Field>
            <div className="flex items-center justify-between pt-[10px]">
              <div>
                <p className="text-[13px] font-medium text-charcoal m-0">Solvexo Marketplace</p>
                <p className="text-[11px] text-slate mt-[2px] mb-0">Visible to all buyers</p>
              </div>
              <Toggle
                checked={pType === 'physical' ? phys.isListedOnSolvexo : dig.isListedOnSolvexo}
                onChange={v => pType === 'physical' ? sp('isListedOnSolvexo', v) : sd('isListedOnSolvexo', v)}
              />
            </div>
          </div>

          {/* Summary / tips */}
          <div className="bg-bone border border-bone rounded-[10px] px-[22px] py-5 mb-4">
            <p className="text-[12px] font-semibold text-charcoal mb-2.5">
              {pType === 'physical' ? 'Physical Product Tips' : 'Digital Product Tips'}
            </p>
            {pType === 'physical' ? (
              <ul className="m-0 pl-4 text-[12px] text-slate leading-[1.8]">
                <li>Set accurate stock to prevent overselling</li>
                <li>Add size &amp; color to help customers choose</li>
                <li>Include shipping weight for accurate rates</li>
              </ul>
            ) : (
              <ul className="m-0 pl-4 text-[12px] text-slate leading-[1.8]">
                <li>Use Cloudinary or S3 for hosted files</li>
                <li>Set download limit to control access</li>
                <li>PDF stamping deters unauthorized sharing</li>
              </ul>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-[14px] py-[10px] rounded-lg mt-1 bg-error-bg border border-[#FECACA] text-[12px] text-error">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full mt-1 py-[11px] rounded-[9px] border-none text-[13px] font-semibold flex items-center justify-center gap-[7px]"
            style={{
              background: saving ? '#E8E6DC' : '#D97757',
              color: saving ? '#8C8A82' : '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Create Product'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
