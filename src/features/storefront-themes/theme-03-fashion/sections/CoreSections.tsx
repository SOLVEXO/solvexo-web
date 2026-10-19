/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { ts } from '@/utils/tStatic';
import { useContext } from 'react';
import { FashionProductBrowser } from '../components/browse/FashionProductBrowser';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { fashionTheme as t } from '../theme.config';
import { FashionProductCard } from '../components/FashionProductCard';
import { registerFashionSection } from './sectionRegistry';
import { SectionShell } from './SectionShell';
import { CollectionScopeContext } from './collectionScope';

registerFashionSection('collection_product_grid', (section, _b, colors) => <CollectionGrid settings={section.settings} colors={colors} />);

function CollectionGrid({ settings: s, colors }: { settings: Record<string, any>; colors: typeof t.colors }) {
  const { previewCollectionId } = useStorefront();
  const scope = useContext(CollectionScopeContext);
  const collectionId = scope?.collectionId ?? previewCollectionId ?? undefined;
  return (
    <SectionShell colors={colors}>
      <FashionProductBrowser renderCard={(p, currency) => <FashionProductCard product={p} currency={currency} />}
        collectionId={collectionId} syncUrl={!!scope} defaultSort={s.defaultSort} columns={Number(s.columns) as 2 | 3 | 4 | undefined} showFilters={s.showFilters !== false} />
    </SectionShell>
  );
}

/* ── Editor-preview stand-ins ─────────────────────────────────────────────────────────────────────────────────────────────
   The real product / search / cart / blog markup lives in each page. These locked sections only ever render inside the
   Customize preview, as a representative block, so the seller sees where the real content sits. */
function Placeholder({ title, note, colors }: { title: string; note: string; colors: typeof t.colors }) {
  return (
    <SectionShell colors={colors}>
      <div className="grid place-items-center gap-1 px-6 py-14 text-center" style={{ background: colors.bgAlt, borderRadius: 24 }}>
        <p className="m-0 text-lg font-semibold">{title}</p>
        <p className="m-0 text-sm" style={{ color: colors.inkMuted }}>{note}</p>
      </div>
    </SectionShell>
  );
}

registerFashionSection('product_main', (_s, _b, colors, _d, ctx) => {
  const p = ctx?.product;
  return (
    <SectionShell colors={colors}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="overflow-hidden lg:col-span-7" style={{ aspectRatio: '4 / 5', background: colors.bgAlt, borderRadius: 24 }}>
          {p?.image && <img src={p.image} alt={p.name} className="size-full object-cover" />}
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <h1 className="m-0 text-3xl font-semibold tracking-tight">{p?.name ?? 'Product name'}</h1>
          <p className="m-0 text-2xl font-semibold">{p?.price ?? '$0.00'} {p?.compareAtPrice && <span className="text-lg font-normal line-through" style={{ color: colors.inkMuted }}>{p.compareAtPrice}</span>}</p>
          {p?.description && <p className="m-0 text-base leading-relaxed" style={{ color: colors.inkMuted }}>{p.description}</p>}
        </div>
      </div>
    </SectionShell>
  );
});
registerFashionSection('search_results', (_s, _b, colors) => <Placeholder title={ts('pg.search_results', 'Search results')} note="Matching products appear here." colors={colors} />);
registerFashionSection('cart_items', (_s, _b, colors) => <Placeholder title={ts('pg.cart_items', 'Cart items')} note="The shopper's cart lines appear here." colors={colors} />);
registerFashionSection('cart_summary', (_s, _b, colors) => <Placeholder title={ts('cart.summaryTitle', 'Order summary')} note="Subtotal and the checkout button appear here." colors={colors} />);
registerFashionSection('blog_post_list', (_s, _b, colors, _d, ctx) => <Placeholder title={ctx?.blogName ?? 'Blog'} note={ctx?.recentPostTitles?.join(' · ') || 'Your latest posts appear here.'} colors={colors} />);
registerFashionSection('article_content', (_s, _b, colors, _d, ctx) => <Placeholder title={ctx?.articleTitle ?? 'Article'} note={ctx?.articleExcerpt ?? 'The article body appears here.'} colors={colors} />);
