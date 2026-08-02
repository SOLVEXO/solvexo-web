import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Check, Star, X } from 'lucide-react';

/** Collapsible sidebar filter section — shared by the general Marketplace and
 *  the Education marketplace filter panels. Compact header (a narrow sidebar
 *  reads worse with oversized rows than with a slightly smaller tap target),
 *  200ms height/opacity animation, no shadows — borders and color are the
 *  only affordances. */
export function FilterAccordionSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-3.5 border-b border-bone last:border-b-0 last:pb-0">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full min-h-9 flex items-center justify-between gap-2 bg-transparent border-none cursor-pointer p-0 group"
      >
        <span className="text-[11.5px] font-bold text-charcoal uppercase tracking-[0.05em] group-hover:text-brand-orange transition-colors duration-200">
          {title}
        </span>
        <span className="w-6 h-6 rounded-full flex items-center justify-center bg-cream group-hover:bg-brand-pale-orange transition-colors duration-200">
          <ChevronDown size={12} className={clsx('text-slate group-hover:text-brand-orange transition-transform duration-200', open && 'rotate-180')} />
        </span>
      </button>
      <div className={clsx('grid transition-all duration-200 ease-out', open ? 'grid-rows-[1fr] opacity-100 mt-3.5' : 'grid-rows-[0fr] opacity-0 mt-0')}>
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Rounded pill chip — used for Category (many items, wraps best as a chip
 *  cloud). Optional `count` renders the facet size inline, muted, the same
 *  way Etsy/Shopify chip clouds surface result counts. */
export function FilterChipPill({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'px-3 min-h-8 rounded-full text-[11.5px] font-semibold border transition-colors duration-200 cursor-pointer leading-none flex items-center gap-1',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
        active
          ? 'bg-brand-orange text-white border-brand-orange'
          : 'bg-white text-charcoal border-bone hover:border-brand-orange/50 hover:text-brand-orange',
      )}
    >
      {label}
      {count != null && (
        <span className={clsx('text-[10px] tabular-nums', active ? 'text-white/75' : 'text-slate')}>
          {count}
        </span>
      )}
    </button>
  );
}

/** Checkbox-style filter row — used for the Product Type facet, where a
 *  vertical list of real checkboxes reads as a proper faceted-search sidebar
 *  (Amazon/Shopify pattern) rather than a wrapped cloud of pills. Custom-drawn
 *  box (never a native `<input type="checkbox">`) so the checked state can
 *  animate in and match the brand-orange fill used everywhere else in this
 *  design system. */
export function FilterCheckboxRow({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'w-full min-h-9 flex items-center gap-[9px] px-2 -mx-2 rounded-lg text-left bg-transparent border-none cursor-pointer group transition-colors duration-200',
        active ? 'bg-brand-pale-orange/60' : 'hover:bg-cream',
      )}
    >
      <span
        className={clsx(
          'shrink-0 w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors duration-200',
          active ? 'bg-brand-orange border-brand-orange' : 'bg-white border-bone group-hover:border-brand-orange/50',
        )}
      >
        {active && <Check size={10} strokeWidth={3} className="text-white filter-check-pop" />}
      </span>
      <span className={clsx('flex-1 text-[12px] transition-colors duration-200', active ? 'text-carbon font-semibold' : 'text-charcoal font-medium')}>
        {label}
      </span>
      {count != null && (
        <span className="text-[10.5px] text-slate tabular-nums">{count}</span>
      )}
    </button>
  );
}

/** Radio-style filter row — used for the Category facet as a single-select
 *  vertical list (Amazon/Etsy faceted-search pattern) instead of a pill
 *  cloud, so a long category list reads as one scannable column with counts
 *  right-aligned rather than a wrapping cloud. */
export function FilterRadioRow({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'w-full min-h-9 flex items-center gap-[9px] px-2 -mx-2 rounded-lg text-left bg-transparent border-none cursor-pointer group transition-colors duration-200',
        active ? 'bg-brand-pale-orange/60' : 'hover:bg-cream',
      )}
    >
      <span
        className={clsx(
          'shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-200',
          active ? 'border-brand-orange' : 'border-bone group-hover:border-brand-orange/50',
        )}
      >
        {active && <span className="w-[7px] h-[7px] rounded-full bg-brand-orange filter-check-pop" />}
      </span>
      <span className={clsx('flex-1 text-[12px] transition-colors duration-200', active ? 'text-carbon font-semibold' : 'text-charcoal font-medium')}>
        {label}
      </span>
      {count != null && (
        <span className="text-[10.5px] text-slate tabular-nums">{count}</span>
      )}
    </button>
  );
}

/** Star-rating filter row ("4★ & up") — real icons, not a unicode star
 *  baked into a label string, so the row reads at a glance like Amazon's
 *  rating facet. `stars` is the threshold (e.g. 4 → four filled + one
 *  outlined star, "& up"). */
export function FilterStarRow({ stars, active, onClick, count }: { stars: number; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'w-full min-h-9 flex items-center gap-[9px] px-2 -mx-2 rounded-lg text-left bg-transparent border-none cursor-pointer group transition-colors duration-200',
        active ? 'bg-brand-pale-orange/60' : 'hover:bg-cream',
      )}
    >
      <span
        className={clsx(
          'shrink-0 w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors duration-200',
          active ? 'bg-brand-orange border-brand-orange' : 'bg-white border-bone group-hover:border-brand-orange/50',
        )}
      >
        {active && <Check size={10} strokeWidth={3} className="text-white filter-check-pop" />}
      </span>
      <span className="flex items-center gap-[1px] shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={11}
            className={i < stars ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'}
          />
        ))}
      </span>
      <span className={clsx('flex-1 text-[11.5px] transition-colors duration-200', active ? 'text-carbon font-semibold' : 'text-charcoal font-medium')}>
        &amp; up
      </span>
      {count != null && (
        <span className="text-[10.5px] text-slate tabular-nums">{count}</span>
      )}
    </button>
  );
}

/** Small dismissible pill for the "active filters" strip — shows what's
 *  currently narrowing the results with a one-tap way to remove just that
 *  one facet, without opening the accordion it came from. */
export function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-[10px] pr-1.5 h-7 rounded-full bg-brand-pale-orange border border-brand-orange/20 text-[11px] font-semibold text-brand-deep-orange">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-brand-deep-orange/70 hover:bg-white hover:text-brand-deep-orange transition-colors duration-200"
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
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
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-bone" />
        <div className="absolute h-1 rounded-full bg-brand-orange" style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }} />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={lo}
          onChange={e => onChange([Math.min(Number(e.target.value), hi - PRICE_STEP), hi])}
          className="range-thumb absolute inset-x-0 w-full h-5 m-0"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={hi}
          onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + PRICE_STEP)])}
          className="range-thumb absolute inset-x-0 w-full h-5 m-0"
          aria-label="Maximum price"
        />
      </div>
      <div className="flex items-center justify-between mt-3.5 gap-2">
        <span className="flex-1 text-[11.5px] font-semibold text-carbon tabular-nums bg-cream border border-bone rounded-[7px] px-[8px] py-[6px] text-center">${lo}</span>
        <span className="text-bone text-[10px]">—</span>
        <span className="flex-1 text-[11.5px] font-semibold text-carbon tabular-nums bg-cream border border-bone rounded-[7px] px-[8px] py-[6px] text-center">{hi >= PRICE_MAX ? `$${PRICE_MAX}+` : `$${hi}`}</span>
      </div>
    </div>
  );
}
