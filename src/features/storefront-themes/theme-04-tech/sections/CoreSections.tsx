/* eslint-disable react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { ts } from '@/utils/tStatic';
import { baseTheme as t } from '../theme.base';
import { registerTechSection } from './techSectionRegistry';
import { SectionShell } from './SectionShell';

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

registerTechSection('product_main', (_s, _b, colors, _d, ctx) => {
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
registerTechSection('search_results', (_s, _b, colors) => <Placeholder title={ts('pg.search_results', 'Search results')} note="Matching products appear here." colors={colors} />);
registerTechSection('cart_items', (_s, _b, colors) => <Placeholder title={ts('pg.cart_items', 'Cart items')} note="The shopper's cart lines appear here." colors={colors} />);
registerTechSection('cart_summary', (_s, _b, colors) => <Placeholder title={ts('cart.summaryTitle', 'Order summary')} note="Subtotal and the checkout button appear here." colors={colors} />);
registerTechSection('blog_post_list', (_s, _b, colors, _d, ctx) => <Placeholder title={ctx?.blogName ?? 'Blog'} note={ctx?.recentPostTitles?.join(' · ') || 'Your latest posts appear here.'} colors={colors} />);
registerTechSection('page_content', (_s, _b, colors) => <Placeholder title="Main content" note="This page's form or list appears here. Add sections above or below it." colors={colors} />);
registerTechSection('article_content', (_s, _b, colors, _d, ctx) => <Placeholder title={ctx?.articleTitle ?? 'Article'} note={ctx?.articleExcerpt ?? 'The article body appears here.'} colors={colors} />);
