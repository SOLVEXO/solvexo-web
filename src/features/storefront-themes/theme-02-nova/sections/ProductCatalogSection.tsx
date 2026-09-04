import type { Section } from '@/api/services/storefrontTypes';
import { NovaProductGrid } from '../components/NovaProductGrid';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';
import { useNovaCollectionScope } from './collectionScope';

// No section-root color reads here — `NovaProductGrid` is a shared
// component (also used by the collection-scoped grid below) that stays on
// theme-wide `t.colors`, so `colors` is accepted for signature consistency
// but otherwise unused.
registerNovaSection('product_catalog', (section: Section, _blocks, _colors: NovaSectionColors) => (
  <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
    <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
      <NovaProductGrid heading={section.settings.heading} categoryId={section.settings.categoryId} collectionId={section.settings.collectionId} />
    </div>
  </div>
));

// Contextual — always the collection currently being browsed. Same shape as
// `theme-01-atelier`'s `CollectionProductGrid`: only ever appears inside a
// Collection template, real collection id comes from
// `NovaCollectionScopeProvider` (set by `NovaCollectionPage`).
function CollectionProductGrid() {
  const collectionId = useNovaCollectionScope();
  return (
    <div style={{ padding: `0 ${t.layout.containerPadX} ${t.layout.sectionPadY}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        <NovaProductGrid collectionId={collectionId ?? undefined} />
      </div>
    </div>
  );
}

registerNovaSection('collection_product_grid', (_section, _blocks, _colors: NovaSectionColors) => <CollectionProductGrid />);
