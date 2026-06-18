import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Package, Download, Tag, Globe,
  ShoppingBag, Loader2, Calendar, CheckCircle, XCircle,
} from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiGetMyProductById } from '@/api/commerce/product';
import { getCachedProducts, type ProductEntry } from './_cache';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold px-[10px] py-[3px] rounded-[5px]"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}
function statusPill(s: string) {
  if (s === 'active')   return <Pill label="Active"   color="#1E7A3C" bg="#E3F4EA" />;
  if (s === 'archived') return <Pill label="Archived" color="#6B7280" bg="#F3F4F6" />;
  return <Pill label="Draft" color="#B36200" bg="#FFF0E0" />;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-[10px] border-b border-bone">
      <span className="text-[12px] text-slate shrink-0 mr-4 pt-[1px]">{label}</span>
      <span className="text-[13px] text-charcoal text-right">{value ?? '—'}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="px-5 py-[14px] border-b border-bone flex items-center gap-2">
        {Icon && <Icon size={15} className="text-brand-orange" />}
        <p className="text-[13px] font-bold text-charcoal m-0">{title}</p>
      </div>
      <div className="px-5 pt-1 pb-[14px]">{children}</div>
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoreProductDetail() {
  const navigate           = useNavigate();
  const { state }          = useLocation() as { state: { entry?: ProductEntry } | null };
  const { productId = '' } = useParams<{ productId: string }>();
  const { storeId }        = useStoreWorkspace();

  const [entry,    setEntry]    = useState<ProductEntry | null>(state?.entry ?? null);
  const [fetching, setFetching] = useState(!state?.entry);

  useEffect(() => {
    if (state?.entry) return;
    // try cache first
    const cached = getCachedProducts(storeId).find(e => e.product._id === productId);
    if (cached) { setEntry(cached); setFetching(false); return; }
    // fetch from API
    apiGetMyProductById(productId)
      .then(res => setEntry({ product: res.data.product, variant: { _id: '', productId, sku: '—', price: 0, compareAtPrice: null, size: null, color: null, stock: 0, shippingWeight: null, images: [], isDefault: true, status: 'active', isDelete: false, createdAt: '', updatedAt: '' } }))
      .catch(() => navigate(`/seller/store/${storeId}/products`, { replace: true }))
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-screen bg-bone">
        <Loader2 size={24} className="text-brand-orange animate-spin" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!entry) return null;
  const { product: p, variant: v } = entry;
  const isDigital = p.productType === 'digital';

  return (
    <div className="bg-bone min-h-screen">
      {/* ── Header ── */}
      <div className="bg-white border-b border-bone px-7 py-[14px] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-transparent border-none cursor-pointer text-slate flex items-center gap-[5px] p-0 text-[13px]"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-bone text-[16px]">|</span>
          <div>
            <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">{p.name}</h1>
            <div className="flex items-center gap-2 mt-[3px]">
              {statusPill(p.status)}
              <span className="text-[11px] text-slate">/{p.slug}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/seller/store/${storeId}/products/edit/${p._id}`, { state: { entry } })}
          className="flex items-center gap-1.5 bg-brand-orange text-white border-none rounded-[9px] px-[18px] py-[10px] text-[13px] font-semibold cursor-pointer"
        >
          <Edit2 size={14} /> Edit Product
        </button>
      </div>

      <div className="px-7 py-6 grid gap-5 items-start" style={{ gridTemplateColumns: '1fr 300px' }}>

        {/* ── Left ── */}
        <div>
          {/* Basic info */}
          <Card title="Basic Information" icon={ShoppingBag}>
            <InfoRow label="Product Name"  value={<strong>{p.name}</strong>} />
            <InfoRow label="Product Type"  value={
              <div className="flex items-center gap-1.5">
                {isDigital ? <Download size={12} className="text-brand-orange" /> : <Package size={12} className="text-brand-orange" />}
                {isDigital ? 'Digital' : 'Physical'}
              </div>
            } />
            <InfoRow label="Category"      value={p.categoryId || '—'} />
            <InfoRow label="Sub-Category"  value={p.subCategoryId || '—'} />
            {p.description && (
              <div className="py-[10px]">
                <p className="text-[12px] text-slate mb-[5px]">Description</p>
                <p className="text-[13px] text-charcoal leading-[1.7]">{p.description}</p>
              </div>
            )}
          </Card>

          {/* Pricing */}
          <Card title="Pricing" icon={Tag}>
            <InfoRow label="Selling Price"    value={<span className="font-bold text-charcoal">Rs {v.price.toLocaleString()}</span>} />
            <InfoRow label="Compare At Price" value={v.compareAtPrice != null ? <span className="line-through text-slate">Rs {v.compareAtPrice.toLocaleString()}</span> : '—'} />
            {v.compareAtPrice != null && v.compareAtPrice > v.price && (
              <InfoRow label="Discount"
                value={<span className="text-[#1E7A3C] font-semibold">
                  {Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100)}% off
                </span>}
              />
            )}
          </Card>

          {/* Physical inventory */}
          {!isDigital && (
            <Card title="Inventory & Shipping" icon={Package}>
              <InfoRow label="SKU"             value={<code className="text-[12px] bg-bone px-[6px] py-[2px] rounded">{v.sku}</code>} />
              <InfoRow label="Stock"           value={`${v.stock} units`} />
              <InfoRow label="Size"            value={v.size || '—'} />
              <InfoRow label="Color"           value={v.color || '—'} />
              <InfoRow label="Shipping Weight" value={v.shippingWeight || '—'} />
            </Card>
          )}

          {/* Digital delivery */}
          {isDigital && p.digital && (
            <Card title="Digital Delivery" icon={Download}>
              {p.digital.files.length > 0 ? (
                <div className="py-[10px] border-b border-bone">
                  <p className="text-[12px] text-slate mb-2">Attached File</p>
                  {p.digital.files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-bone border border-bone rounded-lg px-3 py-[10px]">
                      <Download size={14} className="text-brand-orange shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">{f.name}</p>
                        <p className="text-[11px] text-slate">{f.mimeType} · {f.size > 0 ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <InfoRow label="File" value="No file attached" />
              )}
              <InfoRow label="Download Limit"   value={p.digital.downloadLimit === 'unlimited' ? 'Unlimited' : p.digital.downloadLimit} />
              <InfoRow label="Link Expiry"       value={p.digital.linkExpiryDays ? `${p.digital.linkExpiryDays} days` : 'No expiry'} />
              <InfoRow label="License Type"      value={<span className="capitalize">{p.digital.licenseType}</span>} />
              <InfoRow label="PDF Stamping"      value={p.digital.pdfStampingEnabled
                ? <span className="flex items-center gap-1 text-[#1E7A3C]"><CheckCircle size={13} /> Enabled</span>
                : <span className="flex items-center gap-1 text-slate"><XCircle size={13} /> Disabled</span>} />
              {p.digital.buyerDeliveryMessage && (
                <div className="py-[10px]">
                  <p className="text-[12px] text-slate mb-[5px]">Buyer Message</p>
                  <p className="text-[13px] text-charcoal leading-[1.6] italic">
                    "{p.digital.buyerDeliveryMessage}"
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Tags */}
          {p.tags.length > 0 && (
            <Card title="Tags" icon={Tag}>
              <div className="flex flex-wrap gap-1.5 pt-2.5">
                {p.tags.map((t, i) => (
                  <span key={i} className="bg-bone border border-bone rounded-[6px] px-[10px] py-1 text-[12px] text-[#4A4945]">
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div>
          {/* Summary card */}
          <div className="bg-white border border-bone rounded-[10px] overflow-hidden mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            {/* Product image / icon */}
            <div className="h-[160px] bg-bone flex items-center justify-center relative">
              {p.images[0]
                ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                : <div className="flex flex-col items-center gap-2">
                    {isDigital ? <Download size={32} className="text-brand-orange opacity-40" /> : <Package size={32} className="text-brand-orange opacity-40" />}
                    <span className="text-[11px] text-slate">No image</span>
                  </div>}
            </div>
            <div className="px-4 py-[14px]">
              <p className="text-[14px] font-bold text-charcoal mb-1">{p.name}</p>
              <div className="flex items-center gap-1.5 mb-2.5">
                {statusPill(p.status)}
              </div>
              <p className="text-[20px] font-bold text-brand-orange">
                Rs {v.price.toLocaleString()}
              </p>
              {!isDigital && (
                <p className="text-[12px] text-slate mt-1">{v.stock} in stock</p>
              )}
            </div>
          </div>

          {/* Settings */}
          <Card title="Settings" icon={Globe}>
            <InfoRow
              label="Solvexo Marketplace"
              value={p.isListedOnSolvexo
                ? <span className="flex items-center gap-1 text-[#1E7A3C]"><CheckCircle size={13} /> Listed</span>
                : <span className="flex items-center gap-1 text-slate"><XCircle size={13} /> Not listed</span>}
            />
            {!isDigital && <InfoRow label="SKU" value={<code className="text-[11px] bg-bone px-[6px] py-[2px] rounded">{v.sku}</code>} />}
          </Card>

          {/* Timestamps */}
          <Card title="Timeline" icon={Calendar}>
            <InfoRow label="Created"      value={formatDate(p.createdAt)} />
            <InfoRow label="Last Updated" value={formatDate(p.updatedAt)} />
            <InfoRow label="Product ID"   value={<span className="text-[10px] text-slate break-all">{p._id}</span>} />
          </Card>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
