import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Package, Download } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
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
function typePill(t: string) {
  return t === 'digital'
    ? <Pill label="Digital"  color="#6D28D9" bg="#EDE9FE" />
    : <Pill label="Physical" color="#2156A8" bg="#EAF0FB" />;
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-[72px] px-5 flex flex-col items-center text-center">
      <div className="w-[72px] h-[72px] rounded-[20px] bg-bone border border-bone flex items-center justify-center mb-[18px]">
        <ShoppingBag size={30} className="text-brand-orange opacity-[0.55]" />
      </div>
      <p className="text-[17px] font-bold text-charcoal mb-2">
        No products yet
      </p>
      <p className="text-[13px] text-slate max-w-[330px] mb-[22px] leading-[1.6]">
        Add physical items, digital downloads, or services to start selling.
      </p>
      <button onClick={onAdd} className="flex items-center gap-1.5 px-[22px] py-[10px] bg-brand-orange text-white border-none rounded-[9px] text-[13px] font-semibold cursor-pointer">
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

  useEffect(() => {
    setProducts(getCachedProducts(storeId));
  }, [storeId]);

  const goAdd    = () => navigate(`/seller/store/${storeId}/products/add`);
  const goEdit   = (entry: ProductEntry) =>
    navigate(`/seller/store/${storeId}/products/edit/${entry.product._id}`, { state: { entry } });
  const goDetail = (entry: ProductEntry) =>
    navigate(`/seller/store/${storeId}/products/detail/${entry.product._id}`, { state: { entry } });

  return (
    <div className="bg-bone min-h-screen">
      <StorePageHeader
        title="Products"
        subtitle={`${products.length} product${products.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={goAdd} className="flex items-center gap-1.5 bg-brand-orange text-white border-none rounded-[9px] px-4 py-[9px] text-[13px] font-semibold cursor-pointer">
            <Plus size={15} /> Add Product
          </button>
        }
      />

      <div className="px-7 py-5">
        {products.length === 0 ? (
          <EmptyState onAdd={goAdd} />
        ) : (
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Table header */}
            <div className="px-5 pt-4 pb-2.5 flex items-center justify-between">
              <p className="text-[14px] font-bold text-charcoal">All Products</p>
              <span className="text-[12px] text-slate">
                {products.length} item{products.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-t border-b border-bone">
                    {['#', 'Product', 'Type', 'Price', 'Stock / Format', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-slate uppercase tracking-[0.05em] px-[18px] py-[10px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((entry, i) => (
                    <tr
                      key={entry.product._id}
                      className="transition-colors duration-[120ms]"
                      style={{
                        borderBottom: i < products.length - 1 ? '1px solid #F5F4EF' : 'none',
                      }}
                      onMouseEnter={e  => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e  => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* S.No */}
                      <td className="px-[18px] py-[11px] text-slate font-medium text-[12px]">
                        {i + 1}
                      </td>

                      {/* Product name + thumb + SKU */}
                      <td className="px-[18px] py-[11px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg shrink-0 bg-brand-pale-orange border border-[#EDEBE2] flex items-center justify-center overflow-hidden">
                            {entry.product.images[0]
                              ? <img src={entry.product.images[0]} alt="" className="w-full h-full object-cover" />
                              : entry.product.productType === 'digital'
                                ? <Download size={14} className="text-brand-orange" />
                                : <Package  size={14} className="text-brand-orange" />}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-charcoal mb-[1px]">
                              {entry.product.name}
                            </p>
                            <p className="text-[11px] text-slate">SKU: {entry.variant.sku}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-[18px] py-[11px]">
                        {typePill(entry.product.productType)}
                      </td>

                      {/* Price */}
                      <td className="px-[18px] py-[11px]">
                        <span className="font-semibold text-charcoal">
                          Rs {entry.variant.price.toLocaleString()}
                        </span>
                        {entry.variant.compareAtPrice != null && (
                          <span className="text-[11px] text-slate line-through ml-[5px]">
                            Rs {entry.variant.compareAtPrice.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Stock / Format */}
                      <td className="px-[18px] py-[11px] text-[#4A4945]">
                        {entry.product.productType === 'physical'
                          ? `${entry.variant.stock} units`
                          : entry.product.digital?.downloadLimit === 'unlimited'
                            ? 'Unlimited DL'
                            : `${entry.product.digital?.downloadLimit ?? '—'} DL`}
                      </td>

                      {/* Status */}
                      <td className="px-[18px] py-[11px]">
                        {statusPill(entry.product.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-[18px] py-[11px]">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => goDetail(entry)}
                            className="bg-transparent border-none cursor-pointer text-[12px] text-[#2156A8] font-semibold hover:underline"
                          >
                            Detail
                          </button>
                          <span className="text-bone">|</span>
                          <button
                            onClick={() => goEdit(entry)}
                            className="bg-transparent border-none cursor-pointer text-[12px] text-brand-orange font-semibold hover:underline"
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
