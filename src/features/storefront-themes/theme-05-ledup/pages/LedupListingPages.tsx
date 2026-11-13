import { useParams, useSearchParams } from 'react-router-dom';
import { LedupSectionRenderer } from '../sections';
import { splitAround, useLoad, useTemplateSections } from '../../core/pageHooks';
import { ts, tsNodes } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionBySlug } from '@/api/services/collections';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import type { CategoryNode } from '@/api/services/categories';
import { useLocalize } from '@/hooks/useLocalize';
import { renderRichText } from '@/utils/richText';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { breadcrumbJsonLd, collectionJsonLd, pageUrlBuilder } from '../../core/seo/jsonLd';
import { LedupProductBrowser } from '../components/LedupProductBrowser';
import { LedupHeroCategoryBanner } from '../components/LedupHeroCategoryBanner';
import { LedupBox, LedupSkeleton, LedupError } from '../ui/ledupUi';
import { LedupNotFoundPage } from './LedupContentPages';

const flat = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap(n => [n, ...flat(n.children ?? [])]);

/** `/collections/:slugOrId`. */
export function LedupCollectionPage() {
  const { slugOrId = '' } = useParams();
  const { store } = useStorefront();
  const localize = useLocalize();
  const { data, loading, error, retry } = useLoad(
    () => apiGetPublicCollectionBySlug(store.storeId, slugOrId).then(r => r.data).catch((e: { status?: number }) => { if (e?.status === 404) return null; throw e; }),
    [store.storeId, slugOrId],
  );
  const collection = data ? localize.collection(data) : null;
  useStorefrontSeo({ title: collection?.seo?.metaTitle || collection?.name, description: collection?.seo?.metaDescription || collection?.description, image: collection?.image });
  const { origin, pathname } = window.location;
  const urlFor = pageUrlBuilder(origin, pathname);
  useJsonLd('collection', collection ? collectionJsonLd({ name: collection.name, description: collection.description, image: collection.image, url: `${origin}${pathname}`, origin, urlFor, products: [] }) : null);
  useJsonLd('breadcrumb', collection ? breadcrumbJsonLd([{ name: store.name, url: urlFor('/') }, { name: collection.name, url: `${origin}${pathname}` }]) : null);

  if (loading) return <LedupBox><LedupSkeleton h={320} /></LedupBox>;
  if (error) return <LedupBox><LedupError message={ts('pg.we_couldn_t_load_this_collection', "We couldn't load this collection.")} onRetry={retry} /></LedupBox>;
  if (!data || !collection) return <LedupNotFoundPage />;

  return (
    <div className="w-full pb-20">
      <LedupHeroCategoryBanner />
      <LedupBox padY={false} className="mt-8">
        <h1 className="sr-only">{collection.name}</h1>
        {collection.description && <div className="mx-auto mb-8 max-w-[720px] text-center text-sm leading-relaxed text-[#8c847e]">{renderRichText(collection.description)}</div>}
        <LedupProductBrowser collectionId={data._id} syncUrl />
      </LedupBox>
    </div>
  );
}

/** `/category/:slugOrId`. */
export function LedupCategoryPage() {
  const { slugOrId = '' } = useParams();
  const { store } = useStorefront();
  const { tree, loading, error, refetch } = useStoreCategoryTree(store.storeId);
  const category = flat(tree).find(c => c._id === slugOrId || c.slug === slugOrId) ?? null;
  useStorefrontSeo({ title: category?.name, description: category?.description });
  const { before, after, main } = splitAround(useTemplateSections(store.storeId, 'page', 'category'), 'category_product_grid');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seller-authored section settings
  const grid = (main?.settings ?? {}) as Record<string, any>;
  if (loading) return <LedupBox><LedupSkeleton h={320} /></LedupBox>;
  if (error) return <LedupBox><LedupError message={ts('pg.we_couldn_t_load_this_category', "We couldn't load this category.")} onRetry={refetch} /></LedupBox>;
  if (!category) return <LedupNotFoundPage />;
  return (
    <div className="w-full pb-20">
      <LedupHeroCategoryBanner activeCategory={category._id} />
      {before.length > 0 && <LedupSectionRenderer sections={before} />}
      <LedupBox padY={false} className="mt-8">
        <h1 className="sr-only">{category.name}</h1>
        {category.children?.length > 0 && (
          <ul className="m-0 mb-10 flex list-none flex-wrap justify-center gap-4 p-0">
            <li><span aria-current="page" className="inline-block rounded-full border border-[#8c7b70] bg-[#8c7b70] px-6 py-3 text-[16px] font-normal text-white">{category.name}</span></li>
            {category.children.map(c => (
              <li key={c._id}><a href={`/category/${c.slug || c._id}`} className="inline-block rounded-full border border-[#a69d98] bg-transparent px-6 py-3 text-[16px] font-normal text-[#a69d98] no-underline transition hover:border-[#4b423b] hover:text-[#4b423b] md:px-7 md:py-[18px] md:text-[18px]">{c.name}</a></li>
            ))}
          </ul>
        )}
        <LedupProductBrowser categoryId={category._id} syncUrl defaultSort={grid.defaultSort} columns={grid.columns} showFilters={grid.showFilters !== false} />
      </LedupBox>
      {after.length > 0 && <LedupSectionRenderer sections={after} />}
    </div>
  );
}

/** `/search?q=`. */
export function LedupSearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  useStorefrontSeo({ title: q ? ts('pg.search_q', 'Search: {{q}}', { q }) : ts('nav.allProducts', 'All products'), noindex: !!q });
  return (
    <div className="w-full pb-20">
      <LedupHeroCategoryBanner />
      <LedupBox padY={false} className="mt-10">
        <div className="mb-8">
          <h1 className={q ? 'mt-1 text-[28px] font-medium text-[#4b423b] md:text-[36px]' : 'sr-only'}>
            {q ? tsNodes('h.results_for', 'Results for {{query}}', { query: <span className="text-[var(--ld-accent)]">“{q}”</span> }) : ts('nav.allProducts', 'All products')}
          </h1>
        </div>
        <LedupProductBrowser search={q || undefined} syncUrl emptyText={q ? ts('pg.nothing_matched_q_try_a_different_word', 'Nothing matched “{{q}}”. Try a different word.', { q }) : undefined} />
      </LedupBox>
    </div>
  );
}
