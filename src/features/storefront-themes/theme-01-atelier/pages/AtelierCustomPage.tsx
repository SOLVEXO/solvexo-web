import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGetPublicStorePage, type StorePageData } from '@/api/services/storePages';
import { apiGetPublicMetafieldValues } from '@/api/services/metafields';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierContentBlocks } from '../components/AtelierContentBlocks';
import { AtelierNotFoundPage } from './AtelierNotFoundPage';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { atelierTheme as t } from '../theme.config';

/** Theme 01's own leaf page for any seller-created custom page (About Us,
 *  Shipping Policy, ...). Every store-builder starter template is a single
 *  `rich_text` section (see `PagesList.tsx`'s "New Page" templates), so this
 *  renders every section's blocks through the same real `ContentBlocks`
 *  content-model renderer the Journal article uses, one after another —
 *  the honest, real-data-backed common case. A page built from other
 *  section types (hero/testimonials/etc, a legacy-engine-only authoring
 *  surface) only shows its rich-text portions here — a disclosed scope
 *  boundary, not a silent drop. */
export function AtelierCustomPage() {
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const { store } = useStorefront();
  const [page, setPage] = useState<StorePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Dynamic Sources (Phase 9) — this page's own real metafield values.
  const [dynamicSourceValues, setDynamicSourceValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!pageSlug) return;
    setLoading(true); setNotFound(false);
    apiGetPublicStorePage(store.storeId, pageSlug)
      .then(res => setPage(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [store.storeId, pageSlug]);

  useEffect(() => {
    if (!page) { setDynamicSourceValues({}); return; }
    apiGetPublicMetafieldValues(store.storeId, 'page', page._id)
      .then(res => setDynamicSourceValues(Object.fromEntries(res.data.map(v => [`${v.namespace}:${v.key}`, v.value]))))
      .catch(() => setDynamicSourceValues({}));
  }, [store.storeId, page]);

  useStorefrontSeo({
    title: page?.seo.metaTitle || page?.title || undefined,
    description: page?.seo.metaDescription || page?.seo.metaDesc || undefined,
    image: page?.seo.ogImage || undefined,
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-4" style={{ padding: `48px ${t.layout.containerPadX}` }}>
        <div className="animate-pulse h-7 w-2/5" style={{ background: t.colors.bgAlt }} />
        <div className="animate-pulse" style={{ height: '200px', background: t.colors.bgAlt }} />
      </div>
    );
  }

  if (notFound || !page) {
    return <AtelierNotFoundPage />;
  }

  const richTextSections = page.sections.filter(s => s.type === 'rich_text' && s.enabled !== false);

  return (
    <main className="mx-auto" style={{ maxWidth: '760px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink, marginBottom: '28px' }}>{page.title}</h1>
      <div className="flex flex-col gap-8" style={{ fontFamily: t.fonts.body, color: t.colors.ink, fontSize: '14.5px', lineHeight: 1.75 }}>
        {richTextSections.map((section, i) => {
          // Dynamic Sources (Phase 9) — this section's own `heading` can
          // bind to a real metafield too, same resolution `RichTextSection.
          // tsx` (Home/other pages' shared renderer) already uses.
          const headingNs = section.settings?.dynamicSourceNamespace || 'custom';
          const headingKey = section.settings?.dynamicSourceKey;
          const boundHeading = headingKey ? dynamicSourceValues[`${headingNs}:${headingKey}`] : undefined;
          const heading = boundHeading !== undefined ? boundHeading : section.settings?.heading;
          return (
            <div key={section._id ?? i}>
              {heading && (
                <h2 style={{ fontFamily: t.fonts.display, fontSize: '19px', fontWeight: 600, color: t.colors.ink, marginBottom: '10px' }}>
                  {heading}
                </h2>
              )}
              <AtelierContentBlocks blocks={section.blocks.map(b => ({ type: b.type, settings: b.settings }))} dynamicSourceValues={dynamicSourceValues} />
            </div>
          );
        })}
        {richTextSections.length === 0 && (
          <p style={{ color: t.colors.inkMuted }}>This page has no content yet.</p>
        )}
      </div>
    </main>
  );
}
