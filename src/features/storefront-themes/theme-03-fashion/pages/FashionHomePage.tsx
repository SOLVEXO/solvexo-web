import { useStorefront } from '@/features/storefront/StorefrontContext';
import { ts } from '@/utils/tStatic';
import { apiGetPublicHomePage } from '@/api/services/storePages';
import { FashionSectionRenderer } from '../sections';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { ErrorBlock, PageSkeleton } from './pageParts';
import { useLoad } from '../../core/pageHooks';

/** Home: whatever sections the seller arranged on their home page, rendered by this theme. */
export function FashionHomePage() {
  const { store } = useStorefront();
  const { data, loading, error, retry } = useLoad(() => apiGetPublicHomePage(store.storeId).then(r => r.data), [store.storeId]);
  useStorefrontSeo({ title: data?.seo?.metaTitle || store.name, description: data?.seo?.metaDescription || data?.seo?.metaDesc, image: data?.seo?.ogImage });
  useJsonLd('website', {
    '@context': 'https://schema.org', '@type': 'WebSite', name: store.name, url: window.location.origin,
    potentialAction: { '@type': 'SearchAction', target: `${window.location.origin}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  });

  if (loading) return <PageSkeleton hero />;
  if (error || !data) return <ErrorBlock message={ts('pg.we_couldn_t_load_the_store_right_now', 'We couldn\'t load the store right now.')} onRetry={retry} />;
  return <FashionSectionRenderer sections={data.sections ?? []} />;
}
