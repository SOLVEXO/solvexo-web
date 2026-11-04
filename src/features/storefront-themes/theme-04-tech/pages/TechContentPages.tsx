import { useParams } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicHomePage } from '@/api/services/storePages';
import { apiGetPublicStorePage, apiPublicPageMayExist } from '@/api/services/storePages';
import { useLocalize } from '@/hooks/useLocalize';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { useLoad } from '../../core/pageHooks';
import { FashionNotFoundPage } from '../../theme-03-fashion/pages/FashionNotFoundPage';
import { TechSectionRenderer } from '../sections';
import { TechBox, TechError, TechSkeleton } from '../ui/techUi';

/** Home: whatever sections the seller arranged on their home page, rendered by this theme. */
export function TechHomePage() {
  const { store } = useStorefront();
  const { data, loading, error, retry } = useLoad(() => apiGetPublicHomePage(store.storeId).then(r => r.data), [store.storeId]);
  useStorefrontSeo({ title: data?.seo?.metaTitle || store.name, description: data?.seo?.metaDescription || data?.seo?.metaDesc, image: data?.seo?.ogImage });
  useJsonLd('website', {
    '@context': 'https://schema.org', '@type': 'WebSite', name: store.name, url: window.location.origin,
    potentialAction: { '@type': 'SearchAction', target: `${window.location.origin}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  });
  if (loading) return <TechBox><TechSkeleton h={280} rows={3} /></TechBox>;
  if (error || !data) return <TechError message={ts('pg.we_couldn_t_load_the_store_right_now', "We couldn't load the store right now.")} onRetry={retry} />;
  return <TechSectionRenderer sections={data.sections ?? []} />;
}

/** Any seller page (About, Contact, Terms...) at `/:pageSlug`. These are made of sections the seller edits, so no text is built in here; an unknown slug falls through to the 404 page. */
export function TechCustomPage({ slug }: { slug?: string } = {}) {
  const params = useParams();
  const pageSlug = slug ?? params.pageSlug ?? '';
  const { store } = useStorefront();
  const localize = useLocalize();
  const { data, loading, error, retry } = useLoad(
    async () => {
      if (!(await apiPublicPageMayExist(store.storeId, pageSlug))) return null;
      return apiGetPublicStorePage(store.storeId, pageSlug).then(r => r.data).catch((e: { status?: number }) => { if (e?.status === 404) return null; throw e; });
    },
    [store.storeId, pageSlug],
  );
  const page = data ? localize.page(data) : null;
  useStorefrontSeo({ title: page?.seo?.metaTitle || page?.title, description: page?.seo?.metaDescription || page?.seo?.metaDesc, image: page?.seo?.ogImage, noindex: page?.seo?.noindex });
  if (loading) return <TechBox><TechSkeleton h={240} rows={2} /></TechBox>;
  if (error) return <TechError message={ts('pg.we_couldn_t_load_this_page', "We couldn't load this page.")} onRetry={retry} />;
  if (!page) return <FashionNotFoundPage />;
  return <TechSectionRenderer sections={page.sections ?? []} />;
}
