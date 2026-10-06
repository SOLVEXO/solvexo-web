import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGetPublicStorePage, type StorePageData } from '@/api/services/storePages';
import { apiGetPublicMetafieldValues } from '@/api/services/metafields';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaSectionRenderer } from '../sections';
import { NovaNotFoundPage } from './NovaNotFoundPage';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { novaTheme as t } from '../theme.config';

/** Theme 02's own leaf page for any seller-created custom page (About Us,
 *  Shipping Policy, ...) — same real data source and `rich_text`-only scope
 *  boundary as `AtelierCustomPage` (every store-builder starter template is
 *  a single `rich_text` section; a page built from other section types only
 *  shows its rich-text portions here, a disclosed scope boundary, not a
 *  silent drop). A genuinely unmatched slug renders Nova's own real 404
 *  (`NovaNotFoundPage`), mirroring `AtelierCustomPage`'s use of
 *  `AtelierNotFoundPage` for the same case. */
export function NovaCustomPage() {
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const { store } = useStorefront();
  const [page, setPage] = useState<StorePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Dynamic Sources (Phase 9) — see AtelierCustomPage's identical comment.
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
        <div className="animate-pulse" style={{ height: '200px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />
      </div>
    );
  }

  if (notFound || !page) {
    return <NovaNotFoundPage />;
  }

  return (
    <main className="w-full">
      <div className="mx-auto" style={{ maxWidth: '760px', padding: `48px ${t.layout.containerPadX} 0` }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 700, color: t.colors.ink, marginBottom: '28px' }}>{page.title}</h1>
      </div>
      {page.sections.length
        ? <NovaSectionRenderer sections={page.sections} dynamicSourceValues={dynamicSourceValues} />
        : <p className="mx-auto" style={{ maxWidth: '760px', padding: `0 ${t.layout.containerPadX}`, fontFamily: t.fonts.body, color: t.colors.inkMuted }}>This page has no content yet.</p>}
    </main>
  );
}
