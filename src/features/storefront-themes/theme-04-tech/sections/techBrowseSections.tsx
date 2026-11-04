/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { useContext } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { CollectionScopeContext } from './collectionScope';
import { TechProductBrowser } from '../components/TechProductBrowser';
import { TechSectionShell } from './techSections';
import { registerTechSection } from './techSectionRegistry';

/** The collection page's product list: the seller's collection template holds this section, Tech draws it with the filter sidebar. */
function CollectionGrid({ settings: s, colors }: { settings: Record<string, any>; colors: Parameters<typeof TechSectionShell>[0]['colors'] }) {
  const { previewCollectionId } = useStorefront();
  const scope = useContext(CollectionScopeContext);
  const collectionId = scope?.collectionId ?? previewCollectionId ?? undefined;
  return (
    <TechSectionShell colors={colors}>
      <TechProductBrowser collectionId={collectionId} onProducts={scope?.onProducts} syncUrl={!!scope} defaultSort={s.defaultSort} showFilters={s.showFilters !== false} />
    </TechSectionShell>
  );
}
registerTechSection('collection_product_grid', (section, _b, colors) => <CollectionGrid settings={section.settings} colors={colors} />);

registerTechSection('product_catalog', (section, _b, colors) => {
  const s = section.settings as Record<string, any>;
  return (
    <TechSectionShell colors={colors}>
      <div id="shop">
        <TechProductBrowser heading={s.heading ? <h2 className="m-0 mb-5 text-[clamp(20px,2.4vw,26px)] font-semibold">{s.heading}</h2> : undefined} categoryId={s.categoryId || undefined} collectionId={s.collectionId || undefined} defaultSort={s.defaultSort} showFilters={s.showFilters !== false} />
      </div>
    </TechSectionShell>
  );
});
