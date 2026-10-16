import { useTranslation } from 'react-i18next';
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { moneyText } from '../../../core/money';
import { apiGetSearchSuggestions, type SearchSuggestions } from '@/api/services/storefrontSearch';
import { fashionTheme as t } from '../../theme.config';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

interface Option { id: string; group: string; label: string; sub?: string; image?: string | null; to: string }

/** Header predictive search: after 2+ characters, debounced + abortable suggestions for queries, products,
 *  collections, articles and pages. ARIA 1.2 combobox with a listbox popup, fully keyboard operable, plus a
 *  "Search for ..." row that opens the full results page. */
export function FashionPredictiveSearch({ inputId, placeholder, maxWidth, onDone }: {
  inputId: string; placeholder?: string; maxWidth?: string; onDone?: () => void;
}) {
  const { t: tr } = useTranslation('storefront');
  const { store } = useStorefront();
  const { currency, convert } = useCurrencyPreference();
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
  const baseCurrency = String(store.baseCurrency ?? currency);
  const term = q.trim();
  const ready = term.length >= MIN_CHARS;
  const data = ready && result?.term === term ? result.data : null;
  const failed = ready && failedTerm === term;
  const loading = ready && !data && !failed;

  useEffect(() => { inputRef.current?.focus(); }, []);

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

  const fullResults = `/search?q=${encodeURIComponent(term)}`;
  const options = useMemo<Option[]>(() => {
    if (!data) return [];
    const list: Option[] = [];
    data.queries.forEach(x => list.push({ id: `q:${x}`, group: tr('browse.suggestionsGroup', 'Suggestions'), label: x, to: `/search?q=${encodeURIComponent(x)}` }));
    data.products.forEach(p => list.push({
      id: `p:${p.id}`, group: tr('browse.products', 'Products'), label: p.name, image: p.image, to: `/product/${p.slug}`,
      sub: p.price != null ? moneyText(convert(p.price, baseCurrency), currency) : undefined,
    }));
    data.collections.forEach(c => list.push({ id: `c:${c.id}`, group: tr('nav.collections', 'Collections'), label: c.name, image: c.image, to: `/collections/${c.slug}` }));
    data.articles.forEach(a => list.push({ id: `a:${a.id}`, group: tr('browse.articles', 'Articles'), label: a.title, image: a.image, to: `/blog/${a.slug}` }));
    data.pages.forEach(p => list.push({ id: `g:${p.id}`, group: tr('browse.pages', 'Pages'), label: p.title, to: `/${p.slug}` }));
    return list;
  }, [tr, data, convert, baseCurrency, currency]);
  // The trailing "Search for ..." row is the last keyboard stop.
  const total = options.length + (ready ? 1 : 0);

  const go = (to: string) => { setOpen(false); setQ(''); onDone?.(); navigate(to); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!term) return;
    if (active >= 0 && active < options.length) go(options[active].to);
    else go(fullResults);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && total) { e.preventDefault(); setOpen(true); setActive(a => (a + 1) % total); }
    else if (e.key === 'ArrowUp' && total) { e.preventDefault(); setOpen(true); setActive(a => (a <= 0 ? total - 1 : a - 1)); }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } else if (q) setQ(''); else onDone?.(); }
    else if (e.key === 'Enter' && active === options.length && term) { e.preventDefault(); go(fullResults); }
  };

  const showPanel = open && ready;
  const noResults = !loading && !failed && data && options.length === 0;
  const muted = { color: t.colors.inkMuted } as const;
  const groups = [...new Set(options.map(o => o.group))];
  const activeId = active >= 0 ? `${listId}-${active}` : undefined;

  return (
    <div ref={rootRef} className="relative" style={{ maxWidth, margin: maxWidth ? '0 auto' : undefined, fontFamily: t.fonts.body, color: t.colors.ink }}>
      <form onSubmit={submit} role="search" className="flex items-center gap-3 rounded-full px-5" style={{ background: t.colors.bgAlt }}>
        <Search size={18} style={muted} aria-hidden="true" />
        <label htmlFor={inputId} className="sr-only">{tr('nav.search', 'Search')}</label>
        <input
          ref={inputRef} id={inputId} type="search" value={q} autoComplete="off" autoCapitalize="off" spellCheck={false}
          role="combobox" aria-expanded={showPanel} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={activeId}
          onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
          placeholder={placeholder ?? tr('nav.searchProducts', 'Search products…')} className="h-[52px] w-full min-w-0 border-0 bg-transparent text-base outline-none" style={{ color: t.colors.ink }}
        />
        {q && <button type="button" aria-label="Clear search" onClick={() => { setQ(''); inputRef.current?.focus(); }} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0" style={muted}><X size={16} /></button>}
      </form>

      <div className="sr-only" role="status" aria-live="polite">
        {showPanel && !loading ? (failed ? 'Suggestions are unavailable' : `${options.length} suggestion${options.length === 1 ? '' : 's'} available`) : ''}
      </div>

      {showPanel && (
        <div className="fx-pop absolute inset-x-0 z-30 overflow-y-auto p-2" style={{ top: 'calc(100% + 10px)', background: t.colors.bg, border: `1px solid ${t.colors.border}`, borderRadius: 24, maxHeight: '70vh', boxShadow: '0 24px 64px rgba(0,0,0,.16)' }}>
          <ul id={listId} role="listbox" aria-label={tr('browse.suggestions', 'Search suggestions')} className="m-0 list-none p-0">
            {loading && <li role="presentation" className="px-4 py-4 text-sm" style={muted}>{tr('browse.searching', 'Searching…')}</li>}
            {failed && <li role="presentation" className="px-4 py-4 text-sm" style={muted}>{tr('browse.suggestionsUnavailable', 'Suggestions are unavailable. Press Enter to search.')}</li>}
            {noResults && <li role="presentation" className="px-4 py-4 text-sm" style={muted}>{tr('browse.noResultsFor', 'No results for "{{term}}"', { term })}</li>}
            {groups.map(g => (
              <li key={g} role="presentation">
                <div role="presentation" className="px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={muted}>{g}</div>
                <ul role="presentation" className="m-0 list-none p-0">
                  {options.map((o, i) => o.group !== g ? null : (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard goes through the combobox input
                    <li key={o.id} id={`${listId}-${i}`} role="option" aria-selected={active === i}
                      onMouseDown={e => e.preventDefault()} onClick={() => go(o.to)} onMouseEnter={() => setActive(i)}
                      className="flex cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-2.5" style={{ background: active === i ? t.colors.bgAlt : 'transparent' }}>
                      {o.image
                        ? <img src={o.image} alt="" loading="lazy" className="size-12 shrink-0 object-cover" style={{ borderRadius: 12 }} />
                        : <span className="grid size-12 shrink-0 place-items-center rounded-full" style={{ background: t.colors.bgAlt, ...muted }}><Search size={15} aria-hidden="true" /></span>}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.label}</span>
                      {o.sub && <span className="shrink-0 text-sm" style={muted}>{o.sub}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard goes through the combobox input */}
            <li id={`${listId}-${options.length}`} role="option" aria-selected={active === options.length}
              onMouseDown={e => e.preventDefault()} onClick={() => go(fullResults)} onMouseEnter={() => setActive(options.length)}
              className="mt-1 flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-medium" style={{ background: active === options.length ? t.colors.bgAlt : 'transparent' }}>
              <span className="min-w-0 flex-1 truncate">Search for &quot;{term}&quot; — view all results</span>
              <ArrowRight size={16} aria-hidden="true" />
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
