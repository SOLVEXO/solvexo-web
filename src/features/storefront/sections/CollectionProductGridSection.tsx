import { registerSection } from '../sectionRenderRegistry';
import { useParams } from 'react-router-dom';
import { ProductCatalogSection } from './ProductCatalogSection';

export interface CollectionProductGridSectionSettings {
  defaultSort?: 'newest' | 'price_asc' | 'price_desc' | 'best_rated';
  columns?:     2 | 3 | 4;
  showFilters?: boolean;
}

/**
 * A thin, contextual wrapper around `ProductCatalogSection` — the one
 * difference from a seller-configured `product_catalog` section is that
 * `collectionId` is never stored in `settings` (there's nothing to configure:
 * this section only ever exists inside the singleton Collection Template,
 * see `collection-template/`), it's resolved from the current route instead,
 * exactly like `CollectionDetailPage.tsx` used to hardcode it before the
 * Collection Template rebuild.
 */
export function CollectionProductGridSection({ settings }: { settings: CollectionProductGridSectionSettings }) {
  const { slugOrId = '' } = useParams<{ slugOrId: string }>();
  return (
    <ProductCatalogSection
      settings={{
        collectionId: slugOrId,
        defaultSort: settings.defaultSort ?? 'newest',
        columns: settings.columns ?? 3,
        showFilters: settings.showFilters,
      }}
    />
  );
}

registerSection('collection_product_grid', (section) =>
  <CollectionProductGridSection settings={section.settings as CollectionProductGridSectionSettings} />,
);
