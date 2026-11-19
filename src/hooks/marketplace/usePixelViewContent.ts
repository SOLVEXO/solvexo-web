import { useEffect } from 'react';
import { trackPixelEvent } from '@/utils/trackingPixels';

/** Tells the seller's connected ad pixels (Meta / Google / TikTok) that a product page was viewed — once per product. */
export function usePixelViewContent(
  product: { _id: string; name?: string } | undefined | null,
  variant?: { price?: number | null; currency?: string | null } | null,
) {
  const id = product?._id;
  const name = product?.name;
  const price = typeof variant?.price === 'number' ? variant.price : undefined;
  const currency = variant?.currency ?? undefined;
  useEffect(() => {
    if (!id) return;
    trackPixelEvent('ViewContent', {
      value: price,
      currency,
      contentIds: [id],
      contentName: name,
      items: [{ id, name, price }],
    });
    // Once per product: a variant switch or price refresh on the same page is not a new view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
