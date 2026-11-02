import { useCallback, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Share2 } from 'lucide-react';
import { ShareDialog } from './ShareDialog';
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

/** Round heart in the corner of the main product photo, like the hearts on product cards. */
export function ProductWishlistHeart({ productId, variantId }: { productId: string; variantId?: string | null }) {
  const { t: tr } = useTranslation('storefront');
  const { isWishlisted, toggleWishlist, wishlisting } = useWishlistContext();
  if (!variantId) return null;
  const saved = isWishlisted(productId, variantId);
  const label = saved ? tr('product.savedToWishlist', 'Saved to wishlist') : tr('product.addToWishlist', 'Add to wishlist');
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId, variantId)}
      disabled={wishlisting === variantId}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className="absolute right-4 top-4 z-[2] grid size-11 place-items-center rounded-full border-0 p-0"
      style={{ background: t.colors.bg, color: t.colors.ink, cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,.12)', opacity: wishlisting === variantId ? 0.6 : 1 }}
    >
      <Heart size={19} fill={saved ? t.colors.danger : 'none'} color={saved ? t.colors.danger : t.colors.ink} aria-hidden />
    </button>
  );
}

/** This page's address without the hash, carrying the chosen variant so the receiver sees the same option. */
function shareUrl(variantId?: string) {
  const u = new URL(window.location.href);
  u.hash = '';
  if (variantId) u.searchParams.set('variant', variantId);
  return u.toString();
}

/** Opens the share popup: copy link + Facebook / X / Pinterest / WhatsApp / email. */
export function ProductShareButton({ title, image, variantId }: { title: string; image?: string; variantId?: string }) {
  const { t: tr } = useTranslation('storefront');
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={chip()} aria-haspopup="dialog">
        <Share2 size={15} aria-hidden />
        {tr('product.share', "Share")}
      </button>
      {open && <ShareDialog url={shareUrl(variantId)} title={title} image={image} onClose={close} />}
    </>
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
