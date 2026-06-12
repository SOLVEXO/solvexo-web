import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Package, Download } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { getCachedProducts, type ProductEntry } from './_cache';

// ── Helpers ───────────────────────────────────────────────────────────────────
const FONT = "'Poppins', sans-serif";

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '3px 10px', borderRadius: 5, color, background: bg,
      fontFamily: FONT,
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
function typePill(t: string) {
  return t === 'digital'
    ? <Pill label="Digital"  color="#6D28D9" bg="#EDE9FE" />
    : <Pill label="Physical" color="#2156A8" bg="#EAF0FB" />;
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ padding: '72px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20, background: '#FAF9F5',
        border: '1px solid #E8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
      }}>
        <ShoppingBag size={30} style={{ color: '#D97757', opacity: 0.55 }} />
      </div>
      <p style={{ fontSize: 17, fontWeight: 700, color: '#141413', marginBottom: 8, fontFamily: FONT }}>
        No products yet
      </p>
      <p style={{ fontSize: 13, color: '#8C8A82', maxWidth: 330, fontFamily: FONT, marginBottom: 22, lineHeight: 1.6 }}>
        Add physical items, digital downloads, or services to start selling.
      </p>
      <button onClick={onAdd} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px',
        background: '#D97757', color: '#fff', border: 'none', borderRadius: 9,
        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
      }}>
        <Plus size={15} /> Add Your First Product
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoreProductList() {
  const navigate  = useNavigate();
  const { storeId } = useStoreWorkspace();

  const [products, setProducts] = useState<ProductEntry[]>([]);

  // Sync from in-memory cache whenever we mount (e.g. after navigating back from add/edit)
  useEffect(() => {
    setProducts(getCachedProducts(storeId));
  }, [storeId]);

  const goAdd    = () => navigate(`/seller/store/${storeId}/products/add`);
  const goEdit   = (entry: ProductEntry) =>
    navigate(`/seller/store/${storeId}/products/edit/${entry.product._id}`, { state: { entry } });
  const goDetail = (entry: ProductEntry) =>
    navigate(`/seller/store/${storeId}/products/detail/${entry.product._id}`, { state: { entry } });

  return (
    <div style={{ fontFamily: FONT, background: '#FAF9F5', minHeight: '100vh' }}>
      <StorePageHeader
        title="Products"
        subtitle={`${products.length} product${products.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={goAdd} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#D97757', color: '#fff', border: 'none',
            borderRadius: 9, padding: '9px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
          }}>
            <Plus size={15} /> Add Product
          </button>
        }
      />

      <div style={{ padding: '20px 28px' }}>
        {products.length === 0 ? (
          <EmptyState onAdd={goAdd} />
        ) : (
          <div style={{
            background: '#FFFFFF', border: '1px solid #E8E6DC',
            borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{ padding: '16px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', fontFamily: FONT }}>All Products</p>
              <span style={{ fontSize: 12, color: '#8C8A82', fontFamily: FONT }}>
                {products.length} item{products.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: FONT }}>
                <thead>
                  <tr style={{ borderTop: '1px solid #E8E6DC', borderBottom: '1px solid #E8E6DC' }}>
                    {['#', 'Product', 'Type', 'Price', 'Stock / Format', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8C8A82',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '10px 18px', fontFamily: FONT,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((entry, i) => (
                    <tr
                      key={entry.product._id}
                      style={{
                        borderBottom: i < products.length - 1 ? '1px solid #F5F4EF' : 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e  => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e  => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* S.No */}
                      <td style={{ padding: '11px 18px', color: '#8C8A82', fontWeight: 500, fontSize: 12 }}>
                        {i + 1}
                      </td>

                      {/* Product name + thumb + SKU */}
                      <td style={{ padding: '11px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: '#FBECE4', border: '1px solid #EDEBE2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          }}>
                            {entry.product.images[0]
                              ? <img src={entry.product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : entry.product.productType === 'digital'
                                ? <Download size={14} style={{ color: '#D97757' }} />
                                : <Package  size={14} style={{ color: '#D97757' }} />}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', marginBottom: 1 }}>
                              {entry.product.name}
                            </p>
                            <p style={{ fontSize: 11, color: '#8C8A82' }}>SKU: {entry.variant.sku}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: '11px 18px' }}>
                        {typePill(entry.product.productType)}
                      </td>

                      {/* Price */}
                      <td style={{ padding: '11px 18px' }}>
                        <span style={{ fontWeight: 600, color: '#141413' }}>
                          Rs {entry.variant.price.toLocaleString()}
                        </span>
                        {entry.variant.compareAtPrice != null && (
                          <span style={{ fontSize: 11, color: '#8C8A82', textDecoration: 'line-through', marginLeft: 5 }}>
                            Rs {entry.variant.compareAtPrice.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Stock / Format */}
                      <td style={{ padding: '11px 18px', color: '#4A4945' }}>
                        {entry.product.productType === 'physical'
                          ? `${entry.variant.stock} units`
                          : entry.product.digital?.downloadLimit === 'unlimited'
                            ? 'Unlimited DL'
                            : `${entry.product.digital?.downloadLimit ?? '—'} DL`}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '11px 18px' }}>
                        {statusPill(entry.product.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '11px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button
                            onClick={() => goDetail(entry)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#2156A8', fontWeight: 600, fontFamily: FONT }}
                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            Detail
                          </button>
                          <span style={{ color: '#E8E6DC' }}>|</span>
                          <button
                            onClick={() => goEdit(entry)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#D97757', fontWeight: 600, fontFamily: FONT }}
                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
