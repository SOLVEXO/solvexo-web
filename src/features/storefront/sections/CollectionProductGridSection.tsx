import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { useParams } from 'react-router-dom';
import { LayoutList } from 'lucide-react';
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

registerSectionSchema({
  type: 'collection_product_grid',
  label: 'Collection Product Grid',
  description: 'The paginated product grid for whichever collection a buyer is currently browsing.',
  icon: LayoutList,
  color: '#0EA5E9',
  group: 'Products',
  hidden: true,
  templateTypes: ['collection'],
  settings: [
    { key: 'defaultSort', kind: 'select', label: 'Default sort', default: 'newest', options: [
      { value: 'newest', label: 'Newest' },
      { value: 'price_asc', label: 'Price: Low–High' },
      { value: 'price_desc', label: 'Price: High–Low' },
      { value: 'best_rated', label: 'Best Rated' },
    ] },
    { key: 'columns', kind: 'select', label: 'Columns', default: 3, options: [
      { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' },
    ] },
    { key: 'showFilters', kind: 'boolean', label: 'Show tag filters', default: true },
  ],
});
