/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, jsx-a11y/no-autofocus, jsx-a11y/click-events-have-key-events */
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetSearchContent, type SearchContentResults } from '@/api/services/storefrontSearch';
import type { BrowseTokens } from './StorefrontProductBrowser';

type Tab = 'product' | 'article' | 'page';

/** Search results page body: Products (the faceted grid, passed in) plus
 *  Articles / Pages tabs when the query also matches store content. The tab
 *  lives in `?type=` (Shopify's own parameter) so it survives reload/share. */
export function StorefrontSearchTabs({ tokens: t, q, products }: { tokens: BrowseTokens; q: string; products: ReactNode }) {
  const { store } = useStorefront();
  const [params, setParams] = useSearchParams();
  const [content, setContent] = useState<SearchContentResults | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setContent(null);
    apiGetSearchContent(store.storeId, q, ctrl.signal)
      .then(res => setContent(res.data))
      .catch(() => setContent(null));
    return () => ctrl.abort();
  }, [store.storeId, q]);

  const articleCount = content?.totals.articles ?? 0;
  const pageCount = content?.totals.pages ?? 0;
  const requested = params.get('type');
  const tab: Tab = requested === 'article' && articleCount > 0 ? 'article' : requested === 'page' && pageCount > 0 ? 'page' : 'product';
  const showTabs = articleCount + pageCount > 0;

  const select = (next: Tab) => {
    const sp = new URLSearchParams(params);
    if (next === 'product') sp.delete('type'); else sp.set('type', next);
    setParams(sp);
  };

  const border = `${t.borderWidth} solid ${t.colors.border}`;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'product', label: 'Products' },
    ...(articleCount ? [{ id: 'article' as Tab, label: 'Articles', count: articleCount }] : []),
    ...(pageCount ? [{ id: 'page' as Tab, label: 'Pages', count: pageCount }] : []),
  ];

  return (
    <div>
      {showTabs && (
        <div role="tablist" aria-label="Search result types" className="flex gap-6 mb-8" style={{ borderBottom: border }}>
          {tabs.map(x => (
            <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => select(x.id)} className="cursor-pointer bg-transparent border-0"
              style={{ fontFamily: t.fonts.body, fontSize: '13px', padding: '10px 0', color: tab === x.id ? t.colors.ink : t.colors.inkMuted, borderBottom: `2px solid ${tab === x.id ? t.colors.ink : 'transparent'}`, marginBottom: '-1px' }}>
              {x.label}{x.count != null ? ` (${x.count})` : ''}
            </button>
          ))}
        </div>
      )}
      {tab === 'product' && products}
      {tab === 'article' && content && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ listStyle: 'none', padding: 0 }}>
          {content.articles.map(a => (
            <li key={a.id} style={{ border, borderRadius: t.radius, overflow: 'hidden' }}>
              <Link to={`/blog/${a.slug}`} className="flex gap-4 no-underline" style={{ padding: '14px', color: t.colors.ink }}>
                {a.image && <img src={a.image} alt="" loading="lazy" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: t.radius }} />}
                <span>
                  <span style={{ display: 'block', fontFamily: t.fonts.display, fontWeight: t.headingWeight, fontSize: '16px', marginBottom: 4 }}>{a.title}</span>
                  {a.excerpt && <span style={{ display: 'block', fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted }}>{a.excerpt}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {tab === 'page' && content && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {content.pages.map(p => (
            <li key={p.id} style={{ borderBottom: border }}>
              <Link to={`/${p.slug}`} className="no-underline block" style={{ padding: '14px 0', fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.ink }}>{p.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
