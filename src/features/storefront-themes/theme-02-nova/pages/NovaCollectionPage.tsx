import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionBySlug, type PublicCollectionSummary } from '@/api/services/collections';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { NovaSectionRenderer } from '../sections';
import { NovaCollectionScopeProvider } from '../sections/collectionScope';
import { NovaProductGrid } from '../components/NovaProductGrid';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { novaTheme as t } from '../theme.config';

/** `/collections/:slugOrId` — genuinely template-driven, same real
 *  `collection-template` backend infra `AtelierCollectionPage` uses. If a
 *  store's template has never been customized, this page still shows a real
 *  product grid by itself rather than a blank page. */
export function NovaCollectionPage() {
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
        <p style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 700, color: t.colors.ink, marginBottom: '8px' }}>Collection not found</p>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, maxWidth: '340px' }}>This collection may have been removed or unpublished.</p>
      </div>
    );
  }

  const hasGridAnchor = sections.some(s => s.type === 'collection_product_grid' && s.enabled !== false);

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: t.colors.ink }}>{collection.name}</h1>
        {collection.description && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.inkMuted, maxWidth: '640px', marginTop: '10px', lineHeight: 1.7 }}>
            {collection.description}
          </p>
        )}
      </div>
      <NovaCollectionScopeProvider value={collection._id}>
        <NovaSectionRenderer sections={sections} />
      </NovaCollectionScopeProvider>
      {!hasGridAnchor && <NovaProductGrid collectionId={collection._id} />}
    </main>
  );
}
