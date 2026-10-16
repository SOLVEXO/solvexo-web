import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicHomePage } from '@/api/services/storePages';
import { FashionSectionRenderer } from '../sections';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { ErrorBlock, PageSkeleton } from './pageParts';
import { useLoad } from '../../core/pageHooks';

/** Home: whatever sections the seller arranged on their home page, rendered by this theme. */
export function FashionHomePage() {
  const { store } = useStorefront();
  const { data, loading, error, retry } = useLoad(() => apiGetPublicHomePage(store.storeId).then(r => r.data), [store.storeId]);
  useStorefrontSeo({ title: data?.seo?.metaTitle || store.name, description: data?.seo?.metaDescription || data?.seo?.metaDesc, image: data?.seo?.ogImage });

  if (loading) return <PageSkeleton hero />;
  if (error || !data) return <ErrorBlock message="We couldn't load the store right now." onRetry={retry} />;
  return <FashionSectionRenderer sections={data.sections ?? []} />;
}
