/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { FashionProductBrowser } from '../components/browse/FashionProductBrowser';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreProducts, type PublicStoreProductsParams } from '@/api/services/store';
import { useLoad } from '../../core/pageHooks';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import type { CategoryNode } from '@/api/services/categories';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLocalize } from '@/hooks/useLocalize';
import { copyText, showEyebrow } from '../../sectionCopy';
import { FashionProductCard } from '../components/FashionProductCard';
import { fashionTheme as t, type FashionColors } from '../theme.config';
import { registerFashionSection } from './sectionRegistry';
import { SectionShell, TextLink } from './SectionShell';

const GRID: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' };
const cols = (n: unknown) => GRID[Number(n)] ?? GRID[4];

function queryFor(s: Record<string, any>): PublicStoreProductsParams {
  const limit = Math.min(24, Math.max(1, Number(s.limit) || 8));
  switch (s.source) {
    case 'bestsellers': return { limit, sort: 'best_selling' };
    case 'trending': return { limit, sort: 'trending' };
    case 'onSale': return { limit, onSale: true, sort: 'newest' };
    case 'category': return { limit, categoryId: s.categoryId, sort: 'newest' };
    case 'collection': return { limit, collectionId: s.collectionId, sort: 'newest' };
    case 'manual': case 'pinned': return Array.isArray(s.productIds) && s.productIds.length ? { ids: s.productIds as string[], limit } : { limit, sort: 'newest' };
    default: return { limit, sort: 'newest' };
  }
}

function Skeleton({ n, columns }: { n: number; columns: unknown }) {
  return (
    <div className={`grid fx-grid-gap ${cols(columns)}`} aria-busy="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="animate-pulse" style={{ aspectRatio: '3 / 4', background: t.colors.bgAlt }} /><div className="mt-4 h-3 w-3/4 animate-pulse" style={{ background: t.colors.bgAlt }} /></div>
      ))}
    </div>
  );
}

function FeaturedProducts({ settings: s, colors }: { settings: Record<string, any>; colors: FashionColors }) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  const key = JSON.stringify(queryFor(s));
  const { data: items, error: failed, retry: load } = useLoad(
    () => apiGetPublicStoreProducts(store.storeId, JSON.parse(key) as PublicStoreProductsParams).then(r => r.data?.products ?? []),
    [store.storeId, key],
  );
  if (items && items.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={s.heading} eyebrow={showEyebrow(s) ? copyText(s, 'eyebrow', 'The edit') : undefined}
      action={<TextLink to={s.source === 'collection' && s.collectionId ? `/collections/${s.collectionId}` : '/search'} color={colors.ink}>View all</TextLink>}>
      {failed ? (
        <p className="m-0 text-sm" role="alert" style={{ color: colors.inkMuted }}>{ts('pg.we_couldn_t_load_these_products', 'We couldn\'t load these products.')} <button type="button" onClick={load} className="cursor-pointer border-0 bg-transparent p-0 underline" style={{ color: colors.ink }}>{ts('checkout.tryAgain', 'Try again')}</button></p>
      ) : items === null ? <Skeleton n={Number(s.columns) || 4} columns={s.columns} /> : (
        <div className={`grid fx-grid-gap ${cols(s.columns)}`}>
          {items.map(p => <FashionProductCard key={p._id} product={p} currency={currency} />)}
        </div>
      )}
    </SectionShell>
  );
}

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap(n => [n, ...flatten(n.children ?? [])]);
}

function CategoryGrid({ settings: s, colors }: { settings: Record<string, any>; colors: FashionColors }) {
  const { store } = useStorefront();
  const { tree, loading, error, refetch } = useStoreCategoryTree(store.storeId);
  const localize = useLocalize();
  const all = flatten(tree);
  const chosen: string[] = Array.isArray(s.categoryIds) ? (s.categoryIds as string[]) : [];
  const n = Number(s.columns) || 4;
  const shown = chosen.length
    ? chosen.map(id => all.find(c => c._id === id)).filter((c): c is CategoryNode => !!c)
    : tree.slice(0, n);

  if (!loading && !error && shown.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={s.heading} eyebrow={showEyebrow(s) ? copyText(s, 'eyebrow', 'Browse') : undefined}>
      {error ? (
        <p className="m-0 text-sm" role="alert" style={{ color: colors.inkMuted }}>{ts('pg.we_couldn_t_load_categories', 'We couldn\'t load categories.')} <button type="button" onClick={refetch} className="cursor-pointer border-0 bg-transparent p-0 underline" style={{ color: colors.ink }}>{ts('checkout.tryAgain', 'Try again')}</button></p>
      ) : loading ? <Skeleton n={n} columns={n} /> : (
        <ul className="fx-hide-scroll m-0 flex list-none gap-5 overflow-x-auto p-0 pb-1">
          {shown.map(c => {
            const name = localize.collection(c).name ?? c.name;
            return (
              <li key={c._id} className="w-[270px] max-w-[80vw] shrink-0">
                <Link to={`/category/${c.slug || c._id}`} className="group flex items-center overflow-hidden no-underline transition-colors hover:border-current" style={{ border: `1px solid ${colors.border}`, borderRadius: 16, background: colors.bg, color: colors.ink }}>
                  <div className="relative size-24 shrink-0 overflow-hidden" style={{ background: colors.bgAlt, borderRight: `1px solid ${colors.border}` }}>
                    {c.image && <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                  </div>
                  <div className="min-w-0 flex-1 p-5">
                    <p className="m-0 truncate text-base font-medium">{name}</p>
                    {c.productCount != null && <p className="m-0 mt-0.5 text-sm" style={{ color: colors.inkMuted }}>{c.productCount} items</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SectionShell>
  );
}

function ProductCatalog({ settings: s, colors, sort }: { settings: Record<string, any>; colors: FashionColors; sort?: string }) {
  return (
    <SectionShell colors={colors} padY={false}>
      <div style={{ padding: `${t.layout.sectionPadY} 0` }} id="shop">
        <FashionProductBrowser renderCard={(p, currency) => <FashionProductCard product={p} currency={currency} />}
          heading={s.heading} categoryId={s.categoryId || undefined} collectionId={s.collectionId || undefined}
          defaultSort={(sort ?? s.defaultSort) as never} columns={Number(s.columns) as 2 | 3 | 4 | undefined} showFilters={s.showFilters !== false} />
      </div>
    </SectionShell>
  );
}

registerFashionSection('featured_products', (section, _b, colors) => <FeaturedProducts settings={section.settings} colors={colors} />);
registerFashionSection('featured_category_grid', (section, _b, colors) => <CategoryGrid settings={section.settings} colors={colors} />);
registerFashionSection('product_catalog', (section, _b, colors) => <ProductCatalog settings={section.settings} colors={colors} />);
