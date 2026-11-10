import type { ReactNode } from 'react';
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
import { LedupBox, LedupBreadcrumbs, LedupSkeleton, LedupError } from '../ui/ledupUi';
import { LedupNotFoundPage } from './LedupContentPages';

const flat = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap(n => [n, ...flat(n.children ?? [])]);

function Title({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="m-0 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">{children}</h1>
      {note && <div className="mt-2 max-w-[720px] text-sm leading-relaxed text-stone-500">{note}</div>}
    </header>
  );
}

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
        <LedupBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: collection.name }]} />
        <Title note={collection.description ? renderRichText(collection.description) : undefined}>{collection.name}</Title>
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
  const grid = (main?.settings ?? {}) as Record<string, any>;
  if (loading) return <LedupBox><LedupSkeleton h={320} /></LedupBox>;
  if (error) return <LedupBox><LedupError message={ts('pg.we_couldn_t_load_this_category', "We couldn't load this category.")} onRetry={refetch} /></LedupBox>;
  if (!category) return <LedupNotFoundPage />;
  return (
    <div className="w-full pb-20">
      <LedupHeroCategoryBanner activeCategory={category._id} />
      {before.length > 0 && <LedupSectionRenderer sections={before} />}
      <LedupBox padY={false} className="mt-8">
        <LedupBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: category.name }]} />
        <Title note={category.description}>{category.name}</Title>
        {category.children?.length > 0 && (
          <ul className="m-0 mb-8 flex list-none flex-wrap gap-3 p-0">
            {category.children.map(c => (
              <li key={c._id}><a href={`/category/${c.slug || c._id}`} className="inline-block rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold tracking-wide text-stone-700 no-underline transition hover:border-stone-500">{c.name}</a></li>
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
    <div className="py-10">
      <LedupBox>
        <div className="mb-8 border-b border-stone-200 pb-6">
          <p className="m-0 text-xs uppercase tracking-wider text-stone-400">{ts('nav.search', 'Search')}</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900 md:text-3xl">
            {q ? tsNodes('h.results_for', 'Results for {{query}}', { query: <span className="text-[var(--ld-accent)]">“{q}”</span> }) : ts('nav.allProducts', 'All products')}
          </h1>
        </div>
        <LedupProductBrowser search={q || undefined} syncUrl emptyText={q ? ts('pg.nothing_matched_q_try_a_different_word', 'Nothing matched “{{q}}”. Try a different word.', { q }) : undefined} />
      </LedupBox>
    </div>
  );
}
