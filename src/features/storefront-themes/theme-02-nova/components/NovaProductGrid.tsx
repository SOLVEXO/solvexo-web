import { StorefrontProductBrowser, type BrowseTokens } from '@/features/storefront/browse/StorefrontProductBrowser';
import { NovaProductCard } from './NovaProductCard';
import { novaTheme as t } from '../theme.config';
import type { BrowseSort } from '@/features/storefront/browse/browseState';

/** Shared Theme 02 product-listing engine — Category browse, Collection
 *  detail, and Search results are all a scoped instance of this one grid.
 *  Filtering, sorting and pagination (URL-synced, faceted) come from the shared
 *  `StorefrontProductBrowser`; this wrapper supplies Nova's tokens + card. */
export function NovaProductGrid({
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
    fonts: t.fonts, colors: t.colors, radius: t.radius.sm, borderWidth: '1.5px', headingWeight: 700, skeletonAspect: '1/1',
  };
  return (
    <StorefrontProductBrowser
      tokens={tokens}
      heading={heading} categoryId={categoryId} collectionId={collectionId} search={search} syncUrl={syncUrl}
      defaultSort={defaultSort} columns={columns} showFilters={showFilters}
      renderCard={(p, currency) => <NovaProductCard product={p} currency={currency} />}
    />
  );
}
