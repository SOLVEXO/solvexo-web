import { ImageOff, Search, ShoppingCart, Newspaper } from 'lucide-react';
import type { Section, Block, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

/**
 * Core/locked sections — Nova's own registration, mirroring
 * `theme-01-atelier/sections/CoreSections.tsx` byte-for-byte in structure
 * (see that file's doc comment for the full architectural rationale).
 * Rendered for REAL only here, in the Customize editor's own live preview,
 * as a representative placeholder — `NovaProductPage`/`NovaSearchPage`/
 * `NovaCartPage`/`NovaBlogIndexPage`/`NovaBlogPostPage` filter these types
 * OUT of what they hand to `NovaSectionRenderer` for their own real content,
 * since each already has its own real, always-correct fixed markup for
 * this exact content. `product_main` is the one exception with real effect
 * on the live page too — see `NovaProductPage.tsx`'s own comment.
 */

function PlaceholderShell({ label, colors, children }: { label: string; colors: NovaSectionColors; children: React.ReactNode }) {
  return (
    <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `32px ${t.layout.containerPadX}` }}>
      <p style={{ fontFamily: t.fonts.body, fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: colors.accent, marginBottom: '14px' }}>
        {label} — sample preview
      </p>
      {children}
    </div>
  );
}

registerNovaSection('product_main', (_section: Section, blocks: Block[], colors: NovaSectionColors) => {
  const isOn = (type: string) => blocks.find(b => b.type === type)?.enabled !== false;
  return (
    <PlaceholderShell label="Main Product" colors={colors}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {isOn('product_media') && (
          <div className="flex items-center justify-center" style={{ aspectRatio: '1/1', background: colors.bgAlt, borderRadius: t.radius.md }}>
            <ImageOff size={32} style={{ color: colors.inkMuted }} />
          </div>
        )}
        <div className="flex flex-col gap-3">
          {isOn('product_title') && <div style={{ fontFamily: t.fonts.display, fontSize: '26px', fontWeight: 700, color: colors.ink }}>Sample Product Name</div>}
          {isOn('product_price') && <div style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 700, color: colors.ink }}>$49.99</div>}
          {isOn('product_variant_picker') && (
            <div className="flex gap-2 mt-2">
              {['S', 'M', 'L'].map(s => <span key={s} style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '9999px', border: `1.5px solid ${colors.border}`, color: colors.ink }}>{s}</span>)}
            </div>
          )}
          {isOn('product_quantity') && <div style={{ fontFamily: t.fonts.body, fontSize: '12px', color: colors.inkMuted, marginTop: '8px' }}>Qty: 1</div>}
          {isOn('product_buy_buttons') && (
            <div style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 700, color: colors.accentInk, background: colors.accent, borderRadius: '9999px', padding: '11px 0', textAlign: 'center', marginTop: '8px' }}>Add to Cart</div>
          )}
          {isOn('product_description') && <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: colors.inkMuted, marginTop: '10px' }}>A short sample description of this product would appear here.</p>}
        </div>
      </div>
    </PlaceholderShell>
  );
});

registerNovaSection('search_results', (_section: Section, _blocks: Block[], colors: NovaSectionColors) => (
  <PlaceholderShell label="Search Results" colors={colors}>
    <div className="flex items-center gap-2 mb-4" style={{ color: colors.inkMuted }}>
      <Search size={14} /> <span style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600 }}>Results for "sample query"</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ aspectRatio: '1/1', background: colors.bgAlt, borderRadius: t.radius.md }} />
      ))}
    </div>
  </PlaceholderShell>
));

registerNovaSection('cart_items', (_section: Section, _blocks: Block[], colors: NovaSectionColors) => (
  <PlaceholderShell label="Cart Contents" colors={colors}>
    <div className="flex flex-col gap-3">
      {[1, 2].map(i => (
        <div key={i} className="flex items-center gap-3 pb-3" style={{ borderBottom: `1.5px solid ${colors.border}` }}>
          <ShoppingCart size={16} style={{ color: colors.inkMuted }} />
          <span style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600, color: colors.ink, flex: 1 }}>Sample cart item {i}</span>
          <span style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 700, color: colors.ink }}>$29.99</span>
        </div>
      ))}
    </div>
  </PlaceholderShell>
));

registerNovaSection('cart_summary', (_section: Section, _blocks: Block[], colors: NovaSectionColors) => (
  <PlaceholderShell label="Cart Summary" colors={colors}>
    <div className="flex flex-col gap-2 max-w-xs">
      <div className="flex justify-between" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.inkMuted }}><span>Subtotal</span><span>$59.98</span></div>
      <div className="flex justify-between" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.inkMuted }}><span>Shipping</span><span>Calculated at checkout</span></div>
      <div style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 700, color: colors.accentInk, background: colors.accent, borderRadius: '9999px', padding: '11px 0', textAlign: 'center', marginTop: '10px' }}>Checkout</div>
    </div>
  </PlaceholderShell>
));

registerNovaSection('blog_post_list', (_section: Section, _blocks: Block[], colors: NovaSectionColors, _dynamicSourceValues, previewContext?: CoreSectionPreviewContext) => {
  // Phase 5 — see the identical comment on Atelier's own registration.
  const titles = previewContext?.recentPostTitles?.length ? previewContext.recentPostTitles : ['Sample Post 1', 'Sample Post 2', 'Sample Post 3'];
  return (
    <PlaceholderShell label={previewContext?.blogName ? `Blog Posts — ${previewContext.blogName}` : 'Blog Posts'} colors={colors}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {titles.slice(0, 3).map((title, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div style={{ aspectRatio: '4/3', background: colors.bgAlt, borderRadius: t.radius.md }} />
            <div className="flex items-center gap-1.5" style={{ color: colors.inkMuted }}>
              <Newspaper size={12} /> <span style={{ fontFamily: t.fonts.body, fontSize: '11px', fontWeight: 600 }}>{title}</span>
            </div>
          </div>
        ))}
      </div>
    </PlaceholderShell>
  );
});

registerNovaSection('article_content', (_section: Section, _blocks: Block[], colors: NovaSectionColors, _dynamicSourceValues, previewContext?: CoreSectionPreviewContext) => (
  <PlaceholderShell label="Article Content" colors={colors}>
    <div style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: colors.ink, marginBottom: '10px' }}>
      {previewContext?.articleTitle || 'Sample Article Title'}
    </div>
    <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: colors.inkMuted, lineHeight: 1.7 }}>
      {previewContext?.articleExcerpt || "A sample article body would appear here — this article's real title and content, rendered as-is."}
    </p>
  </PlaceholderShell>
));
