import { clsx } from 'clsx';
import { Search, ScanLine, ChevronLeft, ChevronRight, ImageOff, X, RotateCcw, PackageSearch, Pause } from 'lucide-react';
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
    products, productsLoading, productsError, reloadProducts,
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
    <div className="flex-1 flex flex-col min-h-[420px] lg:min-h-0 lg:overflow-hidden lg:border-r border-pos-border bg-pos-bg">

      {/* Search bar */}
      <div className="flex flex-col gap-[6px] px-4 sm:px-5 py-4 bg-pos-surface-2 border-b border-pos-border shrink-0">
        <div className={clsx(
          'flex items-center h-[52px] bg-pos-surface rounded-2xl border overflow-hidden',
          'transition-colors duration-200',
          'focus-within:border-brand-orange/50',
          barcodeError ? 'border-error/50' : 'border-pos-border',
        )}>
          <Search size={17} className="ml-4 shrink-0 text-pos-faint" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products, or scan a barcode…"
            className="flex-1 px-3 py-[10px] text-[15px] bg-transparent border-0 outline-none text-white placeholder:text-pos-muted min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="w-11 h-11 shrink-0 flex items-center justify-center bg-transparent border-0 cursor-pointer text-pos-faint hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <div className="w-px h-6 bg-pos-border shrink-0" />
          <div className="w-11 h-11 shrink-0 flex items-center justify-center text-pos-muted" title="Barcode scanner ready">
            <ScanLine size={17} />
          </div>
        </div>
        {barcodeError && <span className="text-[12px] text-error px-1">{barcodeError}</span>}
      </div>

      {/* Product cards grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {productsLoading ? (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-pos-border overflow-hidden">
                <div className="pos-skeleton aspect-square" />
                <div className="p-3 flex flex-col gap-2">
                  <div className="pos-skeleton h-[10px] w-4/5 rounded-full" />
                  <div className="pos-skeleton h-[14px] w-2/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-[#2A1A1A] to-pos-surface-2 border border-error/25 flex items-center justify-center mb-5 shrink-0">
              <ImageOff size={30} className="text-error" />
            </div>
            <p className="text-[15px] font-bold text-white mb-1">Failed to load products</p>
            <p className="text-[13px] text-pos-muted max-w-[300px] leading-[1.5] mb-5">{productsError}</p>
            <button
              onClick={reloadProducts}
              className="inline-flex items-center gap-[7px] h-11 px-5 rounded-xl bg-pos-surface-2 border border-pos-border-strong text-[13px] font-semibold text-white cursor-pointer transition-all duration-150 hover:bg-pos-surface-3 active:scale-[0.97]"
            >
              <RotateCcw size={14} /> Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-pos-surface-3 to-pos-surface-2 border border-pos-border-strong flex items-center justify-center mb-5 shrink-0">
              <PackageSearch size={30} className="text-pos-muted" />
            </div>
            <p className="text-[15px] font-bold text-white mb-1">No products found</p>
            <p className="text-[13px] text-pos-muted">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
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
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-pos-surface-2 border-t border-pos-border shrink-0">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="w-11 h-11 rounded-xl bg-pos-surface border border-pos-border text-white cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-pos-surface-3 active:scale-90 disabled:opacity-30 disabled:hover:bg-pos-surface disabled:active:scale-100"
          >
            <ChevronLeft size={17} />
          </button>
          <span className="text-[12.5px] font-medium text-pos-faint px-2 min-w-[92px] text-center">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="w-11 h-11 rounded-xl bg-pos-surface border border-pos-border text-white cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-pos-surface-3 active:scale-90 disabled:opacity-30 disabled:hover:bg-pos-surface disabled:active:scale-100"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      {/* Held sales bar */}
      {(heldSales.length > 0 || heldSalesLoading) && (
        <div className="flex items-center gap-[10px] px-4 py-3 bg-pos-surface-2 border-t border-pos-border shrink-0 overflow-x-auto scrollbar-hide">
          <span className="flex items-center gap-[6px] text-[12px] font-semibold shrink-0 text-warning">
            <Pause size={12} className="fill-warning" /> On Hold
          </span>
          {heldSales.map(h => (
            <div key={h._id} className="flex items-center gap-[10px] pl-[4px] pr-[6px] py-[6px] min-h-11 bg-pos-surface rounded-xl border border-pos-border shrink-0 transition-all duration-150 hover:border-pos-border-strong">
              <button
                onClick={() => resumeHeldSale(h)}
                className="flex items-center gap-[10px] bg-transparent border-0 cursor-pointer pl-[10px] transition-transform duration-100 active:scale-95"
              >
                <span className="text-[12.5px] font-medium text-white">{h.customerName}</span>
                <span className="text-[12.5px] font-bold text-brand-orange">${h.total.toFixed(2)}</span>
              </button>
              <button
                onClick={() => discardHeldSale(h._id)}
                className="w-9 h-9 shrink-0 flex items-center justify-center leading-none bg-transparent border-0 cursor-pointer text-pos-faint hover:text-error rounded-lg transition-colors duration-150"
                title="Discard held sale"
              >
                <X size={15} />
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
  const lowStock = !outOfStock && variant.stock <= 8;

  return (
    <div
      className={clsx(
        'group relative flex flex-col rounded-2xl overflow-hidden bg-pos-surface border-2 pos-surface-hover',
        inCartQty > 0 ? 'border-brand-orange' : 'border-pos-border',
      )}
    >
      {/* In-cart quantity badge */}
      {inCartQty > 0 && (
        <div className="absolute top-2 left-2 z-[1] w-7 h-7 rounded-full bg-gradient-to-br from-brand-orange to-brand-deep-orange text-white text-[12px] font-bold flex items-center justify-center border-2 border-pos-surface">
          {inCartQty}
        </div>
      )}

      {/* Stock status badge */}
      {outOfStock ? (
        <span className="absolute top-2 right-2 z-[1] px-[8px] py-[3px] rounded-full bg-error/90 backdrop-blur-sm text-white text-[9.5px] font-bold">
          Out of stock
        </span>
      ) : lowStock ? (
        <span className="absolute top-2 right-2 z-[1] px-[8px] py-[3px] rounded-full bg-warning/90 backdrop-blur-sm text-white text-[9.5px] font-bold">
          Low: {variant.stock}
        </span>
      ) : null}

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
          'flex flex-col w-full bg-transparent border-0 text-left transition-transform duration-100',
          outOfStock ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]',
        )}
      >
        <div className={clsx('aspect-square w-full shrink-0 overflow-hidden bg-pos-surface-2', outOfStock && 'grayscale opacity-50')}>
          {product.image ? (
            <img
              loading="lazy" decoding="async" src={product.image} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={26} className="text-pos-muted" />
            </div>
          )}
        </div>

        <div className="px-3 pt-[10px] pb-3 flex flex-col gap-[2px]">
          <span className="block text-[12.5px] font-semibold text-white leading-[1.35] line-clamp-2 min-h-[34px]">
            {product.name}
          </span>
          <span className="block text-[10px] text-pos-muted mb-[2px]">{variant.sku}</span>
          <span className={clsx('block text-[17px] font-bold', outOfStock ? 'text-pos-muted' : 'text-brand-orange')}>
            ${variant.price.toFixed(2)}
          </span>
        </div>
      </button>

      {variants.length > 1 && (
        <div className="px-3 pb-3 -mt-1">
          <div className="relative">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-full h-11 appearance-none bg-pos-surface-2 border border-pos-border rounded-xl pl-3 pr-8 text-[12px] font-medium text-white outline-none cursor-pointer transition-colors duration-150 hover:border-pos-border-strong"
            >
              {variants.map(v => (
                <option key={v.variantId} value={v.variantId}>
                  {[v.size, v.color].filter(Boolean).join(' / ') || v.sku}
                </option>
              ))}
            </select>
            <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-pos-faint" />
          </div>
        </div>
      )}
    </div>
  );
}

export type { CartItem };
