import { clsx } from 'clsx';
import { Search, ScanLine, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useState } from 'react';
import type { CartItem, POSSaleState } from '../../pos.types';

interface ProductGridProps {
  sale: POSSaleState;
}

// A barcode scanner acts like a keyboard: it types the code then sends Enter.
// Anything numeric ending in Enter is treated as a scan; everything else is a
// live text search — one input handles both, no separate "scan mode" needed.
const BARCODE_PATTERN = /^\d{6,}$/;

export function ProductGrid({ sale }: ProductGridProps) {
  const {
    products, productsLoading, productsError,
    searchQuery, setSearchQuery, page, totalPages, setPage,
    lookupBarcode, barcodeError,
    cart, addItem,
    heldSales, heldSalesLoading, resumeHeldSale, discardHeldSale,
  } = sale;

  function cartQtyFor(variantId: string) {
    return cart.find(i => i.variantId === variantId)?.qty ?? 0;
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const value = searchQuery.trim();
    if (BARCODE_PATTERN.test(value)) lookupBarcode(value);
  }

  return (
    <div className="flex-1 flex flex-col min-h-[420px] lg:min-h-0 lg:overflow-hidden lg:border-r border-carbon">

      {/* Search bar */}
      <div className="flex flex-col gap-1 px-4 py-3 bg-pos-surface border-b border-carbon shrink-0">
        <div className="flex items-center bg-carbon rounded-lg overflow-hidden transition-shadow duration-200 focus-within:shadow-md">
          <Search size={13} className="ml-3 shrink-0 text-pos-faint" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products, or scan a barcode…"
            className="flex-1 px-3 py-[10px] text-[13px] bg-transparent border-0 outline-none text-white"
          />
          <ScanLine size={13} className="mr-3 shrink-0 text-pos-muted" />
        </div>
        {barcodeError && <span className="text-[11px] text-error px-1">{barcodeError}</span>}
      </div>

      {/* Product cards grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {productsLoading ? (
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[168px] rounded-xl bg-pos-surface border border-charcoal animate-pulse" />
            ))}
          </div>
        ) : productsError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-carbon border border-charcoal flex items-center justify-center mb-4 shrink-0">
              <ImageOff size={28} className="text-error" />
            </div>
            <p className="text-[13px] font-semibold text-white mb-1">Failed to load products</p>
            <p className="text-[12px] text-pos-muted max-w-[280px] leading-[1.5]">{productsError}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-carbon border border-charcoal flex items-center justify-center mb-4 shrink-0">
              <Search size={28} className="text-pos-muted" />
            </div>
            <p className="text-[13px] font-semibold text-white mb-1">No products found</p>
            <p className="text-[12px] text-pos-muted">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
            {products.map(p => (
              <ProductCard
                key={p.productId}
                product={p}
                cartQtyFor={cartQtyFor}
                onAdd={addItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!searchQuery && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-4 py-[10px] bg-pos-surface border-t border-carbon shrink-0">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="w-9 h-9 rounded-lg bg-carbon border-0 text-white cursor-pointer flex items-center justify-center transition-transform duration-100 active:scale-90 disabled:opacity-30 disabled:active:scale-100"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11px] text-pos-muted">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="w-9 h-9 rounded-lg bg-carbon border-0 text-white cursor-pointer flex items-center justify-center transition-transform duration-100 active:scale-90 disabled:opacity-30 disabled:active:scale-100"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Held sales bar */}
      {(heldSales.length > 0 || heldSalesLoading) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-pos-surface border-t border-carbon shrink-0 overflow-x-auto">
          <span className="text-[11px] shrink-0 text-pos-muted">On Hold:</span>
          {heldSales.map(h => (
            <div key={h._id} className="flex items-center gap-2 pl-[14px] pr-2 py-[6px] bg-carbon rounded-lg shrink-0 transition-shadow duration-150 hover:shadow-sm">
              <button
                onClick={() => resumeHeldSale(h)}
                className="bg-transparent border-0 cursor-pointer flex items-center gap-2 transition-transform duration-100 active:scale-95"
              >
                <span className="text-[11px] font-medium text-white">{h.customerName}</span>
                <span className="text-[11px] text-brand-orange">${h.total.toFixed(2)}</span>
              </button>
              <button
                onClick={() => discardHeldSale(h._id)}
                className="text-[13px] leading-none bg-transparent border-0 cursor-pointer text-[#6A6862] p-[6px] -m-[6px] rounded-md transition-transform duration-100 active:scale-90"
                title="Discard held sale"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product, cartQtyFor, onAdd,
}: {
  product: POSSaleState['products'][number];
  cartQtyFor: (variantId: string) => number;
  onAdd: (item: Parameters<POSSaleState['addItem']>[0]) => void;
}) {
  const variants = product.variants ?? [];
  const [selectedId, setSelectedId] = useState(
    variants.find(v => v.isDefault)?.variantId ?? variants[0]?.variantId ?? '',
  );
  const variant = variants.find(v => v.variantId === selectedId) ?? variants[0];

  if (!variant) return null;

  const inCartQty = cartQtyFor(variant.variantId);
  const outOfStock = variant.stock <= 0;

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center px-4 py-5 rounded-xl text-center bg-pos-surface border shadow-xs hover:shadow-md transition-all duration-200',
        inCartQty > 0 ? 'border-brand-orange' : 'border-charcoal',
      )}
    >
      {inCartQty > 0 && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-orange text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
          {inCartQty}
        </div>
      )}

      <button
        onClick={() => !outOfStock && onAdd({
          productId: product.productId,
          variantId: variant.variantId,
          name:      product.name,
          sku:       variant.sku,
          image:     product.image,
          price:     variant.price,
          stock:     variant.stock,
        })}
        disabled={outOfStock}
        className={clsx(
          'flex flex-col items-center w-full bg-transparent border-0 transition-transform duration-100',
          outOfStock ? 'cursor-not-allowed opacity-45' : 'cursor-pointer active:scale-[0.96]',
        )}
      >
        <div className="w-16 h-16 mb-3 flex items-center justify-center shrink-0 rounded-lg overflow-hidden bg-carbon">
          {product.image ? (
            <img loading="lazy" decoding="async" src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ImageOff size={22} className="text-pos-muted" />
          )}
        </div>

        <span className="block text-[12px] font-semibold text-white leading-[1.35] mb-1 break-words">
          {product.name}
        </span>
        <span className="block text-[10px] mb-2 text-pos-muted">{variant.sku}</span>
        <span className={clsx('block text-[15px] font-bold', outOfStock ? 'text-pos-muted' : 'text-brand-orange')}>
          ${variant.price.toFixed(2)}
        </span>

        {!outOfStock && variant.stock <= 8 && (
          <span className="block text-[10px] mt-1 text-warning">Low: {variant.stock} left</span>
        )}
        {outOfStock && <span className="block text-[10px] mt-1 text-error">Out of stock</span>}
      </button>

      {variants.length > 1 && (
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          onClick={e => e.stopPropagation()}
          className="mt-3 w-full bg-carbon border-0 rounded-md px-2 py-[6px] text-[10px] text-white outline-none"
        >
          {variants.map(v => (
            <option key={v.variantId} value={v.variantId}>
              {[v.size, v.color].filter(Boolean).join(' / ') || v.sku}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export type { CartItem };
