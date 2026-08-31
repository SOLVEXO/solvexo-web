import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { NovaSectionRenderer } from '../sections';
import { NovaProductGrid } from '../components/NovaProductGrid';
import { novaTheme as t } from '../theme.config';

/** `/search?q=` — same real template-driven shape as `AtelierSearchPage`
 *  (see that file's own doc comment on why it reuses the backend's `page`
 *  resourceType bucket with a `search` template key). */
export function NovaSearchPage() {
  const { store } = useStorefront();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  useStorefrontSeo({ title: q ? `"${q}"` : 'Search' });

  const [sections, setSections] = useState<Section[]>([]);
  useEffect(() => {
    apiGetPublicCollectionTemplate(store.storeId, 'page', 'search')
      .then(res => setSections(res.data.sections ?? []))
      .catch(() => setSections([]));
  }, [store.storeId]);

  if (!q.trim()) {
    return (
      <div style={{ padding: '96px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted }}>Type something to search this store.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
      {sections.length > 0 && <div style={{ marginBottom: '32px' }}><NovaSectionRenderer sections={sections} /></div>}
      <NovaProductGrid heading={`Results for "${q}"`} search={q} />
    </main>
  );
}
