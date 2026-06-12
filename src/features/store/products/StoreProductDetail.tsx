import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Package, Download, Tag, Globe,
  ShoppingBag, Loader2, Calendar, Hash, CheckCircle, XCircle,
} from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiGetMyProductById } from '@/api/commerce/product';
import { getCachedProducts, type ProductEntry } from './_cache';

const FONT   = "'Poppins', sans-serif";
const ACCENT = '#D97757';
const BORDER = '#E8E6DC';
const MUTED  = '#8C8A82';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '3px 10px', borderRadius: 5, color, background: bg, fontFamily: FONT,
    }}>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT, flexShrink: 0, marginRight: 16, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#141413', fontFamily: FONT, textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={15} style={{ color: ACCENT }} />}
        <p style={{ fontSize: 13, fontWeight: 700, color: '#141413', fontFamily: FONT, margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: '4px 20px 14px' }}>{children}</div>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FAF9F5' }}>
        <Loader2 size={24} style={{ color: ACCENT, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!entry) return null;
  const { product: p, variant: v } = entry;
  const isDigital = p.productType === 'digital';

  return (
    <div style={{ fontFamily: FONT, background: '#FAF9F5', minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${BORDER}`,
        padding: '14px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', gap: 5, padding: 0, fontSize: 13, fontFamily: FONT }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span style={{ color: BORDER, fontSize: 16 }}>|</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', lineHeight: 1.3 }}>{p.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
              {statusPill(p.status)}
              <span style={{ fontSize: 11, color: MUTED }}>/{p.slug}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/seller/store/${storeId}/products/edit/${p._id}`, { state: { entry } })}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: ACCENT, color: '#fff', border: 'none',
            borderRadius: 9, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
          }}
        >
          <Edit2 size={14} /> Edit Product
        </button>
      </div>

      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ── Left ── */}
        <div>
          {/* Basic info */}
          <Card title="Basic Information" icon={ShoppingBag}>
            <InfoRow label="Product Name"  value={<strong>{p.name}</strong>} />
            <InfoRow label="Product Type"  value={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isDigital ? <Download size={12} style={{ color: ACCENT }} /> : <Package size={12} style={{ color: ACCENT }} />}
                {isDigital ? 'Digital' : 'Physical'}
              </div>
            } />
            <InfoRow label="Category"      value={p.categoryId || '—'} />
            <InfoRow label="Sub-Category"  value={p.subCategoryId || '—'} />
            {p.description && (
              <div style={{ padding: '10px 0' }}>
                <p style={{ fontSize: 12, color: MUTED, marginBottom: 5, fontFamily: FONT }}>Description</p>
                <p style={{ fontSize: 13, color: '#141413', lineHeight: 1.7, fontFamily: FONT }}>{p.description}</p>
              </div>
            )}
          </Card>

          {/* Pricing */}
          <Card title="Pricing" icon={Tag}>
            <InfoRow label="Selling Price"    value={<span style={{ fontWeight: 700, color: '#141413' }}>Rs {v.price.toLocaleString()}</span>} />
            <InfoRow label="Compare At Price" value={v.compareAtPrice != null ? <span style={{ textDecoration: 'line-through', color: MUTED }}>Rs {v.compareAtPrice.toLocaleString()}</span> : '—'} />
            {v.compareAtPrice != null && v.compareAtPrice > v.price && (
              <InfoRow label="Discount"
                value={<span style={{ color: '#1E7A3C', fontWeight: 600 }}>
                  {Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100)}% off
                </span>}
              />
            )}
          </Card>

          {/* Physical inventory */}
          {!isDigital && (
            <Card title="Inventory & Shipping" icon={Package}>
              <InfoRow label="SKU"             value={<code style={{ fontSize: 12, background: '#FAF9F5', padding: '2px 6px', borderRadius: 4 }}>{v.sku}</code>} />
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
                <div style={{ padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 8, fontFamily: FONT }}>Attached File</p>
                  {p.digital.files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAF9F5', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>
                      <Download size={14} style={{ color: ACCENT, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                        <p style={{ fontSize: 11, color: MUTED }}>{f.mimeType} · {f.size > 0 ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <InfoRow label="File" value="No file attached" />
              )}
              <InfoRow label="Download Limit"   value={p.digital.downloadLimit === 'unlimited' ? 'Unlimited' : p.digital.downloadLimit} />
              <InfoRow label="Link Expiry"       value={p.digital.linkExpiryDays ? `${p.digital.linkExpiryDays} days` : 'No expiry'} />
              <InfoRow label="License Type"      value={<span style={{ textTransform: 'capitalize' }}>{p.digital.licenseType}</span>} />
              <InfoRow label="PDF Stamping"      value={p.digital.pdfStampingEnabled
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1E7A3C' }}><CheckCircle size={13} /> Enabled</span>
                : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: MUTED }}><XCircle size={13} /> Disabled</span>} />
              {p.digital.buyerDeliveryMessage && (
                <div style={{ padding: '10px 0' }}>
                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 5, fontFamily: FONT }}>Buyer Message</p>
                  <p style={{ fontSize: 13, color: '#141413', lineHeight: 1.6, fontStyle: 'italic', fontFamily: FONT }}>
                    "{p.digital.buyerDeliveryMessage}"
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Tags */}
          {p.tags.length > 0 && (
            <Card title="Tags" icon={Tag}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10 }}>
                {p.tags.map((t, i) => (
                  <span key={i} style={{
                    background: '#FAF9F5', border: `1px solid ${BORDER}`,
                    borderRadius: 6, padding: '4px 10px', fontSize: 12,
                    color: '#4A4945', fontFamily: FONT,
                  }}>
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
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* Product image / icon */}
            <div style={{ height: 160, background: '#FAF9F5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {p.images[0]
                ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {isDigital ? <Download size={32} style={{ color: ACCENT, opacity: 0.4 }} /> : <Package size={32} style={{ color: ACCENT, opacity: 0.4 }} />}
                    <span style={{ fontSize: 11, color: MUTED }}>No image</span>
                  </div>}
            </div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 4, fontFamily: FONT }}>{p.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                {statusPill(p.status)}
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: ACCENT, fontFamily: FONT }}>
                Rs {v.price.toLocaleString()}
              </p>
              {!isDigital && (
                <p style={{ fontSize: 12, color: MUTED, marginTop: 4, fontFamily: FONT }}>{v.stock} in stock</p>
              )}
            </div>
          </div>

          {/* Settings */}
          <Card title="Settings" icon={Globe}>
            <InfoRow
              label="Solvexo Marketplace"
              value={p.isListedOnSolvexo
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1E7A3C' }}><CheckCircle size={13} /> Listed</span>
                : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: MUTED }}><XCircle size={13} /> Not listed</span>}
            />
            {!isDigital && <InfoRow label="SKU" value={<code style={{ fontSize: 11, background: '#FAF9F5', padding: '2px 6px', borderRadius: 4 }}>{v.sku}</code>} />}
          </Card>

          {/* Timestamps */}
          <Card title="Timeline" icon={Calendar}>
            <InfoRow label="Created"      value={formatDate(p.createdAt)} />
            <InfoRow label="Last Updated" value={formatDate(p.updatedAt)} />
            <InfoRow label="Product ID"   value={<span style={{ fontSize: 10, color: MUTED, wordBreak: 'break-all' }}>{p._id}</span>} />
          </Card>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
