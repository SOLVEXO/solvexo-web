import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import { CORE_SECTION_TYPES, type Section } from '@/api/services/storefrontTypes';
import { AtelierSectionRenderer } from '../sections';
import { AtelierProductGrid } from '../components/AtelierProductGrid';
import { StorefrontSearchTabs } from '@/features/storefront/browse/StorefrontSearchTabs';
import type { BrowseTokens } from '@/features/storefront/browse/StorefrontProductBrowser';
import { atelierTheme as t } from '../theme.config';

/** `/search?q=` — the results grid itself is fixed commerce-critical core
 *  (same `AtelierProductGrid` Category/Collection use), but the surrounding
 *  content is genuinely template-driven: a real alternate-template document
 *  (`resourceType: 'page', templateKey: 'search'`) via the same
 *  `collection-template` backend infra Product/Collection Template use —
 *  `'page'` is the deployed backend's own general-purpose bucket for a
 *  named template beyond product/collection (its `resourceType` enum is
 *  fixed to `collection|product|page` on the currently-deployed backend;
 *  adding a dedicated `'search'` value would need a backend schema change
 *  and redeploy, out of scope this pass — reusing the real `page` bucket
 *  with a `search` template key needs zero backend changes and is genuinely
 *  real, versioned, draft/publishable data, not a shortcut). */
export function AtelierSearchPage() {
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

  // `search_results` (the locked core section, seeded server-side) is NOT
  // re-rendered here — `AtelierProductGrid` below is already the real
  // results grid; rendering it again would duplicate the grid on the page.
  const surrounding = sections.filter(s => !CORE_SECTION_TYPES.includes(s.type));

  const tokens: BrowseTokens = { fonts: t.fonts, colors: t.colors, radius: t.radius.sm, borderWidth: '1px', headingWeight: 600, skeletonAspect: '3/4' };

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
      {surrounding.length > 0 && <div style={{ marginBottom: '32px' }}><AtelierSectionRenderer sections={surrounding} /></div>}
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink, marginBottom: '24px' }}>Results for &quot;{q}&quot;</h1>
      <StorefrontSearchTabs tokens={tokens} q={q} products={<AtelierProductGrid search={q} syncUrl />} />
    </main>
  );
}
