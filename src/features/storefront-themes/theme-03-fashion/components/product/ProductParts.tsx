import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Heart, Share2 } from 'lucide-react';
import { tt } from '@/utils/tStatic';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { apiGetPublicMetafieldValues, type MetafieldValueEntry } from '@/api/services/metafields';
import { useLoad } from '../../../core/pageHooks';
import { fashionTheme as t } from '../../theme.config';

const chip = (): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
  fontFamily: t.fonts.body, fontSize: 13, fontWeight: 500, color: t.colors.ink, background: t.colors.bgAlt,
  border: '1px solid transparent', borderRadius: t.buttonRadiusPx, padding: '10px 18px', transition: 'background-color .2s',
});

export function ProductWishlistButton({ productId, variantId }: { productId: string; variantId?: string | null }) {
  const { t: tr } = useTranslation('storefront');
  const { isWishlisted, toggleWishlist, wishlisting } = useWishlistContext();
  if (!variantId) return null;
  const saved = isWishlisted(productId, variantId);
  const busy = wishlisting === variantId;
  return (
    <button type="button" onClick={() => toggleWishlist(productId, variantId)} disabled={busy} aria-pressed={saved} style={{ ...chip(), opacity: busy ? 0.6 : 1 }}>
      <Heart size={15} fill={saved ? t.colors.danger : 'none'} color={saved ? t.colors.danger : t.colors.ink} aria-hidden />
      {saved ? tr('product.savedToWishlist', "Saved to wishlist") : tr('product.addToWishlist', "Add to wishlist")}
    </button>
  );
}

/** Phone share sheet when available, otherwise copies the link. */
export function ProductShareButton({ title }: { title: string }) {
  const { t: tr } = useTranslation('storefront');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const share = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function') { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch { /* the shopper closed the share sheet */ }
  };
  return (
    <button type="button" onClick={share} style={chip()} aria-live="polite">
      {copied ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
      {copied ? tr('product.linkCopied', "Link copied") : tr('product.share', "Share")}
    </button>
  );
}

export function ProductSku({ sku }: { sku?: string | null }) {
  const { t: tr } = useTranslation('storefront');
  if (!sku) return null;
  return <p className="m-0 text-xs" style={{ fontFamily: t.fonts.body, color: t.colors.inkMuted }}>{tr('product.sku', "SKU")}: <span style={{ color: t.colors.ink }}>{sku}</span></p>;
}

function displayValue(entry: MetafieldValueEntry): string {
  if (entry.type === 'boolean') return entry.value === 'true' ? tt('product.yes', "Yes") : tt('product.no', "No");
  return entry.value;
}

/** The product's storefront-visible custom fields as a name / value list. Empty fields and raw JSON are skipped. */
export function ProductSpecs({ entries }: { entries: MetafieldValueEntry[] }) {
  const { t: tr } = useTranslation('storefront');
  const rows = entries.filter(e => e.value?.trim() && e.type !== 'json');
  if (rows.length === 0) return null;
  return (
    <div className="p-5" style={{ background: t.colors.bgAlt, borderRadius: 20, fontFamily: t.fonts.body }}>
      <p className="m-0 mb-3 text-sm font-semibold">{tr('product.specifications', "Specifications")}</p>
      <dl className="m-0">
        {rows.map((r, i) => (
          <div key={r.definitionId} className="grid gap-3 py-2.5" style={{ gridTemplateColumns: 'minmax(110px, 38%) 1fr', borderTop: i ? `1px solid ${t.colors.border}` : undefined }}>
            <dt className="text-[13px]" style={{ color: t.colors.inkMuted }}>{r.name}</dt>
            <dd className="m-0 whitespace-pre-line text-[13.5px]" style={{ color: t.colors.ink }}>{displayValue(r)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** `product_specs` block: loads the product's public custom fields and shows them as a specifications table (nothing while empty/failed). */
export function ProductSpecsBlock({ storeId, productId }: { storeId: string; productId: string }) {
  const { data } = useLoad(() => apiGetPublicMetafieldValues(storeId, 'product', productId).then(r => r.data ?? []), [storeId, productId]);
  return data ? <ProductSpecs entries={data} /> : null;
}
