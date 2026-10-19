import { useSearchParams } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { FashionProductBrowser } from '../components/browse/FashionProductBrowser';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { FashionSectionRenderer } from '../sections';
import { FashionProductCard } from '../components/FashionProductCard';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { PageBox } from './pageParts';
import { splitAround, useTemplateSections } from '../../core/pageHooks';

/** `/search?q=` — the shared product browser (filters, sort, paging) with this theme's cards. */
export function FashionSearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const { store } = useStorefront();
  const { before, after } = splitAround(useTemplateSections(store.storeId, 'page', 'search'), 'search_results');
  useStorefrontSeo({ title: q ? `Search: ${q}` : 'All products', noindex: !!q });

  return (
    <>
      {before.length > 0 && <FashionSectionRenderer sections={before} />}
      <PageBox>
        <h1 className="m-0 mb-8 text-[clamp(28px,4vw,48px)] font-medium leading-[1.1] tracking-tight">
          {q ? <>{ts('pg.results_for', 'Results for')} <span className="fx-serif">“{q}”</span></> : 'All products'}
        </h1>
        <FashionProductBrowser renderCard={(p, c) => <FashionProductCard product={p} currency={c} />} search={q || undefined} syncUrl emptyText={q ? `Nothing matched “${q}”. Try a different word.` : undefined} />
      </PageBox>
      {after.length > 0 && <FashionSectionRenderer sections={after} />}
    </>
  );
}
