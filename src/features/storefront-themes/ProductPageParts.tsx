import { tt } from '@/utils/tStatic';
import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Heart, Share2 } from 'lucide-react';
import { useWishlistContext } from '@/contexts/WishlistContext';
import type { MetafieldValueEntry } from '@/api/services/metafields';

export interface PartTokens {
  fonts: { body: string; display: string };
  colors: { ink: string; inkMuted: string; border: string; accent: string; bgAlt: string };
  /** Corner radius for the small outline buttons (`9999px` for pills). */
  buttonRadius: string;
}

const outlineButton = (t: PartTokens): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
  fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 600, color: t.colors.ink, background: 'transparent',
  border: `1px solid ${t.colors.border}`, borderRadius: t.buttonRadius, padding: '10px 16px',
});

/** tr('product.addToWishlist', "Add to wishlist") for the variant being viewed. */
export function ProductWishlistButton({ productId, variantId, tokens }: { productId: string; variantId?: string | null; tokens: PartTokens }) {
  const { t: tr } = useTranslation('storefront');
  const { isWishlisted, toggleWishlist, wishlisting } = useWishlistContext();
  if (!variantId) return null;
  const saved = isWishlisted(productId, variantId);
  return (
    <button type="button" onClick={() => toggleWishlist(productId, variantId)} disabled={wishlisting === variantId} aria-pressed={saved}
      style={{ ...outlineButton(tokens), opacity: wishlisting === variantId ? 0.6 : 1 }}>
      <Heart size={15} fill={saved ? tokens.colors.accent : 'none'} color={saved ? tokens.colors.accent : tokens.colors.ink} aria-hidden />
      {saved ? tr('product.savedToWishlist', "Saved to wishlist") : tr('product.addToWishlist', "Add to wishlist")}
    </button>
  );
}

/** Share this product: the phone's share sheet when there is one, otherwise copy the link. */
export function ProductShareButton({ title, tokens }: { title: string; tokens: PartTokens }) {
  const { t: tr } = useTranslation('storefront');
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function') { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* the shopper closed the share sheet */ }
  };
  return (
    <button type="button" onClick={share} style={outlineButton(tokens)} aria-live="polite">
      {copied ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
      {copied ? tr('product.linkCopied', "Link copied") : tr('product.share', "Share")}
    </button>
  );
}

export function ProductSku({ sku, tokens }: { sku?: string | null; tokens: PartTokens }) {
  const { t: tr } = useTranslation('storefront');
  if (!sku) return null;
  return <p style={{ fontFamily: tokens.fonts.body, fontSize: '12px', color: tokens.colors.inkMuted, margin: 0 }}>{tr('product.sku', "SKU")}: {sku}</p>;
}

function displayValue(entry: MetafieldValueEntry): string {
  if (entry.type === 'boolean') return entry.value === 'true' ? tt('product.yes', "Yes") : tt('product.no', "No");
  return entry.value;
}

/** The product's own details (its storefront-visible custom fields) as a name / value table. Empty fields and raw JSON are skipped. */
export function ProductSpecs({ entries, tokens }: { entries: MetafieldValueEntry[]; tokens: PartTokens }) {
  const { t: tr } = useTranslation('storefront');
  const rows = entries.filter(e => e.value?.trim() && e.type !== 'json');
  if (rows.length === 0) return null;
  return (
    <div>
      <p style={{ fontFamily: tokens.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.colors.inkMuted, margin: '0 0 10px' }}>{tr('product.specifications', "Specifications")}</p>
      <dl style={{ margin: 0, borderTop: `1px solid ${tokens.colors.border}` }}>
        {rows.map(r => (
          <div key={r.definitionId} className="grid" style={{ gridTemplateColumns: 'minmax(110px, 38%) 1fr', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${tokens.colors.border}` }}>
            <dt style={{ fontFamily: tokens.fonts.body, fontSize: '13px', color: tokens.colors.inkMuted }}>{r.name}</dt>
            <dd style={{ fontFamily: tokens.fonts.body, fontSize: '13.5px', color: tokens.colors.ink, margin: 0, whiteSpace: 'pre-line' }}>{displayValue(r)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
