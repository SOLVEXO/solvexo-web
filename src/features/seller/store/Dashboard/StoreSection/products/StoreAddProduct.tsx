import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Download, Loader2, CalendarClock } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiCreatePhysicalProduct, apiCreateDigitalProduct } from '@/api/commerce/product';
import { addCachedProduct } from './_cache';
import { ImageUpload, FileUpload, type PrivateUploadData, DateTimePickerModal } from '@/components/comman/ui';

type ProductType   = 'physical' | 'digital';
type ProductStatus = 'draft' | 'active' | 'scheduled';

// ── Primitives ────────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none ' +
  'text-charcoal bg-white placeholder:text-[#B5B3AC] box-border ' +
  'focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 ' +
  'transition-[border-color,box-shadow] duration-150';

const textareaCls = `${inputCls} resize-y min-h-[100px]`;

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="text-[12px] font-semibold text-[#4A4945] block mb-[5px]">
      {children}{required && <span className="text-brand-orange ml-0.5">*</span>}
    </label>
  );
}
function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-slate mt-[4px] leading-[1.4]">{children}</p>;
}
function F({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}
function Divider() { return <div className="border-t border-bone" />; }
function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[13px] font-bold text-charcoal">{title}</p>
      {sub && <p className="text-[12px] text-slate mt-[3px]">{sub}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-10 h-[22px] rounded-[11px] border-none cursor-pointer p-0 relative shrink-0 transition-colors duration-[180ms]"
      style={{ background: checked ? '#D97757' : '#D1D5DB' }}
    >
      <span
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-[180ms]"
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
    <div className="border border-bone rounded-lg px-[10px] py-[7px] flex flex-wrap gap-[6px] bg-white min-h-[42px] focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/10 transition-[border-color,box-shadow] duration-150">
      {tags.map((t, i) => (
        <span key={i} className="bg-brand-pale-orange text-brand-orange border border-brand-orange/20 rounded-[6px] px-2 py-[2px] text-[12px] font-medium flex items-center gap-1">
          {t}
          <button type="button" onClick={() => onRemove(i)} className="bg-transparent border-none cursor-pointer p-0 text-brand-orange/50 text-[14px] leading-none hover:text-brand-orange">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => onInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(); } }}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter…' : ''}
        className="border-none outline-none text-[12px] flex-[1_1_80px] min-w-[80px] bg-transparent text-charcoal placeholder:text-[#B5B3AC]"
      />
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────────
const initPhys = {
  name: '', description: '', price: '', compareAtPrice: '',
  stock: '', size: '', color: '', shippingWeight: '',
  status: 'draft' as ProductStatus, scheduledAt: '', isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[], images: [] as string[],
};
const initDig = {
  name: '', description: '', price: '', compareAtPrice: '',
  status: 'draft' as ProductStatus, scheduledAt: '', isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[], images: [] as string[],
  fileData: null as PrivateUploadData | null,
  downloadLimit: 'unlimited', linkExpiryDays: '',
  pdfStampingEnabled: false, licenseType: 'personal' as 'personal' | 'commercial',
  buyerDeliveryMessage: '',
};
type PhysForm = typeof initPhys;
type DigForm  = typeof initDig;

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreAddProduct() {
  const navigate           = useNavigate();
  const { storeId, store } = useStoreWorkspace();

  const supportsPhysical = !store || store.productTypes.includes('physical_products');
  const supportsDigital  = !store || store.productTypes.includes('digital_downloads');

  const [pType,  setPType]  = useState<ProductType>('physical');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [phys,   setPhys]   = useState<PhysForm>(initPhys);
  const [dig,    setDig]    = useState<DigForm>(initDig);

  const sp = <K extends keyof PhysForm>(k: K, v: PhysForm[K]) => setPhys(f => ({ ...f, [k]: v }));
  const sd = <K extends keyof DigForm> (k: K, v: DigForm[K])  => setDig(f  => ({ ...f, [k]: v }));

  const cur = pType === 'physical' ? phys : dig;

  const addPhysTag = () => { const v = phys.tagInput.replace(',', '').trim(); if (v && !phys.tags.includes(v)) sp('tags', [...phys.tags, v]); sp('tagInput', ''); };
  const addDigTag  = () => { const v = dig.tagInput.replace(',', '').trim();  if (v && !dig.tags.includes(v))  sd('tags', [...dig.tags, v]);  sd('tagInput', '');  };

  const discountPct = (() => {
    const p = Number(cur.price), c = Number(cur.compareAtPrice);
    return p > 0 && c > p ? Math.round((1 - p / c) * 100) : null;
  })();

  const handleSubmit = async () => {
    setError('');
    if (pType === 'physical' && (!phys.name || !phys.price || !phys.stock)) { setError('Name, price, and stock are required.'); return; }
    if (pType === 'digital'  && (!dig.name  || !dig.price))                  { setError('Name and price are required.'); return; }
    setSaving(true);
    try {
      if (pType === 'physical') {
        const res = await apiCreatePhysicalProduct({
          storeId, name: phys.name, description: phys.description,
          subCategoryId: null, images: phys.images, tags: phys.tags,
          isListedOnSolvexo: phys.isListedOnSolvexo, status: phys.status,
          price: Number(phys.price), compareAtPrice: phys.compareAtPrice ? Number(phys.compareAtPrice) : null,
          size: phys.size, color: phys.color, stock: Number(phys.stock), shippingWeight: phys.shippingWeight,
        });
        addCachedProduct(storeId, { product: res.data.product, variant: res.data.defaultVariant });
      } else {
        const files = dig.fileData ? [{ url: dig.fileData.publicId, name: dig.fileData.fileName, size: dig.fileData.fileSize, mimeType: dig.fileData.mimeType }] : [];
        const res = await apiCreateDigitalProduct({
          storeId, name: dig.name, description: dig.description,
          productType: 'digital', subCategoryId: null, images: dig.images, tags: dig.tags,
          isListedOnSolvexo: dig.isListedOnSolvexo, status: dig.status,
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
      <div className="sticky top-0 z-10 bg-white border-b border-bone px-7 py-[14px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-slate flex items-center gap-1.5 p-0 text-[13px] font-medium hover:text-charcoal transition-colors">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="w-px h-5 bg-bone" />
          <div>
            <h1 className="text-[17px] font-bold text-charcoal leading-tight">Add Product</h1>
            <p className="text-[11px] text-slate mt-[1px]">
              {pType === 'physical' ? 'Physical product — ships to customer' : 'Digital product — instant download'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-1.5 border-none rounded-[9px] px-5 py-[10px] text-[13px] font-semibold"
          style={{ background: saving ? '#E8E6DC' : '#D97757', color: saving ? '#8C8A82' : '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Create Product'}
        </button>
      </div>

      {/* ── Card ── */}
      <div className="px-7 py-5">
        <div className="bg-white rounded-[10px] border border-bone shadow-[0_1px_4px_rgba(0,0,0,0.04)]">

          {/* 1 · Product Type */}
          <Section title="Product Type" sub="Choose the type of product you are listing.">
            <div className="grid grid-cols-2 gap-3">
              {([
                { t: 'physical' as const, Icon: Package,  label: 'Physical Product', desc: 'Shipped to the customer',   enabled: supportsPhysical },
                { t: 'digital'  as const, Icon: Download, label: 'Digital Product',  desc: 'Instant downloadable file', enabled: supportsDigital  },
              ]).map(({ t, Icon: TIcon, label, desc, enabled }) => {
                const sel = pType === t;
                return (
                  <button
                    key={t} type="button"
                    onClick={() => enabled && setPType(t)} disabled={!enabled}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-[10px] text-left transition-all duration-150"
                    style={{ cursor: enabled ? 'pointer' : 'not-allowed', border: `2px solid ${sel ? '#D97757' : '#E8E6DC'}`, background: sel ? '#FBECE4' : enabled ? '#FAFAF8' : '#F5F4F0', opacity: enabled ? 1 : 0.5 }}
                  >
                    <div className="w-9 h-9 rounded-[9px] shrink-0 flex items-center justify-center border" style={{ background: sel ? '#fff' : '#F0EEE8', borderColor: sel ? '#D97757' : '#E8E6DC' }}>
                      <TIcon size={16} style={{ color: sel ? '#D97757' : '#8C8A82' }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold leading-tight" style={{ color: sel ? '#D97757' : enabled ? '#141413' : '#8C8A82' }}>{label}</p>
                      <p className="text-[11px] text-slate mt-[3px]">{enabled ? desc : 'Not available in your plan'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Divider />

          {/* 2 · Images */}
          <Section title="Product Images" sub="Upload up to 5 images. The first image is the cover shown to buyers.">
            <ImageUpload
              value={cur.images}
              onChange={urls => pType === 'physical' ? sp('images', urls) : sd('images', urls)}
              maxFiles={5}
            />
          </Section>

          <Divider />

          {/* 3 · Basic Information */}
          <Section title="Basic Information">
            <div className="flex flex-col gap-4">
              <F label="Product Name" required>
                <input
                  value={cur.name}
                  onChange={e => pType === 'physical' ? sp('name', e.target.value) : sd('name', e.target.value)}
                  placeholder={pType === 'physical' ? 'e.g. Premium Cotton T-Shirt' : 'e.g. Complete Web Design Course'}
                  className={inputCls}
                />
              </F>
              <F label="Description">
                <textarea
                  value={cur.description}
                  onChange={e => pType === 'physical' ? sp('description', e.target.value) : sd('description', e.target.value)}
                  placeholder="Describe your product — what it includes, who it's for, and what makes it special…"
                  className={textareaCls}
                />
              </F>
            </div>
          </Section>

          <Divider />

          {/* 4 · Pricing */}
          <Section title="Pricing" sub="Set a selling price. Add a compare-at price to show a discount badge to buyers.">
            <div className="grid grid-cols-2 gap-4">
              <F label="Price (Rs)" required>
                <input type="number" min="0" value={cur.price}
                  onChange={e => pType === 'physical' ? sp('price', e.target.value) : sd('price', e.target.value)}
                  placeholder="1500" className={inputCls} />
              </F>
              <F label="Compare At Price (Rs)" hint="Original / crossed-out price shown to buyers">
                <input type="number" min="0" value={cur.compareAtPrice}
                  onChange={e => pType === 'physical' ? sp('compareAtPrice', e.target.value) : sd('compareAtPrice', e.target.value)}
                  placeholder="2000" className={inputCls} />
              </F>
            </div>
            {discountPct !== null && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E3F4EA] border border-[#B7E2C7] rounded-[7px]">
                <span className="text-[12px] font-bold text-[#1E7A3C]">{discountPct}% OFF</span>
                <span className="text-[11px] text-[#2D8A4E]">will be shown to buyers</span>
              </div>
            )}
          </Section>

          {/* 5a · Inventory (physical) */}
          {pType === 'physical' && (
            <>
              <Divider />
              <Section title="Inventory & Shipping" sub="Track your stock and provide shipping details.">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <F label="Stock Quantity" required>
                      <input type="number" min="0" value={phys.stock} onChange={e => sp('stock', e.target.value)} placeholder="50" className={inputCls} />
                    </F>
                    <F label="Size">
                      <input value={phys.size} onChange={e => sp('size', e.target.value)} placeholder="L, XL, 42…" className={inputCls} />
                    </F>
                    <F label="Color">
                      <input value={phys.color} onChange={e => sp('color', e.target.value)} placeholder="Red, Navy…" className={inputCls} />
                    </F>
                  </div>
                  <F label="Shipping Weight" hint="e.g. 0.3kg — used to calculate delivery charges">
                    <input value={phys.shippingWeight} onChange={e => sp('shippingWeight', e.target.value)} placeholder="e.g. 0.3kg" className={inputCls} />
                  </F>
                </div>
              </Section>
            </>
          )}

          {/* 5b · Digital file */}
          {pType === 'digital' && (
            <>
              <Divider />
              <Section title="Digital File" sub="Upload the file buyers will receive instantly after purchase.">
                <FileUpload value={dig.fileData} onChange={v => sd('fileData', v)} label="Click to upload your digital file" />
              </Section>

              <Divider />

              <Section title="Delivery Settings" sub="Control how and when buyers can access their file.">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Download Limit" hint='"unlimited" or a specific number'>
                      <input value={dig.downloadLimit} onChange={e => sd('downloadLimit', e.target.value)} placeholder="unlimited" className={inputCls} />
                    </F>
                    <F label="Link Expiry (days)" hint="Leave blank for no expiry">
                      <input type="number" min="0" value={dig.linkExpiryDays} onChange={e => sd('linkExpiryDays', e.target.value)} placeholder="No expiry" className={inputCls} />
                    </F>
                  </div>

                  <F label="License Type">
                    <div className="flex gap-2 mt-[2px]">
                      {(['personal', 'commercial'] as const).map(l => {
                        const sel = dig.licenseType === l;
                        return (
                          <button key={l} type="button" onClick={() => sd('licenseType', l)}
                            className="flex-1 py-[9px] rounded-lg cursor-pointer text-[12px] font-semibold capitalize transition-all duration-150"
                            style={{ border: `1.5px solid ${sel ? '#D97757' : '#E8E6DC'}`, background: sel ? '#FBECE4' : '#fff', color: sel ? '#D97757' : '#8C8A82' }}>
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </F>

                  <F label="Buyer Delivery Message" hint="Shown to the buyer after purchase">
                    <textarea value={dig.buyerDeliveryMessage} onChange={e => sd('buyerDeliveryMessage', e.target.value)}
                      placeholder="Thank you for your purchase! Here is your download link…" className={textareaCls} />
                  </F>

                  <div className="flex items-center justify-between py-0.5">
                    <div>
                      <p className="text-[13px] font-semibold text-charcoal">PDF Stamping</p>
                      <p className="text-[11px] text-slate mt-0.5">Watermark PDFs with the buyer's name to deter sharing</p>
                    </div>
                    <Toggle checked={dig.pdfStampingEnabled} onChange={v => sd('pdfStampingEnabled', v)} />
                  </div>
                </div>
              </Section>
            </>
          )}

          <Divider />

          {/* 6 · Tags */}
          <Section title="Tags" sub="Help buyers discover your product through search and filters.">
            <TagInput
              tags={cur.tags} input={cur.tagInput}
              onInput={v => pType === 'physical' ? sp('tagInput', v) : sd('tagInput', v)}
              onAdd={pType === 'physical' ? addPhysTag : addDigTag}
              onRemove={i => pType === 'physical' ? sp('tags', phys.tags.filter((_, idx) => idx !== i)) : sd('tags', dig.tags.filter((_, idx) => idx !== i))}
            />
            <Hint>Press Enter or comma to add a tag</Hint>
          </Section>

          <Divider />

          {/* 7 · Publish */}
          <Section title="Publish" sub="Control your product's visibility before going live.">
            <div className="flex flex-col gap-4">
              <F label="Status">
                <div className="grid grid-cols-3 gap-2 mt-[2px]">
                  {([
                    { value: 'draft'     as const, label: 'Draft'    },
                    { value: 'active'    as const, label: 'Active'   },
                    { value: 'scheduled' as const, label: 'Schedule' },
                  ]).map(({ value, label }) => {
                    const sel = cur.status === value;
                    return (
                      <button key={value} type="button"
                        onClick={() => {
                          pType === 'physical' ? sp('status', value) : sd('status', value);
                          if (value === 'scheduled') setShowScheduleModal(true);
                        }}
                        className="py-[9px] rounded-lg cursor-pointer text-[13px] font-semibold transition-all duration-150"
                        style={{ border: `1.5px solid ${sel ? '#D97757' : '#E8E6DC'}`, background: sel ? '#FBECE4' : '#fff', color: sel ? '#D97757' : '#8C8A82' }}>
                        {label}
                      </button>
                    );
                  })}
                </div>

                {cur.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="mt-2.5 w-full flex items-center justify-between px-4 py-3 rounded-[10px] border border-bone bg-[#F5F4EF] cursor-pointer hover:border-brand-orange/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <CalendarClock size={15} className="text-brand-orange shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate">Go live on</p>
                        <p className="text-[13px] font-semibold text-charcoal">
                          {cur.scheduledAt
                            ? new Date(cur.scheduledAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'No date selected — click to set'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-orange bg-brand-pale-orange px-2.5 py-1 rounded-[6px] shrink-0 group-hover:opacity-80 transition-opacity">
                      {cur.scheduledAt ? 'Change' : 'Set Date'}
                    </span>
                  </button>
                )}

                <Hint>
                  {cur.status === 'draft'
                    ? 'Draft — only visible to you, not published yet'
                    : cur.status === 'active'
                    ? 'Active — visible to buyers on your store'
                    : cur.scheduledAt
                    ? `Scheduled — will go live on ${new Date(cur.scheduledAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                    : 'Scheduled — set a date and time to continue'}
                </Hint>
              </F>

              <div className="flex items-center justify-between pt-3 border-t border-bone">
                <div>
                  <p className="text-[13px] font-semibold text-charcoal">List on Solvexo Marketplace</p>
                  <p className="text-[11px] text-slate mt-0.5">Make this product discoverable to all buyers</p>
                </div>
                <Toggle
                  checked={cur.isListedOnSolvexo}
                  onChange={v => pType === 'physical' ? sp('isListedOnSolvexo', v) : sd('isListedOnSolvexo', v)}
                />
              </div>
            </div>
          </Section>

          {/* Footer */}
          <div className="border-t border-bone bg-[#F5F4EF] rounded-b-[10px] px-6 py-4 flex items-center justify-between gap-4">
            <div>
              {error && <p className="text-[12px] text-error font-medium">{error}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="px-5 py-[9px] rounded-[9px] text-[13px] font-semibold text-slate bg-white border border-bone cursor-pointer hover:bg-cream transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-1.5 border-none rounded-[9px] px-6 py-[9px] text-[13px] font-semibold"
                style={{ background: saving ? '#E8E6DC' : '#D97757', color: saving ? '#8C8A82' : '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Create Product'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {showScheduleModal && (
        <DateTimePickerModal
          value={cur.scheduledAt}
          onChange={v => pType === 'physical' ? sp('scheduledAt', v) : sd('scheduledAt', v)}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}
