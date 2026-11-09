/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { useContext } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { CollectionScopeContext } from './collectionScope';
import { LedupProductBrowser } from '../components/LedupProductBrowser';
import { LedupSectionShell } from './ledupSectionsPort';
import { registerLedupSection } from './ledupSectionRegistry';
import { showEyebrow } from '../../sectionCopy';

/** The collection page's product list: the seller's collection template holds this section, Tech draws it with the filter sidebar. */
function CollectionGrid({ settings: s, colors }: { settings: Record<string, any>; colors: Parameters<typeof LedupSectionShell>[0]['colors'] }) {
  const { previewCollectionId } = useStorefront();
  const scope = useContext(CollectionScopeContext);
  const collectionId = scope?.collectionId ?? previewCollectionId ?? undefined;
  return (
    <LedupSectionShell colors={colors}>
      <LedupProductBrowser collectionId={collectionId} onProducts={scope?.onProducts} syncUrl={!!scope} defaultSort={s.defaultSort} showFilters={s.showFilters !== false} />
    </LedupSectionShell>
  );
}
registerLedupSection('collection_product_grid', (section, _b, colors) => <CollectionGrid settings={section.settings} colors={colors} />);

registerLedupSection('product_catalog', (section, _b, colors) => {
  const s = section.settings as Record<string, any>;
  const eyebrow = showEyebrow(s) && typeof s.eyebrow === 'string' && s.eyebrow.trim() ? s.eyebrow : '';
  return (
    <LedupSectionShell colors={colors}>
      <div id="shop">
        <LedupProductBrowser heading={s.heading || eyebrow ? (
          <div className="mb-5">
            {eyebrow && <p className="m-0 mb-2 text-sm font-medium" style={{ color: colors.inkMuted }}>{eyebrow}</p>}
            {s.heading && <h2 className="m-0 text-[clamp(20px,2.4vw,26px)] font-semibold">{s.heading}</h2>}
          </div>
        ) : undefined} categoryId={s.categoryId || undefined} collectionId={s.collectionId || undefined} defaultSort={s.defaultSort} showFilters={s.showFilters !== false} />
      </div>
    </LedupSectionShell>
  );
});
