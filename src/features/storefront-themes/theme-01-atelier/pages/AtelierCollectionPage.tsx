import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionBySlug, type PublicCollectionSummary } from '@/api/services/collections';
import { AtelierProductGrid } from '../components/AtelierProductGrid';
import { atelierTheme as t } from '../theme.config';

/** `/collections/:slugOrId` — resolves the named collection for its
 *  name/description, then scopes Theme 01's own `AtelierProductGrid` to it.
 *  Deliberately does not consume the legacy Collection Template's
 *  seller-editable section list (a legacy-engine-only authoring concept) —
 *  a genuinely independent theme renders its own collection page from real
 *  commerce data (collection + products), not another engine's content
 *  model. A disclosed scope boundary, not an oversight. */
export function AtelierCollectionPage() {
  const { slugOrId = '' } = useParams<{ slugOrId: string }>();
  const { store } = useStorefront();
  const [collection, setCollection] = useState<PublicCollectionSummary | null | undefined>(undefined);

  useEffect(() => {
    setCollection(undefined);
    apiGetPublicCollectionBySlug(store.storeId, slugOrId)
      .then(res => setCollection(res.data))
      .catch(() => setCollection(null));
  }, [store.storeId, slugOrId]);

  usePageTitle(collection ? collection.name : store.name);

  if (collection === undefined) {
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

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
      {collection.description && (
        <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.inkMuted, maxWidth: '640px', marginBottom: '24px', lineHeight: 1.7 }}>
          {collection.description}
        </p>
      )}
      <AtelierProductGrid heading={collection.name} collectionId={collection._id} />
    </main>
  );
}
