import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';

interface Tab { id: string; name: string; href: string; keys: string[] }

/** Bronze banner with the signature curved tab row. The tabs are the store's own top-level categories (else its collections). */
export function LedupHeroCategoryBanner({ activeCategory }: { activeCategory?: string }) {
  const { store } = useStorefront();
  const { pathname } = useLocation();
  const { tree } = useStoreCategoryTree(store.storeId);
  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);

  useEffect(() => {
    if (tree.length > 0) return;
    let off = false;
    apiGetPublicCollections(store.storeId).then(r => { if (!off) setCollections(r.data ?? []); }).catch(() => {});
    return () => { off = true; };
  }, [store.storeId, tree.length]);

  const tabs = useMemo<Tab[]>(() => {
    if (tree.length > 0) return tree.slice(0, 10).map(c => ({ id: c._id, name: c.name, href: `/category/${c.slug || c._id}`, keys: [c._id, c.slug].filter(Boolean) as string[] }));
    return collections.slice(0, 10).map(c => ({ id: c._id, name: c.name, href: `/collections/${c.slug || c._id}`, keys: [c._id, c.slug].filter(Boolean) as string[] }));
  }, [tree, collections]);

  // On phones the tab row scrolls sideways: bring the active tab into view.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const el = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && el) nav.scrollLeft = Math.max(0, el.offsetLeft - nav.clientWidth / 2 + el.offsetWidth / 2);
  }, [tabs, pathname]);

  if (tabs.length === 0) return null;

  return (
    <div className="ld-banner-wrap w-full">
      <div className="mx-auto max-w-[1440px]">
        <div className="ld-copper-gradient ld-banner px-6 pb-0 shadow-sm lg:px-12">
          <nav ref={navRef} aria-label="Categories" className="ld-hide-scrollbar flex items-end gap-2 overflow-x-auto border-b-0">
            {tabs.map(tab => {
              const on = tab.keys.some(k => k === activeCategory || pathname.endsWith(`/${k}`));
              return (
                <Link key={tab.id} to={tab.href} aria-current={on ? 'page' : undefined}
                  className={`relative z-10 whitespace-nowrap px-4 py-4 text-[14px] font-normal uppercase tracking-[0.15em] no-underline md:px-[15px] transition-colors ${on ? 'ld-tab-active shadow-sm' : 'rounded-t-xl text-white/85 hover:bg-white/10 hover:text-white'}`}>
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
