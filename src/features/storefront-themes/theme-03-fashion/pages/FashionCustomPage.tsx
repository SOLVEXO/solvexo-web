import { useParams } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStorePage, apiPublicPageMayExist } from '@/api/services/storePages';
import { useLocalize } from '@/hooks/useLocalize';
import { FashionSectionRenderer } from '../sections';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { FashionNotFoundPage } from './FashionNotFoundPage';
import { ErrorBlock, PageSkeleton } from './pageParts';
import { useLoad } from '../../core/pageHooks';

/** Any seller page (About, Contact, policies...) at `/:pageSlug`; an unknown slug falls through to the 404 page. */
export function FashionCustomPage({ slug }: { slug?: string } = {}) {
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

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorBlock message={ts('pg.we_couldn_t_load_this_page', 'We couldn\'t load this page.')} onRetry={retry} />;
  if (!page) return <FashionNotFoundPage />;
  return <FashionSectionRenderer sections={page.sections ?? []} />;
}
