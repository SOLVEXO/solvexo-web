import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Package, Download, Loader2, CalendarClock } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import {
  apiGetMyProductById, apiEditPhysicalProduct, apiEditDigitalProduct,
  type StoreProduct, type ProductVariant,
} from '@/api/commerce/product';
import { getCachedProducts, updateCachedProduct, type ProductEntry } from './_cache';
import { ImageUpload, FileUpload, type PrivateUploadData, DateTimePickerModal } from '@/components/comman/ui';

type ProductStatus = 'draft' | 'active' | 'scheduled';

// ── Primitives (shared with Add page) ─────────────────────────────────────────
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
    <button type="button" onClick={() => onChange(!checked)}
      className="w-10 h-[22px] rounded-[11px] border-none cursor-pointer p-0 relative shrink-0 transition-colors duration-[180ms]"
      style={{ background: checked ? '#D97757' : '#D1D5DB' }}>
      <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-[180ms]" style={{ left: checked ? 21 : 3 }} />
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
      <input value={input} onChange={e => onInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(); } }}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter…' : ''}
        className="border-none outline-none text-[12px] flex-[1_1_80px] min-w-[80px] bg-transparent text-charcoal placeholder:text-[#B5B3AC]" />
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────────
const blankPhys = {
  name: '', description: '', price: '', compareAtPrice: '',
  stock: '', size: '', color: '', shippingWeight: '',
  status: 'draft' as ProductStatus, scheduledAt: '', isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[], images: [] as string[],
};
const blankDig = {
  name: '', description: '', price: '', compareAtPrice: '',
  status: 'draft' as ProductStatus, scheduledAt: '', isListedOnSolvexo: false,
  tagInput: '', tags: [] as string[], images: [] as string[],
  fileData: null as PrivateUploadData | null,
  downloadLimit: 'unlimited', linkExpiryDays: '',
  pdfStampingEnabled: false, licenseType: 'personal' as 'personal' | 'commercial',
  buyerDeliveryMessage: '',
};
type PhysForm = typeof blankPhys;
type DigForm  = typeof blankDig;

function physFromEntry(p: StoreProduct, v: ProductVariant): PhysForm {
  return {
    name: p.name, description: p.description,
    price: String(v.price), compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : '',
    stock: String(v.stock), size: v.size ?? '', color: v.color ?? '', shippingWeight: v.shippingWeight ?? '',
    status: p.status as ProductStatus, scheduledAt: '', isListedOnSolvexo: p.isListedOnSolvexo,
    tags: [...p.tags], tagInput: '', images: [...p.images],
  };
}
function digFromEntry(p: StoreProduct, v: ProductVariant): DigForm {
  const d = p.digital, f0 = d?.files[0];
  return {
    name: p.name, description: p.description,
    price: String(v.price), compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : '',
    status: p.status as ProductStatus, scheduledAt: '', isListedOnSolvexo: p.isListedOnSolvexo,
    tags: [...p.tags], tagInput: '', images: [...p.images],
    fileData: f0 ? { publicId: f0.url, resourceType: 'raw', fileName: f0.name, fileSize: f0.size, mimeType: f0.mimeType } : null,
    downloadLimit: d?.downloadLimit ?? 'unlimited',
    linkExpiryDays: d?.linkExpiryDays != null ? String(d.linkExpiryDays) : '',
    pdfStampingEnabled: d?.pdfStampingEnabled ?? false,
    licenseType: (d?.licenseType as 'personal' | 'commercial') ?? 'personal',
    buyerDeliveryMessage: d?.buyerDeliveryMessage ?? '',
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreEditProduct() {
  const navigate           = useNavigate();
  const { state }          = useLocation() as { state: { entry?: ProductEntry } | null };
  const { productId = '' } = useParams<{ productId: string }>();
  const { storeId }        = useStoreWorkspace();

  const [fetching, setFetching] = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [pType,    setPType]    = useState<'physical' | 'digital'>('physical');
  const [variantId, setVariantId] = useState<string | null>(null);
  const [phys, setPhys] = useState<PhysForm>(blankPhys);
  const [dig,  setDig]  = useState<DigForm>(blankDig);

  const sp = <K extends keyof PhysForm>(k: K, v: PhysForm[K]) => setPhys(f => ({ ...f, [k]: v }));
  const sd = <K extends keyof DigForm> (k: K, v: DigForm[K])  => setDig(f  => ({ ...f, [k]: v }));

  function init(p: StoreProduct, v: ProductVariant) {
    setPType(p.productType);
    setVariantId(v._id || null);
    if (p.productType === 'physical') setPhys(physFromEntry(p, v));
    else                              setDig(digFromEntry(p, v));
  }

  useEffect(() => {
    const stateEntry = state?.entry;
    if (stateEntry) { init(stateEntry.product, stateEntry.variant); setFetching(false); return; }
    const cached = getCachedProducts(storeId).find(e => e.product._id === productId);
    if (cached) { init(cached.product, cached.variant); setFetching(false); return; }
    apiGetMyProductById(productId)
      .then(res => {
        const stub: ProductVariant = { _id: '', productId, sku: '', price: 0, compareAtPrice: null, size: null, color: null, stock: 0, shippingWeight: null, images: [], isDefault: true, status: 'active', isDelete: false, createdAt: '', updatedAt: '' };
        init(res.data.product, stub);
      })
      .catch(() => navigate(`/seller/store/${storeId}/products`, { replace: true }))
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cur = pType === 'physical' ? phys : dig;

  const addTag = () => {
    if (pType === 'physical') { const v = phys.tagInput.replace(',', '').trim(); if (v && !phys.tags.includes(v)) sp('tags', [...phys.tags, v]); sp('tagInput', ''); }
    else                      { const v = dig.tagInput.replace(',', '').trim();  if (v && !dig.tags.includes(v))  sd('tags', [...dig.tags, v]);  sd('tagInput', ''); }
  };

  const discountPct = (() => {
    const p = Number(cur.price), c = Number(cur.compareAtPrice);
    return p > 0 && c > p ? Math.round((1 - p / c) * 100) : null;
  })();

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      if (pType === 'physical') {
        const res = await apiEditPhysicalProduct(productId, {
          productId, name: phys.name, description: phys.description,
          subCategoryId: null, images: phys.images, tags: phys.tags,
          isListedOnSolvexo: phys.isListedOnSolvexo, status: phys.status,
          price: Number(phys.price), compareAtPrice: phys.compareAtPrice ? Number(phys.compareAtPrice) : null,
          size: phys.size, color: phys.color, stock: Number(phys.stock), shippingWeight: phys.shippingWeight,
        });
        updateCachedProduct(storeId, productId, { product: res.data.product, variant: res.data.variant });
      } else {
        const files = dig.fileData ? [{ url: dig.fileData.publicId, name: dig.fileData.fileName, size: dig.fileData.fileSize, mimeType: dig.fileData.mimeType }] : [];
        const res = await apiEditDigitalProduct(productId, {
          productId, variantId,
          name: dig.name, description: dig.description,
          status: dig.status, price: Number(dig.price),
          compareAtPrice: dig.compareAtPrice ? Number(dig.compareAtPrice) : null,
          digital: { files, downloadLimit: dig.downloadLimit, linkExpiryDays: dig.linkExpiryDays ? Number(dig.linkExpiryDays) : null, pdfStampingEnabled: dig.pdfStampingEnabled, licenseType: dig.licenseType, buyerDeliveryMessage: dig.buyerDeliveryMessage },
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream">
        <Loader2 size={24} className="text-brand-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-bone px-7 py-[14px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[17px] font-bold text-charcoal leading-tight">Edit Product</h1>
            <div className="flex items-center gap-1.5 mt-[2px]">
              {pType === 'digital'
                ? <><Download size={11} className="text-slate" /><span className="text-[11px] text-slate">Digital Product</span></>
                : <><Package  size={11} className="text-slate" /><span className="text-[11px] text-slate">Physical Product</span></>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="px-7 py-5">
        <div className="bg-white rounded-[10px] border border-bone shadow-[0_1px_4px_rgba(0,0,0,0.04)]">

          {/* Images */}
          <Section title="Product Images" sub="Upload up to 5 images. The first image is the cover shown to buyers.">
            <ImageUpload
              value={cur.images}
              onChange={urls => pType === 'physical' ? sp('images', urls) : sd('images', urls)}
              maxFiles={5}
            />
          </Section>

          <Divider />

          {/* Basic Information */}
          <Section title="Basic Information">
            <div className="flex flex-col gap-4">
              <F label="Product Name" required>
                <input value={cur.name}
                  onChange={e => pType === 'physical' ? sp('name', e.target.value) : sd('name', e.target.value)}
                  placeholder="Product name" className={inputCls} />
              </F>
              <F label="Description">
                <textarea value={cur.description}
                  onChange={e => pType === 'physical' ? sp('description', e.target.value) : sd('description', e.target.value)}
                  placeholder="Describe your product…" className={textareaCls} />
              </F>
            </div>
          </Section>

          <Divider />

          {/* Pricing */}
          <Section title="Pricing" sub="Set a selling price. Add a compare-at price to show a discount badge.">
            <div className="grid grid-cols-2 gap-4">
              <F label="Price (Rs)" required>
                <input type="number" min="0" value={cur.price}
                  onChange={e => pType === 'physical' ? sp('price', e.target.value) : sd('price', e.target.value)}
                  placeholder="1500" className={inputCls} />
              </F>
              <F label="Compare At Price (Rs)" hint="Original / crossed-out price">
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

          {/* Physical: Inventory */}
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

          {/* Digital: File + Delivery */}
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
                      placeholder="Thank you for your purchase!" className={textareaCls} />
                  </F>
                  <div className="flex items-center justify-between py-0.5">
                    <div>
                      <p className="text-[13px] font-semibold text-charcoal">PDF Stamping</p>
                      <p className="text-[11px] text-slate mt-0.5">Watermark PDFs with the buyer's name</p>
                    </div>
                    <Toggle checked={dig.pdfStampingEnabled} onChange={v => sd('pdfStampingEnabled', v)} />
                  </div>
                </div>
              </Section>
            </>
          )}

          <Divider />

          {/* Tags */}
          <Section title="Tags" sub="Help buyers discover your product through search and filters.">
            <TagInput
              tags={cur.tags} input={cur.tagInput}
              onInput={v => pType === 'physical' ? sp('tagInput', v) : sd('tagInput', v)}
              onAdd={addTag}
              onRemove={i => pType === 'physical' ? sp('tags', phys.tags.filter((_, idx) => idx !== i)) : sd('tags', dig.tags.filter((_, idx) => idx !== i))}
            />
            <Hint>Press Enter or comma to add a tag</Hint>
          </Section>

          <Divider />

          {/* Publish */}
          <Section title="Publish" sub="Control your product's visibility.">
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
                <Toggle checked={cur.isListedOnSolvexo} onChange={v => pType === 'physical' ? sp('isListedOnSolvexo', v) : sd('isListedOnSolvexo', v)} />
              </div>
            </div>
          </Section>

          {/* Footer */}
          <div className="border-t border-bone bg-[#F5F4EF] rounded-b-[10px] px-6 py-4 flex items-center justify-between gap-4">
            <div>{error && <p className="text-[12px] text-error font-medium">{error}</p>}</div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="px-5 py-[9px] rounded-[9px] text-[13px] font-semibold text-slate bg-white border border-bone cursor-pointer hover:bg-cream transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-1.5 border-none rounded-[9px] px-6 py-[9px] text-[13px] font-semibold"
                style={{ background: saving ? '#E8E6DC' : '#D97757', color: saving ? '#8C8A82' : '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Changes'}
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
