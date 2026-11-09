import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';

/** Search under the header, like ledup.pt: a frosted panel with one big underlined field and a round arrow button. Quick links are the store's own top menu entries. */
export function LedupSearchPanel({ visible, onClose, suggestions }: { visible: boolean; onClose: () => void; suggestions: ResolvedStorefrontNavItem[] }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [visible]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setQuery('');
    onClose();
  };

  return (
    <div className={`ld-search-panel ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <form onSubmit={submit} role="search" className="ld-search-inner" style={{ flexWrap: 'wrap', paddingTop: 24, paddingBottom: 24 }}>
        <input ref={inputRef} tabIndex={visible ? 0 : -1} type="search" value={query} onChange={e => setQuery(e.target.value)} className="ld-search-input"
          placeholder={ts('ld.searchPlaceholder', 'Search by name, reference…')} aria-label={ts('nav.search', 'Search')} autoComplete="off" />
        <button type="submit" tabIndex={visible ? 0 : -1} className="ld-search-go" aria-label={ts('nav.search', 'Search')}><ArrowUpRight size={30} aria-hidden /></button>
        {suggestions.length > 0 && (
          <div className="flex w-full flex-wrap gap-2 pt-2">
            {suggestions.slice(0, 8).map(s => {
              const to = s.link.to;
              return to
                ? <Link key={s.id} to={to} tabIndex={visible ? 0 : -1} onClick={onClose} className="ld-pillbtn">{s.label}</Link>
                : <a key={s.id} href={s.link.href} tabIndex={visible ? 0 : -1} className="ld-pillbtn">{s.label}</a>;
            })}
          </div>
        )}
      </form>
    </div>
  );
}
