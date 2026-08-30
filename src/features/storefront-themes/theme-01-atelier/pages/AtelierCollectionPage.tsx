import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionBySlug, type PublicCollectionSummary } from '@/api/services/collections';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { AtelierSectionRenderer } from '../sections';
import { AtelierCollectionScopeProvider } from '../sections/collectionScope';
import { AtelierProductGrid } from '../components/AtelierProductGrid';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { atelierTheme as t } from '../theme.config';

/** `/collections/:slugOrId` — genuinely template-driven: renders the
 *  store's real "collection" alternate-template document (same
 *  `collection-template` backend infra Product Template and the Customize
 *  page's Collection Template tab use) through Atelier's own section
 *  engine. The template's `collection_product_grid` section is the
 *  structural anchor (always the collection currently being browsed); if a
 *  store's template has never been customized (no sections yet), this page
 *  still shows a real product grid by itself rather than a blank page. */
export function AtelierCollectionPage() {
  const { slugOrId = '' } = useParams<{ slugOrId: string }>();
  const { store } = useStorefront();
  const [collection, setCollection] = useState<PublicCollectionSummary | null | undefined>(undefined);
  const [sections, setSections] = useState<Section[] | undefined>(undefined);

  useEffect(() => {
    setCollection(undefined);
    apiGetPublicCollectionBySlug(store.storeId, slugOrId)
      .then(res => setCollection(res.data))
      .catch(() => setCollection(null));
  }, [store.storeId, slugOrId]);

  useEffect(() => {
    if (collection === undefined) return;
    setSections(undefined);
    apiGetPublicCollectionTemplate(store.storeId, 'collection', collection?.templateKey || 'default')
      .then(res => setSections(res.data.sections ?? []))
      .catch(() => setSections([]));
  }, [store.storeId, collection]);

  useStorefrontSeo({
    title: collection ? collection.name : undefined,
    description: collection?.description || undefined,
    image: collection?.image || undefined,
  });

  if (collection === undefined || sections === undefined) {
    return <div style={{ padding: '96px 0', textAlign: 'center', fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted }}>Loading…</div>;
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center text-center" style={{ padding: '96px 20px' }}>
        <p style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 600, color: t.colors.ink, marginBottom: '8px' }}>Collection not found</p>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, maxWidth: '340px' }}>This collection may have been removed or unpublished.</p>
      </div>
    );
  }

  const hasGridAnchor = sections.some(s => s.type === 'collection_product_grid' && s.enabled !== false);

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink }}>{collection.name}</h1>
        {collection.description && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.inkMuted, maxWidth: '640px', marginTop: '10px', lineHeight: 1.7 }}>
            {collection.description}
          </p>
        )}
      </div>
      <AtelierCollectionScopeProvider value={collection._id}>
        <AtelierSectionRenderer sections={sections} />
      </AtelierCollectionScopeProvider>
      {!hasGridAnchor && <AtelierProductGrid collectionId={collection._id} />}
    </main>
  );
}
