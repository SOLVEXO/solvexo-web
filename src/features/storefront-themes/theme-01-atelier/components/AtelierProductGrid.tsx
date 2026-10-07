import { StorefrontProductBrowser, type BrowseTokens } from '@/features/storefront/browse/StorefrontProductBrowser';
import { AtelierProductCard } from './AtelierProductCard';
import { atelierTheme as t } from '../theme.config';
import type { BrowseSort } from '@/features/storefront/browse/browseState';

/** Shared Theme 01 product-listing engine — Category browse, Collection
 *  detail, Search results and the Products page are all a scoped instance of
 *  this one grid. The filter/sort/pagination behaviour (Shopify-style
 *  `filter.*` / `sort_by` / `page` URL state, facet counts, chips, mobile
 *  drawer) lives in the shared `StorefrontProductBrowser`; this wrapper only
 *  supplies Atelier's tokens and product card. `syncUrl` puts the state in the
 *  query string (page-level listings); embedded home-page grids keep it local. */
export function AtelierProductGrid({
  heading, categoryId, collectionId, search, syncUrl, defaultSort, columns, showFilters,
}: {
  heading?: string;
  categoryId?: string;
  collectionId?: string;
  search?: string;
  syncUrl?: boolean;
  defaultSort?: BrowseSort;
  columns?: 2 | 3 | 4;
  showFilters?: boolean;
}) {
  const tokens: BrowseTokens = {
    fonts: t.fonts, colors: t.colors, radius: t.radius.sm, borderWidth: '1px', headingWeight: 600, skeletonAspect: '3/4',
  };
  return (
    <StorefrontProductBrowser
      tokens={tokens}
      heading={heading} categoryId={categoryId} collectionId={collectionId} search={search} syncUrl={syncUrl}
      defaultSort={defaultSort} columns={columns} showFilters={showFilters}
      renderCard={(p, currency) => <AtelierProductCard product={p} currency={currency} />}
    />
  );
}
