import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Search, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetSearchSuggestions, type SearchSuggestions } from '@/api/services/storefrontSearch';
import { displayMoney } from '../../core/money';
import { addRecentSearch, clearRecentSearches, readRecentSearches, removeRecentSearch } from '../../core/recentSearches';
import { techTheme as t } from '../theme.config';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

interface Option { id: string; group: string; label: string; sub?: string; image?: string | null; to: string }

/** Header predictive search. Same store API as every theme (`apiGetSearchSuggestions`), drawn in Tech's look: after 2+ characters,
 *  debounced + abortable suggestions for queries, products, collections, articles and pages; recent searches when empty;
 *  an ARIA combobox that is fully keyboard operable, with a final "Search for ..." row that opens the results page. */
export function TechPredictiveSearch({ inputId, placeholder, onDone, focusOnMount }: { inputId: string; placeholder?: string; onDone?: () => void; focusOnMount?: boolean }) {
  const { store } = useStorefront();
  const { currency, convert, canConvert } = useCurrencyPreference();
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  // The answer is stored with the term it belongs to, so "loading" is derived and no state is set synchronously in effects.
  const [result, setResult] = useState<{ term: string; data: SearchSuggestions } | null>(null);
  const [failedTerm, setFailedTerm] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches(store.storeId));
  const baseCurrency = String(store.baseCurrency ?? currency);
  const term = q.trim();
  const ready = term.length >= MIN_CHARS;
  const data = ready && result?.term === term ? result.data : null;
  const failed = ready && failedTerm === term;
  const loading = ready && !data && !failed;

  useEffect(() => { if (focusOnMount) inputRef.current?.focus(); }, [focusOnMount]);

  useEffect(() => {
    if (term.length < MIN_CHARS) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      setFailedTerm(null);
      apiGetSearchSuggestions(store.storeId, term, ctrl.signal)
        .then(res => { setResult({ term, data: res.data }); setActive(-1); })
        .catch(err => { if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED') return; setFailedTerm(term); });
    }, DEBOUNCE_MS);
    return () => { window.clearTimeout(timer); ctrl.abort(); };
  }, [store.storeId, term]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const options = useMemo<Option[]>(() => {
    if (!data) return [];
    const list: Option[] = [];
    data.queries.forEach(x => list.push({ id: `q:${x}`, group: ts('browse.suggestionsGroup', 'Suggestions'), label: x, to: `/search?q=${encodeURIComponent(x)}` }));
    data.products.forEach(p => list.push({
      id: `p:${p.id}`, group: ts('browse.products', 'Products'), label: p.name, image: p.image, to: `/product/${p.slug}`,
      sub: p.price != null ? displayMoney({ currency, convert, canConvert }, p.price, baseCurrency, { productId: p.id }) : undefined,
    }));
    data.collections.forEach(c => list.push({ id: `c:${c.id}`, group: ts('nav.collections', 'Collections'), label: c.name, image: c.image, to: `/collections/${c.slug}` }));
    data.articles.forEach(a => list.push({ id: `a:${a.id}`, group: ts('browse.articles', 'Articles'), label: a.title, image: a.image, to: `/blog/${a.slug}` }));
    data.pages.forEach(p => list.push({ id: `g:${p.id}`, group: ts('browse.pages', 'Pages'), label: p.title, to: `/${p.slug}` }));
    return list;
  }, [data, convert, canConvert, baseCurrency, currency]);

  const showRecent = open && term.length === 0 && recent.length > 0;
  const total = showRecent ? recent.length : options.length + (ready ? 1 : 0);

  const go = (to: string, remember?: string) => {
    if (remember) setRecent(addRecentSearch(store.storeId, remember));
    setOpen(false); setQ(''); onDone?.(); navigate(to);
  };
  const goSearch = (text: string) => go(`/search?q=${encodeURIComponent(text)}`, text);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (showRecent && active >= 0 && active < recent.length) return goSearch(recent[active]);
    if (!term) return;
    if (active >= 0 && active < options.length) go(options[active].to, options[active].id.startsWith('q:') ? options[active].label : undefined);
    else goSearch(term);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && total) { e.preventDefault(); setOpen(true); setActive(a => (a + 1) % total); }
    else if (e.key === 'ArrowUp' && total) { e.preventDefault(); setOpen(true); setActive(a => (a <= 0 ? total - 1 : a - 1)); }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } else if (q) setQ(''); else onDone?.(); }
    else if (e.key === 'Enter' && !showRecent && active === options.length && term) { e.preventDefault(); goSearch(term); }
  };

  const showPanel = open && ready;
  const noResults = !loading && !failed && data && options.length === 0;
  const muted = { color: t.colors.inkMuted } as const;
  const groups = [...new Set(options.map(o => o.group))];
  const activeId = active >= 0 ? `${listId}-${active}` : undefined;
  const panel = { background: t.colors.bg, border: `1px solid ${t.colors.border}`, boxShadow: '0 12px 32px -12px rgba(2,2,3,.25)', maxHeight: '70vh', top: 'calc(100% + 6px)' } as const;
  const rowBg = (on: boolean) => ({ background: on ? t.colors.bgAlt : 'transparent' });

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1" style={{ fontFamily: t.fonts.body, color: t.colors.ink }}>
      <form onSubmit={submit} role="search" className="flex items-center gap-2 px-4" style={{ background: t.colors.bgAlt, borderRadius: t.buttonRadiusPx }}>
        <label htmlFor={inputId} className="sr-only">{ts('nav.search', 'Search')}</label>
        <input ref={inputRef} id={inputId} type="search" value={q} autoComplete="off" autoCapitalize="off" spellCheck={false}
          role="combobox" aria-expanded={showPanel} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={activeId}
          onChange={e => { setQ(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
          placeholder={placeholder ?? ts('pg.search_entire_store', 'Search entire store here...')} className="tx-search-input h-11 w-full min-w-0 border-0 bg-transparent text-sm outline-none" style={{ color: t.colors.ink }} />
        {q && <button type="button" aria-label={ts('pg.clear_search', 'Clear search')} onClick={() => { setQ(''); inputRef.current?.focus(); }} className="grid size-8 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0" style={muted}><X size={16} aria-hidden /></button>}
        <button type="submit" aria-label={ts('nav.search', 'Search')} className="grid size-9 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0" style={{ color: t.colors.ink }}><Search size={18} aria-hidden /></button>
      </form>

      <div className="sr-only" role="status" aria-live="polite">
        {showPanel && !loading ? (failed ? ts('pg.suggestions_are_unavailable', 'Suggestions are unavailable') : ts('pg.suggestions_available', '{{count}} suggestions available', { count: options.length })) : ''}
      </div>

      {showRecent && (
        <div className="tx-pop absolute inset-x-0 z-40 overflow-y-auto p-2" style={panel}>
          <div className="flex items-center justify-between px-3 pb-1 pt-2">
            <span className="text-[11px] font-semibold uppercase" style={{ ...muted, letterSpacing: '.08em' }}>{ts('pg.recent_searches', 'Recent searches')}</span>
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setRecent(clearRecentSearches(store.storeId)); setActive(-1); inputRef.current?.focus(); }} className="cursor-pointer border-0 bg-transparent p-0 text-xs font-medium underline" style={{ color: t.colors.ink }}>{ts('pg.clear_all', 'Clear all')}</button>
          </div>
          <ul id={listId} role="listbox" aria-label={ts('pg.recent_searches', 'Recent searches')} className="m-0 list-none p-0">
            {recent.map((r, i) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard goes through the combobox input
              <li key={r} id={`${listId}-${i}`} role="option" aria-selected={active === i} onMouseDown={e => e.preventDefault()} onClick={() => goSearch(r)} onMouseEnter={() => setActive(i)}
                className="flex cursor-pointer items-center gap-3 px-3 py-2" style={rowBg(active === i)}>
                <Clock size={15} aria-hidden style={muted} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r}</span>
                <button type="button" aria-label={ts('pg.remove_recent_search', 'Remove "{{term}}" from recent searches', { term: r })} onMouseDown={e => e.preventDefault()}
                  onClick={e => { e.stopPropagation(); setRecent(removeRecentSearch(store.storeId, r)); setActive(-1); }} className="grid size-7 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0" style={muted}><X size={14} aria-hidden /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showPanel && (
        <div className="tx-pop absolute inset-x-0 z-40 overflow-y-auto p-2" style={panel}>
          <ul id={listId} role="listbox" aria-label={ts('browse.suggestions', 'Search suggestions')} className="m-0 list-none p-0">
            {loading && <li role="presentation" className="px-3 py-3 text-sm" style={muted}>{ts('browse.searching', 'Searching…')}</li>}
            {failed && <li role="presentation" className="px-3 py-3 text-sm" style={muted}>{ts('browse.suggestionsUnavailable', 'Suggestions are unavailable. Press Enter to search.')}</li>}
            {noResults && <li role="presentation" className="px-3 py-3 text-sm" style={muted}>{ts('browse.noResultsFor', 'No results for "{{term}}"', { term })}</li>}
            {groups.map(g => (
              <li key={g} role="presentation">
                <div role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase" style={{ ...muted, letterSpacing: '.08em' }}>{g}</div>
                <ul role="presentation" className="m-0 list-none p-0">
                  {options.map((o, i) => o.group !== g ? null : (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard goes through the combobox input
                    <li key={o.id} id={`${listId}-${i}`} role="option" aria-selected={active === i} onMouseDown={e => e.preventDefault()} onClick={() => go(o.to, o.id.startsWith('q:') ? o.label : undefined)} onMouseEnter={() => setActive(i)}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2" style={rowBg(active === i)}>
                      {o.image ? <img src={o.image} alt="" loading="lazy" className="size-11 shrink-0 object-contain" style={{ background: t.colors.bgAlt, borderRadius: t.imageRadiusPx }} /> : <Search size={15} aria-hidden style={muted} />}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.label}</span>
                      {o.sub && <span className="shrink-0 text-sm font-semibold">{o.sub}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard goes through the combobox input */}
            <li id={`${listId}-${options.length}`} role="option" aria-selected={active === options.length} onMouseDown={e => e.preventDefault()} onClick={() => goSearch(term)} onMouseEnter={() => setActive(options.length)}
              className="mt-1 flex cursor-pointer items-center gap-2 px-3 py-3 text-sm font-semibold" style={{ ...rowBg(active === options.length), color: t.colors.accent }}>
              <span className="min-w-0 flex-1 truncate">{ts('pg.search_for_term_view_all_results', 'Search for "{{term}}" — view all results', { term })}</span>
              <ArrowRight size={16} aria-hidden className="tx-flip-rtl" />
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
