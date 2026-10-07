import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { formatMoney } from '@/utils/currency';
import { apiGetSearchSuggestions, type SearchSuggestions } from '@/api/services/storefrontSearch';
import type { BrowseTokens } from './StorefrontProductBrowser';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

interface Option { id: string; group: string; label: string; sub?: string; image?: string | null; to: string }

/** Header predictive search (Shopify "Search & Discovery" behaviour): after 2+
 *  characters, debounced + abortable suggestions for queries, products,
 *  collections, articles and pages, fully keyboard operable (ARIA 1.2 combobox
 *  with a listbox popup), plus a "Search for ..." link to the full results page. */
export function StorefrontPredictiveSearch({ tokens: t, inputId, placeholder = 'Search products…', maxWidth, onDone }: {
  tokens: BrowseTokens; inputId: string; placeholder?: string; maxWidth?: string; onDone?: () => void;
}) {
  const { store } = useStorefront();
  const { currency, convert } = useCurrencyPreference();
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [data, setData] = useState<SearchSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const baseCurrency = String(store.baseCurrency ?? currency);
  const term = q.trim();

  useEffect(() => {
    if (term.length < MIN_CHARS) { setData(null); setLoading(false); setFailed(false); return; }
    const ctrl = new AbortController();
    setLoading(true); setFailed(false);
    const timer = window.setTimeout(() => {
      apiGetSearchSuggestions(store.storeId, term, ctrl.signal)
        .then(res => { setData(res.data); setActive(-1); setLoading(false); })
        .catch(err => { if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED') return; setFailed(true); setLoading(false); });
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
    data.queries.forEach(x => list.push({ id: `q:${x}`, group: 'Suggestions', label: x, to: `/search?q=${encodeURIComponent(x)}` }));
    data.products.forEach(p => list.push({
      id: `p:${p.id}`, group: 'Products', label: p.name, image: p.image, to: `/product/${p.slug}`,
      sub: p.price != null ? formatMoney(convert(p.price, baseCurrency), currency) : undefined,
    }));
    data.collections.forEach(c => list.push({ id: `c:${c.id}`, group: 'Collections', label: c.name, image: c.image, to: `/collections/${c.slug}` }));
    data.articles.forEach(a => list.push({ id: `a:${a.id}`, group: 'Articles', label: a.title, image: a.image, to: `/blog/${a.slug}` }));
    data.pages.forEach(p => list.push({ id: `g:${p.id}`, group: 'Pages', label: p.title, to: `/${p.slug}` }));
    return list;
  }, [data, convert, baseCurrency, currency]);
  // The trailing "Search for ..." row is the last keyboard stop.
  const total = options.length + (term.length >= MIN_CHARS ? 1 : 0);

  const go = (to: string) => { setOpen(false); setQ(''); setData(null); onDone?.(); navigate(to); };
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

  const showPanel = open && term.length >= MIN_CHARS;
  const noResults = !loading && !failed && data && options.length === 0;
  const muted = { fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted } as const;
  const groups = [...new Set(options.map(o => o.group))];
  const activeId = active >= 0 ? `${listId}-${active}` : undefined;

  return (
    <div ref={rootRef} className="relative" style={{ maxWidth, margin: maxWidth ? '0 auto' : undefined }}>
      <form onSubmit={submit} role="search" className="flex items-center gap-2">
        <Search size={16} color={t.colors.inkMuted} aria-hidden="true" />
        <label htmlFor={inputId} className="sr-only">Search</label>
        <input
          id={inputId} autoFocus type="search" value={q} autoComplete="off" autoCapitalize="off" spellCheck={false}
          role="combobox" aria-expanded={showPanel} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={activeId}
          onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
          placeholder={placeholder} className="w-full bg-transparent outline-none"
          style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.ink }}
        />
      </form>

      <div className="sr-only" role="status" aria-live="polite">
        {showPanel && !loading ? (failed ? 'Suggestions are unavailable' : `${options.length} suggestion${options.length === 1 ? '' : 's'} available`) : ''}
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 z-30" style={{ top: 'calc(100% + 10px)', background: '#FFFFFF', border: `${t.borderWidth} solid ${t.colors.border}`, borderRadius: t.radius, maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}>
          <ul id={listId} role="listbox" aria-label="Search suggestions" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {loading && !data && <li role="presentation" style={{ ...muted, padding: '14px 16px' }}>Searching…</li>}
            {failed && <li role="presentation" style={{ ...muted, padding: '14px 16px' }}>Suggestions are unavailable. Press Enter to search.</li>}
            {noResults && <li role="presentation" style={{ ...muted, padding: '14px 16px' }}>No results for &quot;{term}&quot;</li>}
            {groups.map(g => (
              <li key={g} role="presentation">
                <div role="presentation" style={{ ...muted, padding: '10px 16px 4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '10.5px' }}>{g}</div>
                <ul role="presentation" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {options.map((o, i) => o.group !== g ? null : (
                    <li key={o.id} id={`${listId}-${i}`} role="option" aria-selected={active === i}
                      onMouseDown={e => e.preventDefault()} onClick={() => go(o.to)} onMouseEnter={() => setActive(i)}
                      className="flex items-center gap-3 cursor-pointer"
                      style={{ padding: '8px 16px', background: active === i ? t.colors.bgAlt : 'transparent' }}>
                      {o.image && <img src={o.image} alt="" loading="lazy" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: t.radius, flexShrink: 0 }} />}
                      <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink }}>{o.label}</span>
                      {o.sub && <span style={{ ...muted, marginLeft: 'auto' }}>{o.sub}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            <li id={`${listId}-${options.length}`} role="option" aria-selected={active === options.length}
              onMouseDown={e => e.preventDefault()} onClick={() => go(fullResults)} onMouseEnter={() => setActive(options.length)}
              className="cursor-pointer" style={{ padding: '12px 16px', borderTop: `${t.borderWidth} solid ${t.colors.border}`, background: active === options.length ? t.colors.bgAlt : 'transparent', fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink }}>
              Search for &quot;{term}&quot; - view all results
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
