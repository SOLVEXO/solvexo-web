import { clsx } from 'clsx';
import { Search, Camera } from 'lucide-react';
import { HELD_SALES } from '../../pos.data';
import type { CartItem, PosProduct } from '../../pos.types';

interface ProductGridProps {
  cart:              CartItem[];
  addItem:           (p: PosProduct) => void;
  searchQuery:       string;
  setSearchQuery:    (q: string) => void;
  activeCategory:    string;
  setActiveCategory: (c: string) => void;
  categories:        string[];
  filtered:          PosProduct[];
}

export function ProductGrid({
  cart, addItem,
  searchQuery, setSearchQuery,
  activeCategory, setActiveCategory,
  categories, filtered,
}: ProductGridProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-carbon">

      {/* Search bar */}
      <div className="flex gap-2 items-center px-4 py-[10px] bg-pos-surface border-b border-carbon shrink-0">
        <div className="flex-1 flex items-center bg-carbon rounded-lg overflow-hidden">
          <Search size={13} className="ml-3 shrink-0 text-pos-faint" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products or scan barcode (SKU)..."
            className="flex-1 px-3 py-2 text-[13px] bg-transparent border-0 outline-none text-white"
          />
        </div>
        <button className="px-[14px] py-[7px] bg-carbon border-0 rounded-lg text-[12px] cursor-pointer flex items-center gap-[6px] shrink-0 text-pos-faint">
          <Camera size={12} /> Scan
        </button>
        <button className="px-[14px] py-[7px] bg-carbon border-0 rounded-lg text-[12px] cursor-pointer shrink-0 text-pos-faint">
          + Custom Item
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-[6px] px-4 py-2 bg-pos-surface border-b border-carbon shrink-0 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              'shrink-0 px-[14px] py-[5px] rounded-[20px] text-[11px] font-medium cursor-pointer border-0',
              activeCategory === cat
                ? 'bg-brand-orange text-white'
                : 'bg-charcoal text-pos-faint',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product cards grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
          {filtered.map(p => {
            const inCart = cart.find(i => i.name === p.name);
            return (
              <button
                key={p.name}
                onClick={() => addItem(p)}
                className={clsx(
                  'relative flex flex-col items-center px-[14px] pt-5 pb-4 rounded-xl text-center transition-[border-color] duration-150 bg-pos-surface border min-h-0',
                  inCart ? 'border-brand-orange' : 'border-charcoal',
                  p.stock === 0 ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
                )}
              >
                {/* Qty badge */}
                {inCart && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center">
                    {inCart.qty}
                  </div>
                )}

                {/* Icon */}
                <div className="w-12 h-12 mb-[10px] flex items-center justify-center shrink-0">
                  <p.icon
                    size={30}
                    className={clsx('text-brand-orange', p.stock === 0 && 'opacity-30')}
                  />
                </div>

                {/* Name */}
                <span className="block text-[12px] font-semibold text-white leading-[1.35] mb-1 break-words">
                  {p.name}
                </span>

                {/* SKU */}
                <span className="block text-[10px] mb-2 text-pos-muted">
                  {p.sku}
                </span>

                {/* Price */}
                <span className={clsx(
                  'block text-[15px] font-bold',
                  p.stock === 0 ? 'text-pos-muted' : 'text-brand-orange',
                )}>
                  ${p.price.toFixed(2)}
                </span>

                {/* Stock states */}
                {p.stock > 0 && p.stock <= 8 && (
                  <span className="block text-[10px] mt-1 text-warning">Low: {p.stock} left</span>
                )}
                {p.stock === 0 && (
                  <span className="block text-[10px] mt-1 text-error">Out of stock</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Held sales bar */}
      {HELD_SALES.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-pos-surface border-t border-carbon shrink-0">
          <span className="text-[11px] shrink-0 text-pos-muted">On Hold:</span>
          {HELD_SALES.map(h => (
            <button
              key={h.id}
              className="flex items-center gap-2 px-3 py-[5px] bg-carbon border-0 rounded-lg cursor-pointer"
            >
              <span className="text-[11px] font-medium text-white">{h.customer}</span>
              <span className="text-[11px] text-brand-orange">${h.total.toFixed(2)}</span>
              <span className="text-[10px] text-pos-muted">{h.time}</span>
            </button>
          ))}
          <button className="ml-auto px-3 py-[5px] bg-transparent border border-carbon rounded-lg cursor-pointer text-[11px] text-pos-faint">
            Hold Current Sale
          </button>
        </div>
      )}
    </div>
  );
}
