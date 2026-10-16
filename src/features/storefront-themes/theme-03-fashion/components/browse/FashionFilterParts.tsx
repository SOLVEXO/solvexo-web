import { useId, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X } from 'lucide-react';
import { moneyText } from '../../../core/money';
import type { PublicStoreFacets } from '@/api/services/store';
import { SORT_OPTIONS, type BrowseState } from '@/features/storefront/browse/browseState';
import { responsiveGridColumnsClass } from '@/features/storefront/browse/gridLayout';
import { fashionTheme as t } from '../../theme.config';
import { useDialogFocus } from '../../../core/hooks/useDialogFocus';

export interface FacetGroup { id: string; label: string; body: ReactNode; count: number }

export function BrowseSkeleton({ columns }: { columns?: 2 | 3 | 4 }) {
  return (
    <div className={`grid ${responsiveGridColumnsClass(columns)} gap-x-5 gap-y-10`} aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="animate-pulse" style={{ aspectRatio: '4 / 5', background: t.colors.bgAlt, borderRadius: t.productCardRadiusPx }} />
          <div className="h-3 w-3/4 animate-pulse rounded-full" style={{ background: t.colors.bgAlt }} />
          <div className="h-3 w-1/3 animate-pulse rounded-full" style={{ background: t.colors.bgAlt }} />
        </div>
      ))}
    </div>
  );
}

export function BrowseButton({ onClick, children, solid }: { onClick: () => void; children: ReactNode; solid?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="fx-pill" style={{ height: 44, padding: '0 24px', background: solid ? t.colors.accent : 'transparent', color: solid ? t.colors.accentInk : t.colors.ink, border: `1px solid ${solid ? t.colors.accent : t.colors.border}`, fontFamily: t.fonts.body }}>
      {children}
    </button>
  );
}

export function CheckRow({ label, count, checked, onToggle }: { label: string; count: number; checked: boolean; onToggle: () => void }) {
  const dim = count === 0 && !checked;
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors hover:bg-black/5" style={{ opacity: dim ? 0.45 : 1 }}>
      <input type="checkbox" checked={checked} onChange={onToggle} disabled={dim} className="size-4" style={{ accentColor: t.colors.accent }} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs" style={{ color: t.colors.inkMuted }}>{count}</span>
    </label>
  );
}

export function BrowsePagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const { t: tr } = useTranslation('storefront');
  const nums: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const cell = 'grid h-11 min-w-11 cursor-pointer place-items-center rounded-full px-3 text-sm font-medium transition-colors';
  const idle = { border: `1px solid ${t.colors.border}`, color: t.colors.ink, background: 'transparent', fontFamily: t.fonts.body } as const;
  return (
    <nav aria-label={tr('browse.pagination', 'Pagination')} className="mt-14 flex flex-wrap items-center justify-center gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={tr('browse.prevPage', 'Previous page')} className={`${cell} disabled:cursor-not-allowed disabled:opacity-40`} style={idle}>{tr('orders.previous', 'Previous')}</button>
      {nums.map((n, i) => n === '…'
        ? <span key={`e${i}`} className="grid h-11 min-w-8 place-items-center text-sm" style={{ color: t.colors.inkMuted }}>…</span>
        : <button key={n} type="button" onClick={() => onPage(n)} aria-label={`Page ${n}`} aria-current={n === page ? 'page' : undefined} className={cell}
            style={n === page ? { ...idle, background: t.colors.accent, color: t.colors.accentInk, borderColor: t.colors.accent } : idle}>{n}</button>)}
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label={tr('browse.nextPage', 'Next page')} className={`${cell} disabled:cursor-not-allowed disabled:opacity-40`} style={idle}>{tr('orders.next', 'Next')}</button>
    </nav>
  );
}

export function PriceFields({ symbol, currency, highest, lowest, minPrice, maxPrice, onApply }: {
  symbol: string; currency: string; highest: number | null; lowest: number | null; minPrice?: number; maxPrice?: number; onApply: (lo?: number, hi?: number) => void;
}) {
  const { t: tr } = useTranslation('storefront');
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
    <div className="flex flex-col gap-3 px-3.5 py-2.5">
      {highest != null && (
        <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>
          The highest price is {moneyText(highest, currency)}{lowest != null ? `, lowest ${moneyText(lowest, currency)}` : ''}
        </p>
      )}
      <div className="flex items-center gap-2">
        {[{ id: idLo, label: tr('browse.from', 'From'), v: lo, set: setLo }, { id: idHi, label: tr('browse.to', 'To'), v: hi, set: setHi }].map(f => (
          <label key={f.id} htmlFor={f.id} className="flex flex-1 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.inkMuted }}>
            <span className="sr-only">{f.label} price</span>{symbol}
            <input id={f.id} type="number" min={0} inputMode="decimal" value={f.v} placeholder={f.label} onChange={e => f.set(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') apply(); }} className="w-full min-w-0 border-0 bg-transparent outline-none" style={{ color: t.colors.ink }} />
          </label>
        ))}
      </div>
      <BrowseButton onClick={apply} solid>{tr('checkout.apply', 'Apply')}</BrowseButton>
    </div>
  );
}

export function FilterDrawer({ onClose, total, active, onClear, groups, sort, onSort, facets }: {
  onClose: () => void; total: number; active: boolean; onClear: () => void; groups: FacetGroup[];
  sort: BrowseState['sort']; onSort: (s: BrowseState['sort']) => void; facets: PublicStoreFacets | null;
}) {
  const { t: tr } = useTranslation('storefront');
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const titleId = useId();
  useDialogFocus(ref, onClose);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="fx-backdrop absolute inset-0" style={{ background: 'rgba(9,9,11,0.45)' }} onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="fx-drawer-right absolute inset-y-0 right-0 flex w-[min(94vw,420px)] flex-col outline-none sm:inset-y-3 sm:right-3"
        style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: 28, boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
        <div className="flex items-center justify-between px-6 py-5">
          <h2 id={titleId} className="m-0 text-xl font-medium tracking-tight" style={{ fontFamily: t.fonts.display }}>{tr('browse.filterAndSort', 'Filter and sort')}</h2>
          <button type="button" onClick={onClose} aria-label={tr('browse.closeFilters', 'Close filters')} className="grid size-10 cursor-pointer place-items-center rounded-full border-0 p-0" style={{ background: t.colors.bgAlt, color: t.colors.ink }}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <div className="mb-3 rounded-2xl p-4" style={{ background: t.colors.bgAlt }}>
            <label htmlFor={`${titleId}-sort`} className="mb-1.5 block text-[13px] font-medium" style={{ color: t.colors.inkMuted }}>{tr('browse.sortByLabel', 'Sort by')}</label>
            <select id={`${titleId}-sort`} value={sort} onChange={e => onSort(e.target.value as BrowseState['sort'])} className="w-full rounded-full border-0 px-4 py-3 text-sm outline-none"
              style={{ background: t.colors.bg, color: t.colors.ink, border: `1px solid ${t.colors.border}` }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {!facets && <p className="m-0 px-2 py-4 text-[13px]" style={{ color: t.colors.inkMuted }}>{tr('browse.loadingFilters', 'Loading filters…')}</p>}
          {groups.map(g => (
            <div key={g.id} style={{ borderTop: `1px solid ${t.colors.border}` }}>
              <button type="button" aria-expanded={expanded === g.id} onClick={() => setExpanded(e => (e === g.id ? null : g.id))}
                className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-2 py-4 text-left text-[15px] font-medium" style={{ color: t.colors.ink }}>
                <span>{g.label}{g.count > 0 ? ` (${g.count})` : ''}</span>
                <ChevronDown size={16} aria-hidden="true" style={{ transform: expanded === g.id ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
              </button>
              {expanded === g.id && <div className="pb-3">{g.body}</div>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderTop: `1px solid ${t.colors.border}` }}>
          {active && <button type="button" onClick={onClear} className="cursor-pointer border-0 bg-transparent p-0 text-sm underline" style={{ color: t.colors.ink }}>{tr('browse.removeAll', 'Remove all')}</button>}
          <button type="button" onClick={onClose} className="fx-pill flex-1" style={{ background: t.colors.accent, color: t.colors.accentInk, border: `1px solid ${t.colors.accent}` }}>
            Show {total} product{total !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
