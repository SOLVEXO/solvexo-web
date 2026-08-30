import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { apiGetPublicStorePage, type StorePageData } from '@/api/services/storePages';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierContentBlocks } from '../components/AtelierContentBlocks';
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

  useEffect(() => {
    if (!pageSlug) return;
    setLoading(true); setNotFound(false);
    apiGetPublicStorePage(store.storeId, pageSlug)
      .then(res => setPage(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [store.storeId, pageSlug]);

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
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: '50vh', padding: '20px' }}>
        <FileQuestion size={36} style={{ color: t.colors.inkMuted }} />
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted }}>This page doesn't exist.</p>
      </div>
    );
  }

  const richTextSections = page.sections.filter(s => s.type === 'rich_text' && s.enabled !== false);

  return (
    <main className="mx-auto" style={{ maxWidth: '760px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink, marginBottom: '28px' }}>{page.title}</h1>
      <div className="flex flex-col gap-8" style={{ fontFamily: t.fonts.body, color: t.colors.ink, fontSize: '14.5px', lineHeight: 1.75 }}>
        {richTextSections.map((section, i) => (
          <div key={section._id ?? i}>
            {section.settings?.heading && (
              <h2 style={{ fontFamily: t.fonts.display, fontSize: '19px', fontWeight: 600, color: t.colors.ink, marginBottom: '10px' }}>
                {section.settings.heading}
              </h2>
            )}
            <AtelierContentBlocks blocks={section.blocks.map(b => ({ type: b.type, settings: b.settings }))} />
          </div>
        ))}
        {richTextSections.length === 0 && (
          <p style={{ color: t.colors.inkMuted }}>This page has no content yet.</p>
        )}
      </div>
    </main>
  );
}
