import { Fragment } from 'react';
import { ImageOff, Search, ShoppingCart, Newspaper } from 'lucide-react';
import type { Section, Block, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';
import { resolveProductMainLayout, type ProductInfoBlock } from '../../productPageLayout';
import { PreviewBlock } from '../../previewInspector';

/**
 * Core/locked sections — Phase 4 of the Online Store theme-editor rebuild
 * (see `SECTION_TYPES`'s doc comment on the backend, and
 * `CORE_SECTION_TYPES` in `storefrontTypes.ts`, for the full architectural
 * note). These 6 types are ALWAYS pre-seeded into their owning template
 * (Product/Search/Cart/Blog Index/Blog Article) so the Customize editor's
 * section list — and its live preview, via this very registration — never
 * looks blank the way it used to.
 *
 * Rendered for REAL only here, in the abstract template-editing context
 * (the Customize editor's own live preview), as a representative
 * placeholder — there is no concrete product/cart/search-query to bind to
 * while editing a TEMPLATE rather than one specific page (the same reason
 * Shopify's own theme editor shows a dummy sample product when editing the
 * Product template in the abstract). `AtelierProductPage`/`AtelierSearchPage`/
 * `AtelierCartPage`/`AtelierBlogIndexPage`/`AtelierBlogPostPage` — the REAL
 * storefront pages — deliberately filter these types OUT of what they hand
 * to `AtelierSectionRenderer` for their own "surrounding sections" render
 * call, since each already has its own real, always-correct fixed markup
 * for this exact content; rendering both here would duplicate it for a
 * buyer. `product_main` is the one exception with real effect on the live
 * page too — see `AtelierProductPage.tsx`'s own comment: its 7 blocks'
 * `enabled` flags are read from the real published template to toggle the
 * matching real UI piece, so hiding one in the editor isn't a no-op.
 */

function PlaceholderShell({ label, colors, children, sample = true }: { label: string; colors: AtelierSectionColors; children: React.ReactNode; sample?: boolean }) {
  return (
    <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `32px ${t.layout.containerPadX}` }}>
      <p style={{ fontFamily: t.fonts.body, fontSize: '10.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.accent, marginBottom: '14px' }}>
        {sample ? `${label} — sample preview` : label}
      </p>
      {children}
    </div>
  );
}

registerAtelierSection('product_main', (_section: Section, blocks: Block[], colors: AtelierSectionColors, _dynamic?: Record<string, string>, previewContext?: CoreSectionPreviewContext) => {
  // The product picked in the editor's top bar (real name/price/image), or sample copy.
  const p = previewContext?.product;
  // Same order + visibility the real product page uses (see `productPageLayout`).
  const layout = resolveProductMainLayout({ blocks });
  const blockIdOf = (type: string) => { const b = blocks.find(x => x.type === type); return b?._id ? String(b._id) : null; };
  const target = (type: string, node: React.ReactNode) => {
    const id = blockIdOf(type);
    return id ? <PreviewBlock blockId={id}>{node}</PreviewBlock> : node;
  };
  const info: Record<ProductInfoBlock, React.ReactNode> = {
    product_title: <div style={{ fontFamily: t.fonts.display, fontSize: '26px', fontWeight: 600, color: colors.ink }}>{p?.name ?? 'Sample Product Name'}</div>,
    product_price: <div style={{ fontFamily: t.fonts.body, fontSize: '18px', color: colors.ink }}>{p?.price ?? '$49.99'}{p?.compareAtPrice && <s style={{ marginLeft: '10px', opacity: 0.55, fontSize: '0.8em' }}>{p.compareAtPrice}</s>}</div>,
    product_variant_picker: (
      <div className="flex gap-2 mt-2">
        {(p ? (p.optionValues?.length ? p.optionValues : []) : ['S', 'M', 'L']).map(s => <span key={s} style={{ fontFamily: t.fonts.body, fontSize: '12px', padding: '6px 12px', border: `1px solid ${colors.border}`, color: colors.ink }}>{s}</span>)}
      </div>
    ),
    product_quantity: <div style={{ fontFamily: t.fonts.body, fontSize: '12px', color: colors.inkMuted, marginTop: '8px' }}>Qty: 1</div>,
    product_buy_buttons: (
      <div style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600, color: '#fff', background: colors.ink, padding: '11px 0', textAlign: 'center', marginTop: '8px' }}>Add to Cart</div>
    ),
    product_rating: <div style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: colors.inkMuted }}>{p ? (p.reviewCount ? `★ ${(p.rating ?? 0).toFixed(1)} (${p.reviewCount} review${p.reviewCount === 1 ? '' : 's'})` : 'No reviews yet') : '★ 4.8 (24 reviews)'}</div>,
    product_sku: <div style={{ fontFamily: t.fonts.body, fontSize: '12px', color: colors.inkMuted }}>SKU: {p ? (p.sku || '—') : 'SAMPLE-001'}</div>,
    product_wishlist: <div style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 600, color: colors.ink, border: `1px solid ${colors.border}`, borderRadius: '0', padding: '9px 14px', alignSelf: 'flex-start' }}>♡ Add to wishlist</div>,
    product_share: <div style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 600, color: colors.ink, border: `1px solid ${colors.border}`, borderRadius: '0', padding: '9px 14px', alignSelf: 'flex-start' }}>Share</div>,
    product_specs: <div style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: colors.inkMuted, borderTop: `1px solid ${colors.border}`, paddingTop: '8px' }}>Specifications — your product's custom fields</div>,
    product_description: <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.inkMuted, marginTop: '10px' }}>{p ? (p.description || 'No description yet.') : 'A short sample description of this product would appear here.'}</p>,
  };
  return (
    <PlaceholderShell label="Main Product" sample={!p} colors={colors}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {layout.mediaOn && (
          target('product_media', p?.image
            ? <img src={p.image} alt={p.name} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', background: colors.bgAlt }} />
            : <div className="flex items-center justify-center" style={{ aspectRatio: '3/4', background: colors.bgAlt }}>
              <ImageOff size={32} style={{ color: colors.inkMuted }} />
            </div>)
        )}
        <div className="flex flex-col gap-3">
          {layout.infoOrder.map(type => <Fragment key={type}>{target(type, info[type])}</Fragment>)}
        </div>
      </div>
    </PlaceholderShell>
  );
});

registerAtelierSection('search_results', (_section: Section, _blocks: Block[], colors: AtelierSectionColors) => (
  <PlaceholderShell label="Search Results" colors={colors}>
    <div className="flex items-center gap-2 mb-4" style={{ color: colors.inkMuted }}>
      <Search size={14} /> <span style={{ fontFamily: t.fonts.body, fontSize: '13px' }}>Results for "sample query"</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ aspectRatio: '3/4', background: colors.bgAlt }} />
      ))}
    </div>
  </PlaceholderShell>
));

registerAtelierSection('cart_items', (_section: Section, _blocks: Block[], colors: AtelierSectionColors) => (
  <PlaceholderShell label="Cart Contents" colors={colors}>
    <div className="flex flex-col gap-3">
      {[1, 2].map(i => (
        <div key={i} className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <ShoppingCart size={16} style={{ color: colors.inkMuted }} />
          <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.ink, flex: 1 }}>Sample cart item {i}</span>
          <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.ink }}>$29.99</span>
        </div>
      ))}
    </div>
  </PlaceholderShell>
));

registerAtelierSection('cart_summary', (_section: Section, _blocks: Block[], colors: AtelierSectionColors) => (
  <PlaceholderShell label="Cart Summary" colors={colors}>
    <div className="flex flex-col gap-2 max-w-xs">
      <div className="flex justify-between" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.inkMuted }}><span>Subtotal</span><span>$59.98</span></div>
      <div className="flex justify-between" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.inkMuted }}><span>Shipping</span><span>Calculated at checkout</span></div>
      <div style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600, color: '#fff', background: colors.ink, padding: '11px 0', textAlign: 'center', marginTop: '10px' }}>Checkout</div>
    </div>
  </PlaceholderShell>
));

registerAtelierSection('blog_post_list', (_section: Section, _blocks: Block[], colors: AtelierSectionColors, _dynamicSourceValues, previewContext?: CoreSectionPreviewContext) => {
  // Phase 5 — a real selected Blog's own recent post titles when the
  // merchant picked one in Customize's resource picker; falls back to the
  // generic sample when none is selected yet (or on the real storefront,
  // which never renders this type at all — see the file's own doc comment).
  const titles = previewContext?.recentPostTitles?.length ? previewContext.recentPostTitles : ['Sample Post 1', 'Sample Post 2', 'Sample Post 3'];
  return (
    <PlaceholderShell label={previewContext?.blogName ? `Blog Posts — ${previewContext.blogName}` : 'Blog Posts'} colors={colors}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {titles.slice(0, 3).map((title, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div style={{ aspectRatio: '4/3', background: colors.bgAlt }} />
            <div className="flex items-center gap-1.5" style={{ color: colors.inkMuted }}>
              <Newspaper size={12} /> <span style={{ fontFamily: t.fonts.body, fontSize: '11px' }}>{title}</span>
            </div>
          </div>
        ))}
      </div>
    </PlaceholderShell>
  );
});

registerAtelierSection('article_content', (_section: Section, _blocks: Block[], colors: AtelierSectionColors, _dynamicSourceValues, previewContext?: CoreSectionPreviewContext) => (
  <PlaceholderShell label="Article Content" colors={colors}>
    <div style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 600, color: colors.ink, marginBottom: '10px' }}>
      {previewContext?.articleTitle || 'Sample Article Title'}
    </div>
    <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.inkMuted, lineHeight: 1.7 }}>
      {previewContext?.articleExcerpt || "A sample article body would appear here — this article's real title and content, rendered as-is."}
    </p>
  </PlaceholderShell>
));
