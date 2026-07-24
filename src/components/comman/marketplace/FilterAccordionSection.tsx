import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

/** Collapsible sidebar filter section — shared by the general Marketplace and the Education marketplace filter panels. */
export function FilterAccordionSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pb-5 mb-5 border-b border-bone/70 last:border-b-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-10 flex items-center justify-between mb-1 bg-transparent border-none cursor-pointer p-0 group"
      >
        <span className="text-[12px] font-bold text-carbon tracking-[0.01em] group-hover:text-brand-orange transition-colors">
          {title}
        </span>
        <span className="w-7 h-7 rounded-full flex items-center justify-center bg-cream group-hover:bg-brand-pale-orange transition-colors">
          <ChevronDown size={13} className={clsx('text-slate group-hover:text-brand-orange transition-transform duration-200', open && 'rotate-180')} />
        </span>
      </button>
      <div className={clsx('overflow-hidden transition-all duration-200', open ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0')}>
        {children}
      </div>
    </div>
  );
}

/** Rounded pill chip — used for Category (many items, wraps best as a chip cloud). */
export function FilterChipPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-[13px] min-h-9 rounded-full text-[11.5px] font-semibold border transition-all duration-150 cursor-pointer leading-none flex items-center',
        active
          ? 'bg-brand-orange text-white border-brand-orange'
          : 'bg-cream text-charcoal border-transparent hover:border-brand-orange/40 hover:text-brand-orange',
      )}
    >
      {label}
    </button>
  );
}

/** Checkbox-style filter row — used for Price/Type/Rating facets, where a
 *  vertical list of real checkboxes reads as a proper faceted-search sidebar
 *  (Amazon/Shopify pattern) rather than a wrapped cloud of pills. Custom-drawn
 *  box (not a native <input type="checkbox">) so it can match the Solvexo
 *  brand-orange fill exactly, same as everywhere else checked/active state is
 *  shown in this design system. */
export function FilterCheckboxRow({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className="w-full min-h-10 flex items-center gap-[10px] py-[7px] px-[6px] -mx-[6px] rounded-lg text-left bg-transparent border-none cursor-pointer group transition-colors duration-150 hover:bg-cream"
    >
      <span
        className={clsx(
          'shrink-0 w-[17px] h-[17px] rounded-[5px] border flex items-center justify-center transition-all duration-150',
          active ? 'bg-brand-orange border-brand-orange' : 'bg-white border-bone group-hover:border-brand-orange/40',
        )}
      >
        <Check size={11} strokeWidth={3} className={clsx('text-white transition-transform duration-150', active ? 'scale-100' : 'scale-0')} />
      </span>
      <span className={clsx('flex-1 text-[12.5px] transition-colors', active ? 'text-carbon font-semibold' : 'text-charcoal font-medium')}>
        {label}
      </span>
      {count != null && (
        <span className="text-[10.5px] text-slate tabular-nums">{count}</span>
      )}
    </button>
  );
}

// Slider bounds — the top handle means "this price and up" (same convention
// Amazon's own price slider uses), so there's no need to know the catalog's
// real max price up front.
export const PRICE_MIN = 0;
export const PRICE_MAX = 500;
export const PRICE_STEP = 5;

/** Dual-handle price range slider — two overlaid native range inputs (see the
 *  .range-thumb rules in index.css); the filled track between them is a plain
 *  div, not something either input draws itself. Shared by the general
 *  Marketplace and the Education marketplace filter panels. */
export function PriceRangeSlider({ value, onChange }: { value: [number, number]; onChange: (v: [number, number]) => void }) {
  const [lo, hi] = value;
  const pctLo = ((lo - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const pctHi = ((hi - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  return (
    <div>
      <div className="relative h-[22px] flex items-center">
        <div className="absolute inset-x-0 h-[4px] rounded-full bg-bone" />
        <div className="absolute h-[4px] rounded-full bg-brand-orange" style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }} />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={lo}
          onChange={e => onChange([Math.min(Number(e.target.value), hi - PRICE_STEP), hi])}
          className="range-thumb absolute inset-x-0 w-full h-[22px] m-0"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={hi}
          onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + PRICE_STEP)])}
          className="range-thumb absolute inset-x-0 w-full h-[22px] m-0"
          aria-label="Maximum price"
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11.5px] font-bold text-carbon tabular-nums">${lo}</span>
        <span className="text-[11.5px] font-bold text-carbon tabular-nums">{hi >= PRICE_MAX ? `$${PRICE_MAX}+` : `$${hi}`}</span>
      </div>
    </div>
  );
}
