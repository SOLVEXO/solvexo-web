import { useParams } from 'react-router-dom';
import { FashionProductBrowser } from '../components/browse/FashionProductBrowser';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import type { CategoryNode } from '@/api/services/categories';
import { FashionProductCard } from '../components/FashionProductCard';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { FashionNotFoundPage } from './FashionNotFoundPage';
import { ErrorBlock, PageBox, PageSkeleton } from './pageParts';

const flat = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap(n => [n, ...flat(n.children ?? [])]);

/** `/category/:slugOrId` — a category's products with the shared filters. */
export function FashionCategoryPage() {
  const { slugOrId = '' } = useParams();
  const { store } = useStorefront();
  const { tree, loading, error, refetch } = useStoreCategoryTree(store.storeId);
  const category = flat(tree).find(c => c._id === slugOrId || c.slug === slugOrId) ?? null;
  useStorefrontSeo({ title: category?.name, description: category?.description });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorBlock message="We couldn't load this category." onRetry={refetch} />;
  if (!category) return <FashionNotFoundPage />;
  return (
    <PageBox>
      <header className="mb-8">
        <h1 className="m-0 text-[clamp(28px,4vw,48px)] font-medium leading-[1.1] tracking-tight">{category.name}</h1>
        {category.description && <p className="m-0 mt-3 max-w-[620px] text-base leading-relaxed" style={{ color: t.colors.inkMuted }}>{category.description}</p>}
        {category.children?.length > 0 && (
          <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
            {category.children.map(c => <li key={c._id}><a href={`/category/${c.slug || c._id}`} className="inline-block rounded-full px-4 py-2 text-sm no-underline" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.ink }}>{c.name}</a></li>)}
          </ul>
        )}
      </header>
      <FashionProductBrowser renderCard={(p, c) => <FashionProductCard product={p} currency={c} />} categoryId={category._id} syncUrl />
    </PageBox>
  );
}
