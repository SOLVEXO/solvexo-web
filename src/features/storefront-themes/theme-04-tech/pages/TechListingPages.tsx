import { useMemo, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ts, tsNodes } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionBySlug } from '@/api/services/collections';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import type { CategoryNode } from '@/api/services/categories';
import { useLocalize } from '@/hooks/useLocalize';
import { renderRichText } from '@/utils/richText';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { breadcrumbJsonLd, collectionJsonLd, pageUrlBuilder, type ListProduct } from '../../core/seo/jsonLd';
import { splitAround, useLoad, useTemplateSections } from '../../core/pageHooks';
import { CollectionScopeContext } from '../../theme-03-fashion/sections/collectionScope';
import { FashionNotFoundPage } from '../../theme-03-fashion/pages/FashionNotFoundPage';
import { TechProductBrowser } from '../components/TechProductBrowser';
import { TechSectionRenderer } from '../sections';
import { TechBox, TechBreadcrumbs, TechError, TechSkeleton } from '../ui/techUi';
import { techTheme as t } from '../theme.config';

const flat = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap(n => [n, ...flat(n.children ?? [])]);

function Title({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <header className="mb-5">
      <h1 className="m-0 text-[clamp(24px,3.4vw,34px)] font-semibold leading-tight" style={{ fontFamily: t.fonts.display }}>{children}</h1>
      {note && <div className="mt-2 max-w-[720px] text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>{note}</div>}
    </header>
  );
}

/** `/collections/:slugOrId`: breadcrumb + title, then the seller's collection template (which holds the product list). */
export function TechCollectionPage() {
  const { slugOrId = '' } = useParams();
  const { store } = useStorefront();
  const localize = useLocalize();
  const { data, loading, error, retry } = useLoad(
    () => apiGetPublicCollectionBySlug(store.storeId, slugOrId).then(r => r.data).catch((e: { status?: number }) => { if (e?.status === 404) return null; throw e; }),
    [store.storeId, slugOrId],
  );
  const sections = useTemplateSections(store.storeId, 'collection', data?.templateKey || 'default');
  const collection = data ? localize.collection(data) : null;
  useStorefrontSeo({ title: collection?.seo?.metaTitle || collection?.name, description: collection?.seo?.metaDescription || collection?.description, image: collection?.image });
  const [listed, setListed] = useState<{ key: string; items: ListProduct[] }>({ key: '', items: [] });
  const scope = useMemo(() => ({ collectionId: data?._id, onProducts: (items: ListProduct[]) => setListed({ key: slugOrId, items }) }), [data?._id, slugOrId]);
  const { origin, pathname } = window.location;
  const urlFor = pageUrlBuilder(origin, pathname);
  useJsonLd('collection', collection ? collectionJsonLd({ name: collection.name, description: collection.description, image: collection.image, url: `${origin}${pathname}`, origin, urlFor, products: listed.key === slugOrId ? listed.items : [] }) : null);
  useJsonLd('breadcrumb', collection ? breadcrumbJsonLd([{ name: store.name, url: urlFor('/') }, { name: collection.name, url: `${origin}${pathname}` }]) : null);

  if (loading) return <TechBox><TechSkeleton h={320} /></TechBox>;
  if (error) return <TechError message={ts('pg.we_couldn_t_load_this_collection', "We couldn't load this collection.")} onRetry={retry} />;
  if (!data || !collection) return <FashionNotFoundPage />;
  const hasGrid = sections.some(s => s.type === 'collection_product_grid');
  return (
    <CollectionScopeContext.Provider value={scope}>
      <TechBox padY={false}>
        <div className="pt-5">
          <TechBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: collection.name }]} />
          <Title note={collection.description ? renderRichText(collection.description) : undefined}>{collection.name}</Title>
        </div>
      </TechBox>
      {sections.length > 0 && hasGrid ? <TechSectionRenderer sections={sections} /> : (
        <>
          <TechBox padY={false}><div className="pb-10"><TechProductBrowser collectionId={data._id} onProducts={scope.onProducts} syncUrl defaultSort={data.defaultSort as never} /></div></TechBox>
          {sections.length > 0 && <TechSectionRenderer sections={sections} />}
        </>
      )}
    </CollectionScopeContext.Provider>
  );
}

/** `/category/:slugOrId`. */
export function TechCategoryPage() {
  const { slugOrId = '' } = useParams();
  const { store } = useStorefront();
  const { tree, loading, error, refetch } = useStoreCategoryTree(store.storeId);
  const category = flat(tree).find(c => c._id === slugOrId || c.slug === slugOrId) ?? null;
  useStorefrontSeo({ title: category?.name, description: category?.description });
  if (loading) return <TechBox><TechSkeleton h={320} /></TechBox>;
  if (error) return <TechError message={ts('pg.we_couldn_t_load_this_category', "We couldn't load this category.")} onRetry={refetch} />;
  if (!category) return <FashionNotFoundPage />;
  return (
    <TechBox>
      <TechBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: category.name }]} />
      <Title note={category.description}>{category.name}</Title>
      {category.children?.length > 0 && (
        <ul className="m-0 mb-5 flex list-none flex-wrap gap-2 p-0">
          {category.children.map(c => <li key={c._id}><a href={`/category/${c.slug || c._id}`} className="inline-block border px-3 py-1.5 text-xs font-medium no-underline" style={{ borderColor: t.colors.border, color: t.colors.ink, borderRadius: t.fieldRadiusPx }}>{c.name}</a></li>)}
        </ul>
      )}
      <TechProductBrowser categoryId={category._id} syncUrl />
    </TechBox>
  );
}

/** `/search?q=`. */
export function TechSearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const { store } = useStorefront();
  const { before, after } = splitAround(useTemplateSections(store.storeId, 'page', 'search'), 'search_results');
  useStorefrontSeo({ title: q ? ts('pg.search_q', 'Search: {{q}}', { q }) : ts('nav.allProducts', 'All products'), noindex: !!q });
  return (
    <>
      {before.length > 0 && <TechSectionRenderer sections={before} />}
      <TechBox>
        <TechBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: ts('nav.search', 'Search') }]} />
        <Title>{q ? tsNodes('h.results_for', 'Results for {{query}}', { query: <span style={{ color: t.colors.accent }}>“{q}”</span> }) : ts('nav.allProducts', 'All products')}</Title>
        <TechProductBrowser search={q || undefined} syncUrl emptyText={q ? ts('pg.nothing_matched_q_try_a_different_word', 'Nothing matched “{{q}}”. Try a different word.', { q }) : undefined} />
      </TechBox>
      {after.length > 0 && <TechSectionRenderer sections={after} />}
    </>
  );
}
