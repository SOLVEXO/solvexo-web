import { useParams, Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicHomePage, apiGetPublicStorePage, apiPublicPageMayExist } from '@/api/services/storePages';
import { useLocalize } from '@/hooks/useLocalize';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { useLoad } from '../../core/pageHooks';
import { LedupSectionRenderer } from '../sections';
import { LedupBox, LedupSkeleton, LedupError } from '../ui/ledupUi';

export function LedupHomePage() {
  const { store } = useStorefront();
  const { data, loading, error, retry } = useLoad(
    () => apiGetPublicHomePage(store.storeId).then(r => r.data),
    [store.storeId],
  );

  useStorefrontSeo({
    title: data?.seo?.metaTitle || store.name,
    description: data?.seo?.metaDescription || store.description || undefined,
    image: data?.seo?.ogImage,
  });
  useJsonLd('website', { '@context': 'https://schema.org', '@type': 'WebSite', name: store.name, url: window.location.origin });

  if (loading) return <LedupBox><LedupSkeleton h={320} rows={3} /></LedupBox>;
  if (error || !data) return <LedupBox><LedupError message={ts('pg.we_couldn_t_load_this_page', "We couldn't load this page.")} onRetry={retry} /></LedupBox>;

  // A store that has not built its home yet shows a plain starter: category tabs, then its newest products.
  const starter: Section[] = [
    { _id: 'hero', type: 'hero_banner', settings: {}, blocks: [] } as unknown as Section,
    { _id: 'featured', type: 'featured_products', settings: { heading: ts('ld.newProducts', 'New products'), limit: 8 }, blocks: [] } as unknown as Section,
  ];
  const sections = data.sections && data.sections.length > 0 ? data.sections : starter;

  return <LedupSectionRenderer sections={sections} />;
}

export function LedupCustomPage({ slug }: { slug?: string } = {}) {
  const params = useParams();
  const pageSlug = slug ?? params.pageSlug ?? '';
  const { store } = useStorefront();
  const localize = useLocalize();

  const { data, loading, error, retry } = useLoad(
    async () => {
      if (!(await apiPublicPageMayExist(store.storeId, pageSlug))) return null;
      return apiGetPublicStorePage(store.storeId, pageSlug).then(r => r.data).catch((e: { status?: number }) => {
        if (e?.status === 404) return null;
        throw e;
      });
    },
    [store.storeId, pageSlug],
  );

  const page = data ? localize.page(data) : null;
  useStorefrontSeo({ title: page?.seo?.metaTitle || page?.title, description: page?.seo?.metaDescription, image: page?.seo?.ogImage });

  if (loading) return <LedupBox><LedupSkeleton h={240} rows={2} /></LedupBox>;
  if (error) return <LedupBox><LedupError message={ts('pg.we_couldn_t_load_this_page', "We couldn't load this page.")} onRetry={retry} /></LedupBox>;
  if (!page) return <LedupNotFoundPage />;

  return (
    <div className="py-12">
      <LedupBox>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">{page.title}</h1>
      </LedupBox>
      {page.sections && page.sections.length > 0 && <LedupSectionRenderer sections={page.sections} />}
    </div>
  );
}

export function LedupNotFoundPage() {
  return (
    <div className="py-24 text-center">
      <LedupBox narrow>
        <span className="text-6xl font-light text-[var(--ld-accent)]">404</span>
        <h1 className="mt-4 text-3xl font-bold text-stone-900">{ts('pg.page_not_found', 'Page not found')}</h1>
        <p className="mt-3 text-sm text-stone-500">{ts('pg.the_page_you_are_looking_for_does_not_exist', 'The page you are looking for does not exist or has moved.')}</p>
        <div className="mt-8">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-[var(--ld-accent)] px-6 py-3 text-sm font-medium text-white no-underline transition hover:bg-[var(--ld-accent-hover)]">
            {ts('pg.back_to_home', 'Back to home')} <ArrowUpRight size={14} aria-hidden />
          </Link>
        </div>
      </LedupBox>
    </div>
  );
}
