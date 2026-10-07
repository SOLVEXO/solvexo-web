import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol, formatMoney } from '@/utils/currency';
import type { PublicStoreFacets, PublicStoreProduct } from '@/api/services/store';
import {
  PRODUCT_TYPE_LABEL, SORT_OPTIONS, clearFilters, hasActiveFilters, toggleIn, toggleOption,
  type BrowseState,
} from './browseState';
import { useProductBrowse } from './useProductBrowse';

/** The slice of a theme's design tokens this shared listing UI needs. Both
 *  themes pass their own live (mutable) token object, so merchant overrides apply. */
export interface BrowseTokens {
  fonts: { display: string; body: string };
  colors: { ink: string; inkMuted: string; border: string; accent: string; accentInk: string; bgAlt: string; danger: string };
  radius: string;
  /** e.g. '1px' (Atelier) or '1.5px' (Nova) */
  borderWidth: string;
  headingWeight: number;
  skeletonAspect: string;
}

interface Props {
  tokens: BrowseTokens;
  renderCard: (p: PublicStoreProduct, currency: string) => ReactNode;
  heading?: string;
  categoryId?: string;
  collectionId?: string;
  search?: string;
  /** Keep filters/sort/page in the URL (collection, category, search pages). */
  syncUrl?: boolean;
  emptyText?: string;
}

type Panel = string | null;

export function StorefrontProductBrowser({ tokens: t, renderCard, heading, categoryId, collectionId, search, syncUrl = false, emptyText }: Props) {
  const { store } = useStorefront();
  const { currency, convert } = useCurrencyPreference();
  const { state, update, products, total, totalPages, facets, loading, error, retry } = useProductBrowse({ categoryId, collectionId, search, syncUrl });
  const [open, setOpen] = useState<Panel>(null);
  const [drawer, setDrawer] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const baseCurrency = String(store.baseCurrency ?? currency);
  const symbol = currencySymbol(currency);
  const active = hasActiveFilters(state);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const goPage = (page: number) => {
    update(s => ({ ...s, page }));
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  const change = (fn: (s: BrowseState) => BrowseState) => update(s => ({ ...fn(s), page: 1 }));

  const border = `${t.borderWidth} solid ${t.colors.border}`;
  const triggerStyle = {
    fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink, border, padding: '8px 14px', borderRadius: t.radius, background: 'transparent',
  } as const;
  const menuStyle = {
    top: 'calc(100% + 4px)', background: '#FFFFFF', border, borderRadius: t.radius, maxHeight: '320px', overflowY: 'auto',
  } as const;
  const muted = { fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted } as const;

  const fromBase = (n: number | null | undefined) => (n == null ? null : convert(n, baseCurrency));
  const priceMin = fromBase(facets?.price.min);
  const priceMax = fromBase(facets?.price.max);

  // ── Facet group model (shared by the desktop dropdowns and the mobile drawer) ──
  type Group = { id: string; label: string; body: (compact: boolean) => ReactNode; count: number };
  const groups: Group[] = [];

  const checkRow = (key: string, label: string, count: number, checked: boolean, onToggle: () => void) => (
    <label key={key} className="flex items-center gap-2.5 cursor-pointer" style={{ padding: '7px 14px', opacity: count === 0 && !checked ? 0.45 : 1 }}>
      <input type="checkbox" checked={checked} onChange={onToggle} disabled={count === 0 && !checked} style={{ accentColor: t.colors.accent }} />
      <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink }}>{label}</span>
      <span style={{ ...muted, marginLeft: 'auto' }}>({count})</span>
    </label>
  );

  if (facets) {
    groups.push({
      id: 'availability', label: 'Availability', count: state.availability ? 1 : 0,
      body: () => (
        <>
          {checkRow('in', 'In stock', facets.availability.in_stock, state.availability === 'in_stock', () => change(s => ({ ...s, availability: s.availability === 'in_stock' ? undefined : 'in_stock' })))}
          {checkRow('out', 'Out of stock', facets.availability.out_of_stock, state.availability === 'out_of_stock', () => change(s => ({ ...s, availability: s.availability === 'out_of_stock' ? undefined : 'out_of_stock' })))}
        </>
      ),
    });
    groups.push({
      id: 'price', label: 'Price', count: state.minPrice != null || state.maxPrice != null ? 1 : 0,
      body: () => (
        <PriceFields
          key={`${state.minPrice ?? ''}-${state.maxPrice ?? ''}`}
          symbol={symbol} currency={currency} t={t} border={border} highest={priceMax} lowest={priceMin}
          minPrice={state.minPrice} maxPrice={state.maxPrice}
          onApply={(lo, hi) => change(s => ({ ...s, minPrice: lo, maxPrice: hi }))}
        />
      ),
    });
    if (facets.productTypes.length > 1 || state.productTypes.length) {
      groups.push({
        id: 'type', label: 'Product type', count: state.productTypes.length,
        body: () => facets.productTypes.map(o => checkRow(o.value, PRODUCT_TYPE_LABEL[o.value] ?? o.value, o.count, state.productTypes.includes(o.value), () => change(s => ({ ...s, productTypes: toggleIn(s.productTypes, o.value) })))),
      });
    }
    for (const opt of facets.options) {
      groups.push({
        id: `opt:${opt.name}`, label: opt.name, count: state.options[opt.name]?.length ?? 0,
        body: () => opt.values.map(o => checkRow(o.value, o.value, o.count, !!state.options[opt.name]?.includes(o.value), () => change(s => ({ ...s, options: toggleOption(s.options, opt.name, o.value) })))),
      });
    }
    if (facets.tags.length || state.tags.length) {
      groups.push({
        id: 'tag', label: 'Tags', count: state.tags.length,
        body: () => facets.tags.map(o => checkRow(o.value, o.value, o.count, state.tags.includes(o.value), () => change(s => ({ ...s, tags: toggleIn(s.tags, o.value) })))),
      });
    }
  }

  // ── Active filter chips ──
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (state.availability) chips.push({ key: 'avail', label: `Availability: ${state.availability === 'in_stock' ? 'In stock' : 'Out of stock'}`, remove: () => change(s => ({ ...s, availability: undefined })) });
  if (state.minPrice != null || state.maxPrice != null) {
    chips.push({
      key: 'price',
      label: `${formatMoney(state.minPrice ?? 0, currency)} - ${state.maxPrice != null ? formatMoney(state.maxPrice, currency) : 'and up'}`,
      remove: () => change(s => ({ ...s, minPrice: undefined, maxPrice: undefined })),
    });
  }
  state.productTypes.forEach(v => chips.push({ key: `t:${v}`, label: PRODUCT_TYPE_LABEL[v] ?? v, remove: () => change(s => ({ ...s, productTypes: s.productTypes.filter(x => x !== v) })) }));
  Object.entries(state.options).forEach(([name, vals]) => vals.forEach(v => chips.push({ key: `o:${name}:${v}`, label: `${name}: ${v}`, remove: () => change(s => ({ ...s, options: toggleOption(s.options, name, v) })) })));
  state.tags.forEach(v => chips.push({ key: `g:${v}`, label: v, remove: () => change(s => ({ ...s, tags: s.tags.filter(x => x !== v) })) }));

  const sortLabel = SORT_OPTIONS.find(o => o.value === state.sort)?.label;
  const first = products === null;

  return (
    <div ref={topRef} style={{ scrollMarginTop: '80px' }}>
      {heading && (
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: t.headingWeight, color: t.colors.ink, marginBottom: '24px' }}>
          {heading}
        </h1>
      )}

      {open && <div className="fixed inset-0 z-[5]" onClick={() => setOpen(null)} aria-hidden="true" />}

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4" style={{ borderTop: border, borderBottom: border, padding: '14px 0' }}>
        {/* Desktop facet dropdowns */}
        <div className="hidden md:flex items-center gap-3 flex-wrap">
          {groups.length > 0 && <span style={muted}>Filter:</span>}
          {groups.map(g => (
            <div key={g.id} className="relative z-10">
              <button type="button" aria-expanded={open === g.id} aria-haspopup="true" onClick={() => setOpen(o => (o === g.id ? null : g.id))} className="flex items-center gap-1.5 cursor-pointer" style={triggerStyle}>
                {g.label}{g.count > 0 ? ` (${g.count})` : ''} <ChevronDown size={13} aria-hidden="true" />
              </button>
              {open === g.id && <div className="absolute left-0" style={{ ...menuStyle, minWidth: g.id === 'price' ? '280px' : '210px', paddingTop: '6px', paddingBottom: '6px' }}>{g.body(false)}</div>}
            </div>
          ))}
        </div>

        {/* Mobile: one button opening the drawer */}
        <button type="button" className="md:hidden flex items-center gap-2 cursor-pointer" style={triggerStyle} onClick={() => setDrawer(true)} aria-haspopup="dialog">
          <SlidersHorizontal size={14} aria-hidden="true" /> Filter and sort{chips.length > 0 ? ` (${chips.length})` : ''}
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span style={muted}>Sort by:</span>
            <div className="relative z-10">
              <button type="button" aria-expanded={open === 'sort'} aria-haspopup="listbox" onClick={() => setOpen(o => (o === 'sort' ? null : 'sort'))} className="flex items-center gap-1.5 cursor-pointer" style={triggerStyle}>
                {sortLabel} <ChevronDown size={13} aria-hidden="true" />
              </button>
              {open === 'sort' && (
                <div role="listbox" aria-label="Sort by" className="absolute right-0" style={{ ...menuStyle, minWidth: '210px' }}>
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value} type="button" role="option" aria-selected={o.value === state.sort}
                      onClick={() => { change(s => ({ ...s, sort: o.value })); setOpen(null); }}
                      className="block w-full text-left cursor-pointer bg-transparent"
                      style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: o.value === state.sort ? t.colors.accent : t.colors.ink, padding: '9px 14px' }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {!first && <span style={muted} aria-live="polite">{total} product{total !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {chips.map(c => (
            <button key={c.key} type="button" onClick={c.remove} aria-label={`Remove filter: ${c.label}`} className="flex items-center gap-1.5 cursor-pointer bg-transparent"
              style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.ink, border, padding: '5px 10px', borderRadius: t.radius }}>
              {c.label} <X size={12} aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={() => change(clearFilters)} className="cursor-pointer bg-transparent border-0 underline" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.ink }}>
            Remove all
          </button>
        </div>
      )}

      {first && !error && <Skeleton t={t} />}

      {error && (
        <div role="alert" className="flex flex-col items-center gap-3 text-center" style={{ padding: '48px 0' }}>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</p>
          <OutlineButton t={t} onClick={retry}>Try again</OutlineButton>
        </div>
      )}

      {products !== null && products.length === 0 && !error && (
        <div className="flex flex-col items-center text-center" style={{ padding: '80px 0', border, borderRadius: t.radius }}>
          <p style={{ fontFamily: t.fonts.display, fontSize: '18px', fontWeight: t.headingWeight, color: t.colors.ink, marginBottom: '6px' }}>
            {active ? 'No products found' : 'Nothing here yet'}
          </p>
          <p style={{ ...muted, fontSize: '13px', marginBottom: active ? '16px' : 0 }}>
            {active ? 'Use fewer filters or remove all.' : (emptyText ?? 'Try a different search or check back soon.')}
          </p>
          {active && <OutlineButton t={t} onClick={() => change(clearFilters)}>Remove all filters</OutlineButton>}
        </div>
      )}

      {products !== null && products.length > 0 && !error && (
        <div aria-busy={loading} style={{ opacity: loading ? 0.5 : 1, transition: 'opacity .15s' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map(p => <div key={p._id}>{renderCard(p, currency)}</div>)}
          </div>
          {totalPages > 1 && <Pagination t={t} border={border} page={state.page} totalPages={totalPages} onPage={goPage} />}
        </div>
      )}

      {drawer && (
        <FilterDrawer t={t} border={border} onClose={() => setDrawer(false)} total={total} active={active}
          onClear={() => change(clearFilters)} groups={groups} sort={state.sort} onSort={v => change(s => ({ ...s, sort: v }))} facets={facets} />
      )}
    </div>
  );
}

function Skeleton({ t }: { t: BrowseTokens }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="animate-pulse" style={{ aspectRatio: t.skeletonAspect, background: t.colors.bgAlt, borderRadius: t.radius }} />
          <div className="animate-pulse h-3 w-3/4" style={{ background: t.colors.bgAlt }} />
          <div className="animate-pulse h-3 w-1/3" style={{ background: t.colors.bgAlt }} />
        </div>
      ))}
    </div>
  );
}

function OutlineButton({ t, onClick, children }: { t: BrowseTokens; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer"
      style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.colors.ink, background: 'transparent', border: `${t.borderWidth} solid ${t.colors.ink}`, padding: '11px 22px', borderRadius: t.radius }}>
      {children}
    </button>
  );
}

function Pagination({ t, border, page, totalPages, onPage }: { t: BrowseTokens; border: string; page: number; totalPages: number; onPage: (p: number) => void }) {
  const nums: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const cell = { fontFamily: t.fonts.body, fontSize: '12.5px', minWidth: '34px', height: '34px', border, borderRadius: t.radius } as const;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-14 flex-wrap">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className="cursor-pointer bg-transparent px-3" style={{ ...cell, color: t.colors.ink, opacity: page <= 1 ? 0.4 : 1 }}>Previous</button>
      {nums.map((n, i) => n === '…'
        ? <span key={`e${i}`} style={{ ...cell, border: 'none', color: t.colors.inkMuted, textAlign: 'center', lineHeight: '34px' }}>…</span>
        : (
          <button key={n} type="button" onClick={() => onPage(n)} aria-label={`Page ${n}`} aria-current={n === page ? 'page' : undefined} className="cursor-pointer"
            style={{ ...cell, color: n === page ? t.colors.accentInk : t.colors.ink, background: n === page ? t.colors.ink : 'transparent' }}>{n}</button>
        ))}
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page" className="cursor-pointer bg-transparent px-3" style={{ ...cell, color: t.colors.ink, opacity: page >= totalPages ? 0.4 : 1 }}>Next</button>
    </nav>
  );
}

function PriceFields({ symbol, currency, t, border, highest, lowest, minPrice, maxPrice, onApply }: {
  symbol: string; currency: string; t: BrowseTokens; border: string; highest: number | null; lowest: number | null;
  minPrice?: number; maxPrice?: number; onApply: (lo?: number, hi?: number) => void;
}) {
  const [lo, setLo] = useState(minPrice != null ? String(minPrice) : '');
  const [hi, setHi] = useState(maxPrice != null ? String(maxPrice) : '');
  const idLo = useId();
  const idHi = useId();
  const parse = (v: string) => { const n = v.trim() === '' ? undefined : Math.max(0, Number(v)); return n != null && Number.isFinite(n) ? n : undefined; };
  const apply = () => {
    let a = parse(lo); let b = parse(hi);
    if (a != null && b != null && a > b) [a, b] = [b, a];
    onApply(a, b);
  };
  return (
    <div className="flex flex-col gap-3" style={{ padding: '10px 14px' }}>
      {highest != null && (
        <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>
          The highest price is {formatMoney(highest, currency)}{lowest != null ? `, lowest ${formatMoney(lowest, currency)}` : ''}
        </p>
      )}
      <div className="flex items-center gap-2">
        {[{ id: idLo, label: 'From', v: lo, set: setLo }, { id: idHi, label: 'To', v: hi, set: setHi }].map(f => (
          <label key={f.id} htmlFor={f.id} className="flex items-center gap-1 flex-1" style={{ border, borderRadius: t.radius, padding: '7px 8px', fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>
            <span className="sr-only">{f.label} price</span>{symbol}
            <input id={f.id} type="number" min={0} inputMode="decimal" value={f.v} placeholder={f.label} onChange={e => f.set(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') apply(); }} className="w-full bg-transparent outline-none" style={{ color: t.colors.ink }} />
          </label>
        ))}
      </div>
      <OutlineButton t={t} onClick={apply}>Apply</OutlineButton>
    </div>
  );
}

function FilterDrawer({ t, border, onClose, total, active, onClear, groups, sort, onSort, facets }: {
  t: BrowseTokens; border: string; onClose: () => void; total: number; active: boolean; onClear: () => void;
  groups: { id: string; label: string; body: (compact: boolean) => ReactNode; count: number }[];
  sort: BrowseState['sort']; onSort: (s: BrowseState['sort']) => void; facets: PublicStoreFacets | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeRef.current(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const els = ref.current.querySelectorAll<HTMLElement>('button, input, [href], [tabindex]:not([tabindex="-1"])');
      if (!els.length) return;
      const first = els[0]; const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, []);

  const muted = { fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted } as const;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="absolute top-0 right-0 h-full flex flex-col outline-none" style={{ width: 'min(92vw, 400px)', background: '#FFFFFF' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 18px', borderBottom: border }}>
          <h2 id={titleId} style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: t.headingWeight, color: t.colors.ink }}>Filter and sort</h2>
          <button type="button" onClick={onClose} aria-label="Close filters" className="cursor-pointer bg-transparent border-0"><X size={20} color={t.colors.ink} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div style={{ padding: '14px 18px', borderBottom: border }}>
            <label htmlFor={`${titleId}-sort`} style={{ ...muted, display: 'block', marginBottom: '6px' }}>Sort by</label>
            <select id={`${titleId}-sort`} value={sort} onChange={e => onSort(e.target.value as BrowseState['sort'])} className="w-full"
              style={{ fontFamily: t.fonts.body, fontSize: '13px', padding: '10px', border, borderRadius: t.radius, color: t.colors.ink, background: '#FFFFFF' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {!facets && <p style={{ ...muted, padding: '18px' }}>Loading filters…</p>}
          {groups.map(g => (
            <div key={g.id} style={{ borderBottom: border }}>
              <button type="button" aria-expanded={expanded === g.id} onClick={() => setExpanded(e => (e === g.id ? null : g.id))}
                className="flex items-center justify-between w-full cursor-pointer bg-transparent border-0" style={{ padding: '14px 18px', fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink }}>
                <span>{g.label}{g.count > 0 ? ` (${g.count})` : ''}</span>
                <ChevronDown size={15} aria-hidden="true" style={{ transform: expanded === g.id ? 'rotate(180deg)' : undefined }} />
              </button>
              {expanded === g.id && <div style={{ paddingBottom: '10px' }}>{g.body(true)}</div>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3" style={{ padding: '14px 18px', borderTop: border }}>
          {active && (
            <button type="button" onClick={onClear} className="cursor-pointer bg-transparent border-0 underline" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink }}>Remove all</button>
          )}
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer"
            style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.accentInk, background: t.colors.ink, border: `${t.borderWidth} solid ${t.colors.ink}`, padding: '13px', borderRadius: t.radius }}>
            Show {total} product{total !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
