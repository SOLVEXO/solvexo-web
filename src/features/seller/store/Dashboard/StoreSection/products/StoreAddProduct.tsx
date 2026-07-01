import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Download, Loader2, CalendarClock } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiCreatePhysicalProduct, apiCreateDigitalProduct } from '@/api/commerce/product';
import { addCachedProduct } from './_cache';
import { ImageUpload, FileUpload, type PrivateUploadData, DateTimePickerModal } from '@/components/comman/ui';

type ProductType   = 'physical' | 'digital';
type ProductStatus = 'draft' | 'active' | 'scheduled';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white placeholder:text-[#B5B3AC] outline-none';
const ta  = `${inp} resize-y min-h-[100px]`;

function L({ children, req }: { children: ReactNode; req?: boolean }) {
  return (
    <label className="text-[12px] font-semibold text-[#4A4945] block mb-1.5">
      {children}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}
function F({ label, req, children }: { label: string; req?: boolean; children: ReactNode }) {
  return <div><L req={req}>{label}</L>{children}</div>;
}
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone">
        <p className="text-[13px] font-bold text-charcoal">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="w-10 h-[22px] rounded-[11px] border-none cursor-pointer p-0 relative shrink-0 transition-colors duration-[180ms]"
      style={{ background: checked ? '#D97757' : '#D1D5DB' }}>
      <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-[180ms]"
        style={{ left: checked ? 21 : 3 }} />
    </button>
  );
}
function TagInput({ tags, input, onInput, onAdd, onRemove }: {
  tags: string[]; input: string;
  onInput: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
}) {
  return (
    <div className="border border-bone rounded-lg px-[10px] py-[7px] flex flex-wrap gap-[6px] bg-white min-h-[42px]">
      {tags.map((t, i) => (
        <span key={i} className="bg-brand-pale-orange text-brand-orange border border-brand-orange/20 rounded-[6px] px-2 py-[2px] text-[12px] font-medium flex items-center gap-1">
          {t}
          <button type="button" onClick={() => onRemove(i)} className="bg-transparent border-none cursor-pointer p-0 text-brand-orange/50 text-[14px] leading-none hover:text-brand-orange">×</button>
        </span>
      ))}
      <input value={input} onChange={e => onInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(); } }}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter…' : ''}
        className="border-none outline-none text-[12px] flex-[1_1_80px] min-w-[80px] bg-transparent text-charcoal placeholder:text-[#B5B3AC]"
      />
    </div>
  );
}

const initPhys = {
  name: '', description: '', price: '', compareAtPrice: '',
  stock: '', size: '', color: '', shippingWeight: '',
  status: 'draft' as ProductStatus, isListedOnSolvexo: false,
  scheduledAt: '', tagInput: '', tags: [] as string[], images: [] as string[],
};
const initDig = {
  name: '', description: '', price: '', compareAtPrice: '',
  status: 'draft' as ProductStatus, isListedOnSolvexo: false,
  scheduledAt: '', tagInput: '', tags: [] as string[], images: [] as string[],
  fileData: null as PrivateUploadData | null,
  downloadLimit: 'unlimited', linkExpiryDays: '',
  pdfStampingEnabled: false, licenseType: 'personal' as 'personal' | 'commercial',
  buyerDeliveryMessage: '',
};
type PhysForm = typeof initPhys;
type DigForm  = typeof initDig;

export default function StoreAddProduct() {
  const navigate           = useNavigate();
  const { storeId, store } = useStoreWorkspace();

  const supportsPhysical = !store || store.productTypes.includes('physical_products');
  const supportsDigital  = !store || store.productTypes.includes('digital_downloads');

  const [pType,             setPType]             = useState<ProductType>('physical');
  const [saving,            setSaving]            = useState(false);
  const [error,             setError]             = useState('');
  const [phys,              setPhys]              = useState<PhysForm>(initPhys);
  const [dig,               setDig]               = useState<DigForm>(initDig);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const sp = <K extends keyof PhysForm>(k: K, v: PhysForm[K]) => setPhys(f => ({ ...f, [k]: v }));
  const sd = <K extends keyof DigForm> (k: K, v: DigForm[K])  => setDig(f  => ({ ...f, [k]: v }));

  const cur = pType === 'physical' ? phys : dig;

  const addPhysTag = () => { const v = phys.tagInput.replace(',', '').trim(); if (v && !phys.tags.includes(v)) sp('tags', [...phys.tags, v]); sp('tagInput', ''); };
  const addDigTag  = () => { const v = dig.tagInput.replace(',', '').trim();  if (v && !dig.tags.includes(v))  sd('tags', [...dig.tags, v]);  sd('tagInput', '');  };

  const discountPct = (() => {
    const p = Number(cur.price), c = Number(cur.compareAtPrice);
    return p > 0 && c > p ? Math.round((1 - p / c) * 100) : null;
  })();

  const handleSubmit = async (statusOverride?: ProductStatus) => {
    setError('');
    if (pType === 'physical' && (!phys.name || !phys.price || !phys.stock)) { setError('Name, price, and stock are required.'); return; }
    if (pType === 'digital'  && (!dig.name  || !dig.price))                  { setError('Name and price are required.'); return; }
    setSaving(true);
    try {
      const finalStatus = statusOverride ?? (pType === 'physical' ? phys.status : dig.status);
      if (pType === 'physical') {
        const res = await apiCreatePhysicalProduct({
          storeId, name: phys.name, description: phys.description,
          subCategoryId: null, images: phys.images, tags: phys.tags,
          isListedOnSolvexo: phys.isListedOnSolvexo, status: finalStatus,
          price: Number(phys.price), compareAtPrice: phys.compareAtPrice ? Number(phys.compareAtPrice) : null,
          size: phys.size, color: phys.color, stock: Number(phys.stock), shippingWeight: phys.shippingWeight,
        });
        addCachedProduct(storeId, { product: res.data.product, variant: res.data.defaultVariant });
      } else {
        const files = dig.fileData ? [{ url: dig.fileData.publicId, name: dig.fileData.fileName, size: dig.fileData.fileSize, mimeType: dig.fileData.mimeType }] : [];
        const res = await apiCreateDigitalProduct({
          storeId, name: dig.name, description: dig.description,
          productType: 'digital', subCategoryId: null, images: dig.images, tags: dig.tags,
          isListedOnSolvexo: dig.isListedOnSolvexo, status: finalStatus,
          price: Number(dig.price), compareAtPrice: dig.compareAtPrice ? Number(dig.compareAtPrice) : null,
          digital: { files, downloadLimit: dig.downloadLimit, linkExpiryDays: dig.linkExpiryDays ? Number(dig.linkExpiryDays) : null, pdfStampingEnabled: dig.pdfStampingEnabled, licenseType: dig.licenseType, buyerDeliveryMessage: dig.buyerDeliveryMessage },
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
    <div className="bg-cream min-h-screen">

      {/* ── Header ── */}
      <div className="px-7 py-5 bg-white border-b border-bone flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-charcoal leading-tight">Add New Product</h1>
          <p className="text-[12px] text-slate mt-0.5">Fill in product details to create your listing.</p>
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
          <button onClick={() => handleSubmit('draft')} disabled={saving}
            className="px-4 py-[9px] rounded-[9px] text-[13px] font-semibold text-slate bg-white border border-bone cursor-pointer hover:bg-cream transition-colors">
            Save Draft
          </button>
          <button onClick={() => handleSubmit()} disabled={saving}
            className="flex items-center gap-1.5 border-none rounded-[9px] px-5 py-[9px] text-[13px] font-semibold"
            style={{ background: saving ? '#E8E6DC' : '#D97757', color: saving ? '#8C8A82' : '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? <><Loader2 size={13} className="animate-spin" />Saving…</> : 'Publish Listing'}
          </button>
        </div>
      </div>

      {/* ── 2-column body ── */}
      <div className="px-7 py-6 grid grid-cols-[1fr_296px] gap-5 items-start">

        {/* Left column */}
        <div className="flex flex-col gap-5">

          {/* Product Type */}
          <Card title="Product Type">
            <div className="grid grid-cols-2 gap-3">
              {([
                { t: 'physical' as const, Icon: Package,  label: 'Physical Product', desc: 'Shipped to the customer',   enabled: supportsPhysical },
                { t: 'digital'  as const, Icon: Download, label: 'Digital Download',  desc: 'Instant downloadable file', enabled: supportsDigital  },
              ]).map(({ t, Icon: TIcon, label, desc, enabled }) => {
                const sel = pType === t;
                return (
                  <button key={t} type="button"
                    onClick={() => enabled && setPType(t)} disabled={!enabled}
                    className="flex flex-col items-center gap-2 py-5 rounded-[10px] text-center transition-all duration-150"
                    style={{ cursor: enabled ? 'pointer' : 'not-allowed', border: `2px solid ${sel ? '#D97757' : '#E8E6DC'}`, background: sel ? '#FBECE4' : '#FAFAF8', opacity: enabled ? 1 : 0.5 }}>
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: sel ? '#fff' : '#F0EEE8' }}>
                      <TIcon size={20} style={{ color: sel ? '#D97757' : '#8C8A82' }} />
                    </div>
                    <p className="text-[13px] font-semibold" style={{ color: sel ? '#D97757' : '#141413' }}>{label}</p>
                    <p className="text-[11px] text-slate">{enabled ? desc : 'Not available in your plan'}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Basic Information */}
          <Card title="Basic Information">
            <div className="flex flex-col gap-4">
              <F label="Product Title" req>
                <input value={cur.name}
                  onChange={e => pType === 'physical' ? sp('name', e.target.value) : sd('name', e.target.value)}
                  placeholder={pType === 'physical' ? 'e.g. Premium Cotton T-Shirt' : 'e.g. Complete Web Design Course'}
                  className={inp} />
              </F>
              <F label="Description">
                <textarea value={cur.description}
                  onChange={e => pType === 'physical' ? sp('description', e.target.value) : sd('description', e.target.value)}
                  placeholder="Describe your product — what it includes, who it's for, and what makes it special…"
                  className={ta} />
              </F>
            </div>
          </Card>

          {/* Product Images */}
          <Card title="Product Images">
            <p className="text-[12px] text-slate mb-3">Upload up to 5 images. First image is the cover shown to buyers.</p>
            <ImageUpload
              value={cur.images}
              onChange={urls => pType === 'physical' ? sp('images', urls) : sd('images', urls)}
              maxFiles={5}
            />
          </Card>

          {/* Digital: File Upload */}
          {pType === 'digital' && (
            <Card title="Digital File">
              <p className="text-[12px] text-slate mb-3">Upload the file buyers will receive instantly after purchase.</p>
              <FileUpload value={dig.fileData} onChange={v => sd('fileData', v)} label="Click to upload your digital file" />
            </Card>
          )}

          {/* Digital: Delivery Settings */}
          {pType === 'digital' && (
            <Card title="Delivery Settings">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <F label="Download Limit">
                    <input value={dig.downloadLimit} onChange={e => sd('downloadLimit', e.target.value)} placeholder="unlimited" className={inp} />
                  </F>
                  <F label="Link Expiry (days)">
                    <input type="number" min="0" value={dig.linkExpiryDays} onChange={e => sd('linkExpiryDays', e.target.value)} placeholder="No expiry" className={inp} />
                  </F>
                </div>
                <F label="License Type">
                  <div className="flex gap-2 mt-0.5">
                    {(['personal', 'commercial'] as const).map(l => {
                      const sel = dig.licenseType === l;
                      return (
                        <button key={l} type="button" onClick={() => sd('licenseType', l)}
                          className="flex-1 py-2 rounded-lg cursor-pointer text-[12px] font-semibold capitalize transition-all duration-150"
                          style={{ border: `1.5px solid ${sel ? '#D97757' : '#E8E6DC'}`, background: sel ? '#FBECE4' : '#fff', color: sel ? '#D97757' : '#8C8A82' }}>
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </F>
                <F label="Buyer Delivery Message">
                  <textarea value={dig.buyerDeliveryMessage} onChange={e => sd('buyerDeliveryMessage', e.target.value)}
                    placeholder="Thank you for your purchase! Here is your download link…" className={ta} />
                </F>
                <div className="flex items-center justify-between py-0.5">
                  <div>
                    <p className="text-[13px] font-semibold text-charcoal">PDF Stamping</p>
                    <p className="text-[11px] text-slate mt-0.5">Watermark PDFs with the buyer's name</p>
                  </div>
                  <Toggle checked={dig.pdfStampingEnabled} onChange={v => sd('pdfStampingEnabled', v)} />
                </div>
              </div>
            </Card>
          )}

          {/* Tags */}
          <Card title="Tags & SEO">
            <p className="text-[12px] text-slate mb-3">Help buyers discover your product through search and filters.</p>
            <TagInput
              tags={cur.tags} input={cur.tagInput}
              onInput={v => pType === 'physical' ? sp('tagInput', v) : sd('tagInput', v)}
              onAdd={pType === 'physical' ? addPhysTag : addDigTag}
              onRemove={i => pType === 'physical'
                ? sp('tags', phys.tags.filter((_, idx) => idx !== i))
                : sd('tags', dig.tags.filter((_, idx) => idx !== i))}
            />
            <p className="text-[11px] text-slate mt-2">Press Enter or comma to add a tag</p>
          </Card>
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Pricing */}
          <Card title="Pricing">
            <div className="flex flex-col gap-3">
              <F label="Price (Rs)" req>
                <input type="number" min="0" value={cur.price}
                  onChange={e => pType === 'physical' ? sp('price', e.target.value) : sd('price', e.target.value)}
                  placeholder="0.00" className={inp} />
              </F>
              <F label="Compare-at Price (Rs)">
                <input type="number" min="0" value={cur.compareAtPrice}
                  onChange={e => pType === 'physical' ? sp('compareAtPrice', e.target.value) : sd('compareAtPrice', e.target.value)}
                  placeholder="0.00" className={inp} />
              </F>
              {discountPct !== null && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#E3F4EA] border border-[#B7E2C7] rounded-[7px]">
                  <span className="text-[12px] font-bold text-[#1E7A3C]">{discountPct}% OFF</span>
                  <span className="text-[11px] text-[#2D8A4E]">shown to buyers</span>
                </div>
              )}
            </div>
          </Card>

          {/* Inventory & Shipping (physical only) */}
          {pType === 'physical' && (
            <Card title="Inventory & Shipping">
              <div className="flex flex-col gap-3">
                <F label="Stock Quantity" req>
                  <input type="number" min="0" value={phys.stock} onChange={e => sp('stock', e.target.value)} placeholder="0" className={inp} />
                </F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Size">
                    <input value={phys.size} onChange={e => sp('size', e.target.value)} placeholder="L, XL…" className={inp} />
                  </F>
                  <F label="Color">
                    <input value={phys.color} onChange={e => sp('color', e.target.value)} placeholder="Red…" className={inp} />
                  </F>
                </div>
                <F label="Shipping Weight">
                  <input value={phys.shippingWeight} onChange={e => sp('shippingWeight', e.target.value)} placeholder="e.g. 0.5 kg" className={inp} />
                </F>
              </div>
            </Card>
          )}

          {/* Listing Status */}
          <Card title="Listing Status">
            <div className="flex flex-col gap-4">
              <div>
                <L>Status</L>
                <div className="flex flex-col gap-1.5">
                  {([
                    { val: 'draft'     as const, label: 'Draft',     dotCls: 'bg-[#B5B3AC]',    selCls: 'bg-[#F5F4EF] border-[#B5B3AC]',    chkCls: 'bg-[#B5B3AC]'    },
                    { val: 'active'    as const, label: 'Active',    dotCls: 'bg-[#22C55E]',    selCls: 'bg-[#EDFBF3] border-[#22C55E]',    chkCls: 'bg-[#22C55E]'    },
                    { val: 'scheduled' as const, label: 'Scheduled', dotCls: 'bg-brand-orange',  selCls: 'bg-brand-pale-orange border-brand-orange', chkCls: 'bg-brand-orange' },
                  ]).map(({ val, label, dotCls, selCls, chkCls }) => {
                    const sel = cur.status === val;
                    return (
                      <button key={val} type="button"
                        onClick={() => {
                          if (pType === 'physical') sp('status', val); else sd('status', val);
                          if (val === 'scheduled') setShowScheduleModal(true);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[9px] border-[1.5px] cursor-pointer text-left transition-all duration-150 w-full ${sel ? selCls : 'bg-cream border-bone hover:border-[#C5C3BB]'}`}>
                        <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${dotCls}`} />
                        <span className={`flex-1 text-[12px] font-semibold ${sel ? 'text-charcoal' : 'text-slate'}`}>{label}</span>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${sel ? `${chkCls} border-transparent` : 'border-[#D1D5DB] bg-white'}`}>
                          {sel && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {cur.status === 'scheduled' && (
                <button type="button" onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-bone bg-cream text-[12px] text-charcoal cursor-pointer hover:border-brand-orange/40 transition-colors w-full text-left">
                  <CalendarClock size={13} className="text-brand-orange shrink-0" />
                  <span className="truncate">
                    {cur.scheduledAt
                      ? new Date(cur.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                      : 'Set schedule date & time'}
                  </span>
                </button>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-charcoal">Also list in Solvexo Marketplace</span>
                <Toggle
                  checked={cur.isListedOnSolvexo}
                  onChange={v => pType === 'physical' ? sp('isListedOnSolvexo', v) : sd('isListedOnSolvexo', v)}
                />
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button onClick={() => handleSubmit()} disabled={saving}
              className="w-full py-[11px] rounded-[10px] text-[13px] font-bold border-none transition-all duration-150"
              style={{ background: saving ? '#E8E6DC' : '#D97757', color: saving ? '#8C8A82' : '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Publish Listing'}
            </button>
            <button onClick={() => handleSubmit('draft')} disabled={saving}
              className="w-full py-[9px] rounded-[10px] text-[13px] font-semibold text-slate border-none bg-transparent cursor-pointer hover:text-charcoal transition-colors">
              Save as Draft
            </button>
          </div>

          {error && <p className="text-[12px] text-red-500 font-medium text-center">{error}</p>}
        </div>
      </div>

      {showScheduleModal && (
        <DateTimePickerModal
          value={pType === 'physical' ? phys.scheduledAt : dig.scheduledAt}
          onChange={iso => {
            if (pType === 'physical') sp('scheduledAt', iso); else sd('scheduledAt', iso);
            setShowScheduleModal(false);
          }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}
