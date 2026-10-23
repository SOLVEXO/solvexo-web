import { useSearchParams } from 'react-router-dom';
import { ts, tsNodes } from '@/utils/tStatic';
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
  useStorefrontSeo({ title: q ? ts('pg.search_q', 'Search: {{q}}', { q }) : ts('nav.allProducts', 'All products'), noindex: !!q });

  return (
    <>
      {before.length > 0 && <FashionSectionRenderer sections={before} />}
      <PageBox>
        <h1 className="m-0 mb-8 text-[clamp(28px,4vw,48px)] font-medium leading-[1.1] tracking-tight">
          {q ? tsNodes('h.results_for', 'Results for {{query}}', { query: <span className="fx-serif">“{q}”</span> }) : ts('nav.allProducts', 'All products')}
        </h1>
        <FashionProductBrowser renderCard={(p, c) => <FashionProductCard product={p} currency={c} />} search={q || undefined} syncUrl emptyText={q ? ts('pg.nothing_matched_q_try_a_different_word', 'Nothing matched “{{q}}”. Try a different word.', { q }) : undefined} />
      </PageBox>
      {after.length > 0 && <FashionSectionRenderer sections={after} />}
    </>
  );
}
