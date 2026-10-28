import { useMemo, useState, type MouseEvent } from 'react';
import { handleOf } from '@/utils/activeStoreText';
import type { PublicStoreProduct } from '@/api/services/store';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLocalize } from '@/hooks/useLocalize';
import { displayMoney, saleInfo } from '../../core/money';
import { useCartDrawer } from '../../cartDrawerContext';
import { fashionTheme as t } from '../theme.config';
import { FashionProductCardView } from './FashionProductCardView';
import { FashionQuickView } from './product/FashionQuickView';

/** Card for every real product grid (collection, search, featured): wires cart, wishlist and currency into the view. */
export function FashionProductCard({ product, currency }: { product: PublicStoreProduct; currency: string }) {
  const { store } = useStorefront();
  const { convert, canConvert, fixedPriceFor } = useCurrencyPreference();
  const { addToCart, adding } = useCartContext();
  const { isWishlisted, toggleWishlist } = useWishlistContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const localize = useLocalize();
  const [quick, setQuick] = useState(false);
  const [hoverImage, setHoverImage] = useState<string | undefined>();
  const showSwatches = t.colorSwatches; // module singleton: read per render so the editor preview reacts to the setting
  const swatches = useMemo(() => {
    if (!showSwatches) return [];
    const seen = new Map<string, { value: string; image?: string }>();
    for (const v of product.variants ?? []) {
      const color = v.options?.find(o => /^colou?r$/i.test(o.name))?.value;
      if (color && !seen.has(color.toLowerCase())) seen.set(color.toLowerCase(), { value: color, image: v.images?.find(Boolean) });
    }
    return Array.from(seen.values());
  }, [product.variants, showSwatches]);

  const p = localize.product(product);
  const base = String(store.baseCurrency ?? currency);
  const price = product.defaultVariantPrice;
  const compare = product.compareAtPrice;
  const soldOut = product.inStock === false;
  const priceRef = { productId: product._id, variantId: product.variantId };
  const show = (n: number, compare = false) => displayMoney({ currency, convert, canConvert }, n, base, { ...priceRef, compare });
  const sale = saleInfo({ currency, convert, canConvert, fixedPriceFor }, price, compare, base, priceRef);
  const percentOff = sale.percentOff;
  const hasVariant = !!product.variantId;

  const add = async (e: MouseEvent) => {
    e.preventDefault();
    if (!product.variantId) return;
    const ok = await addToCart(product._id, product.variantId, product.type === 'digital' ? 'digital' : 'physical', 1);
    if (ok && drawerMounted) openDrawer();
  };
  const heart = async (e: MouseEvent) => {
    e.preventDefault();
    if (product.variantId) await toggleWishlist(product._id, product.variantId);
  };

  const slug = product.slug || product._id;
  return (
    <>
    <FashionProductCardView
      to={`/product/${handleOf(product)}`}
      name={p.name}
      image={hoverImage ?? product.images?.[0]}
      swatches={swatches}
      onSwatch={setHoverImage}
      secondImage={t.productImageHover === 'second-image' ? product.images?.[1] : undefined}
      tag={product.tags?.[0]}
      rating={product.averageRating ?? 0}
      price={price != null ? show(price) : undefined}
      comparePrice={sale.onSale ? show(sale.compareAmount, true) : undefined}
      percentOff={percentOff}
      soldOut={soldOut}
      wished={hasVariant ? isWishlisted(product._id, product.variantId as string) : null}
      onWish={heart}
      onAdd={hasVariant && !soldOut ? add : undefined}
      adding={adding === product.variantId}
      onQuickView={t.quickView && product.type !== 'digital' ? e => { e.preventDefault(); setQuick(true); } : undefined}
    />
    {quick && <FashionQuickView slug={slug} onClose={() => setQuick(false)} />}
    </>
  );
}
