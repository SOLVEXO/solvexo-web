import { useEffect, useMemo, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { useStorefront, type ResolvedStorefrontNavItem, type StorefrontNavItemSettings } from '@/features/storefront/StorefrontContext';
import { useContentLocale } from '@/features/storefront/storefrontMarket';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { buildNavImageLookup, normalizeNavItems } from '../../navigation/megaNav';
import { readHeaderOptions } from '../../navigation/headerOptions';

/** The header menu: the seller's own "nav_link" blocks; without any, a Shop menu built from the collections plus the pages marked for the menu. */
export function useLedupNav(): { items: ResolvedStorefrontNavItem[]; pages: PublicPageSummary[] } {
  const { store, theme, resolveLink } = useStorefront();
  const locale = useContentLocale();
  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);
  const [pages, setPages] = useState<PublicPageSummary[]>([]);

  useEffect(() => {
    let off = false;
    apiGetPublicCollections(store.storeId).then(r => { if (!off) setCollections(r.data ?? []); }).catch(() => {});
    apiListPublicStorePages(store.storeId).then(r => { if (!off) setPages(r.data ?? []); }).catch(() => {});
    return () => { off = true; };
  }, [store.storeId]);

  const header = theme?.header;
  const o = readHeaderOptions(header, ts('blog.label', 'Blog'));

  const items = useMemo(() => {
    const lookup = buildNavImageLookup([], collections);
    const authored = (header?.blocks ?? []).filter(b => b.type === 'nav_link' && b.enabled !== false);
    if (authored.length > 0) return normalizeNavItems(authored.map(b => b.settings as StorefrontNavItemSettings), resolveLink, lookup, 'nav', locale);
    const auto: StorefrontNavItemSettings[] = [];
    if (o.showShopMenu) auto.push({ label: o.shopLabel, linkType: 'search', menuStyle: 'mega', children: collections.slice(0, 12).map(c => ({ label: c.name, linkType: 'collection', collectionId: c.slug || c._id })) });
    if (o.includePagesInNav) pages.filter(p => p.showInNav).forEach(p => auto.push({ label: p.title, linkType: 'page', pageSlug: p.slug }));
    if (o.showDefaultBlogLink) auto.push({ label: o.blogLabel, linkType: 'blog' });
    return normalizeNavItems(auto, resolveLink, lookup, 'auto', locale);
  }, [header?.blocks, resolveLink, locale, o.showShopMenu, o.shopLabel, o.includePagesInNav, o.showDefaultBlogLink, o.blogLabel, collections, pages]);

  return { items, pages };
}
