import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PackageX } from 'lucide-react';
import { useStorefront } from '../StorefrontContext';
import { apiGetPublicCollectionBySlug, type PublicCollectionSummary } from '@/api/services/collections';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { SectionRenderer } from '../SectionRenderer';

/** `/collections/:slugOrId` — a named collection's own page. Renders the
 *  store's singleton Collection Template (real, seller-editable Sections,
 *  same system Home/Pages already use — see `collection-template/` on the
 *  backend and the Store Builder's "Collection" tab) instead of a hardcoded
 *  grid. The template's `collection_product_grid` section resolves its own
 *  `collectionId` from this same route (see `CollectionProductGridSection`),
 *  whose backend resolution already accepts a slug or an id, so this works
 *  whether the visitor arrived via a pretty `/collections/new-arrivals` URL
 *  or a nav link storing the raw id. */
export function CollectionDetailPage() {
  const { slugOrId = '' } = useParams<{ slugOrId: string }>();
  const { store, cfg } = useStorefront();
  const [collection, setCollection] = useState<PublicCollectionSummary | null | undefined>(undefined);
  const [sections, setSections] = useState<Section[] | undefined>(undefined);

  useEffect(() => {
    setCollection(undefined);
    apiGetPublicCollectionBySlug(store.storeId, slugOrId)
      .then(res => setCollection(res.data))
      .catch(() => setCollection(null));
  }, [store.storeId, slugOrId]);

  useEffect(() => {
    setSections(undefined);
    apiGetPublicCollectionTemplate(store.storeId)
      .then(res => setSections(res.data.sections))
      .catch(() => setSections([]));
  }, [store.storeId]);

  useEffect(() => {
    document.title = collection ? `${collection.name} — ${store.name}` : store.name;
    return () => { document.title = 'Solvexo'; };
  }, [collection, store.name]);

  if (collection === undefined || sections === undefined) {
    return <div className="px-4 sm:px-6 lg:px-10 py-16 text-center"><p className="text-[13px] text-slate">Loading…</p></div>;
  }
  if (!collection) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-20 flex flex-col items-center gap-3 text-center">
        <PackageX size={28} style={{ color: cfg.textColor, opacity: 0.4 }} />
        <p className="text-[15px] font-semibold" style={{ color: cfg.textColor }}>Collection not found</p>
        <p className="text-[13px] text-slate max-w-sm">This collection may have been removed or unpublished.</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-10 pt-6">
        <h1 className="font-bold" style={{ color: cfg.textColor, fontSize: Math.round(24 * cfg.typeScaleFactor) }}>{collection.name}</h1>
        {collection.description && (
          <p className="text-[13px] max-w-2xl mt-1" style={{ color: cfg.textColor, opacity: 0.75 }}>{collection.description}</p>
        )}
      </div>
      <SectionRenderer sections={sections} />
    </>
  );
}
