import type { Section } from '@/api/services/storefrontTypes';
import { AtelierProductGrid } from '../components/AtelierProductGrid';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';
import { useAtelierCollectionScope } from './collectionScope';

// No section-root color reads here — `AtelierProductGrid` is a shared
// component (also used by the collection-scoped grid below) that stays on
// theme-wide `t.colors`, so `colors` is accepted for signature consistency
// but otherwise unused.
registerAtelierSection('product_catalog', (section: Section, _blocks, _colors: AtelierSectionColors) => (
  <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
    <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
      <AtelierProductGrid heading={section.settings.heading} categoryId={section.settings.categoryId} collectionId={section.settings.collectionId} />
    </div>
  </div>
));

// Contextual — always the collection currently being browsed (see
// `section-settings.types.ts`'s comment on `CollectionProductGridSectionSettings`).
// Only ever appears inside a Collection template, never Home. Renders
// identically to `product_catalog` minus a heading, since `AtelierCollectionPage`
// already prints the collection's own name above it. The real collection id
// comes from `AtelierCollectionScopeProvider` (set by `AtelierCollectionPage`)
// — without it this would silently render every product in the store
// instead of just this collection's.
function CollectionProductGrid() {
  const collectionId = useAtelierCollectionScope();
  return (
    <div style={{ padding: `0 ${t.layout.containerPadX} ${t.layout.sectionPadY}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        <AtelierProductGrid collectionId={collectionId ?? undefined} />
      </div>
    </div>
  );
}

registerAtelierSection('collection_product_grid', (_section, _blocks, _colors: AtelierSectionColors) => <CollectionProductGrid />);
