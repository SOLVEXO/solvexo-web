import { useState } from 'react';
import { handleOf } from '@/utils/activeStoreText';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { Bell, ImageOff, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import type { WishlistListItem } from '@/api/services/wishlist';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { variantCanBuy } from '../../../variantAvailability';
import { useBackInStock } from '../../../useBackInStock';
import { useMoney } from '../../../core/hooks/useMoney';
import { fashionTheme as t } from '../../theme.config';
import { PillButton, StatusPill, TextInput } from '../../ui/primitives';
import { useCartDrawer } from '../../../cartDrawerContext';

/** One saved product: image, price, chosen options, add to bag, remove and a back-in-stock form when sold out. */
export function WishlistItemCard({ item }: { item: WishlistListItem }) {
  const { product, variants } = item;
  const variant = variants[0];
  const { store } = useStorefront();
  const { money } = useMoney();
  const { addToCart, adding } = useCartContext();
  const { removeFromWishlist, wishlisting } = useWishlistContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const [added, setAdded] = useState(false);

  const isPhysical = product.productType === 'physical' || product.type === 'physical';
  const soldOut = variant ? !variantCanBuy(variant as never, !isPhysical) : true;
  const back = useBackInStock(store.storeId, product._id, variant?._id, soldOut);
  if (!variant) return null;

  const href = `/product/${handleOf(product)}`;
  const busy = wishlisting === variant._id;
  const isAdding = adding === variant._id;
  const options = (variant.options ?? []).filter(o => o.value && o.value.toLowerCase() !== 'default title').map(o => `${o.name}: ${o.value}`).join(' · ');
  const compare = variant.compareAtPrice != null && variant.compareAtPrice > variant.price ? variant.compareAtPrice : null;
  const image = variant.images?.[0] || product.images?.[0];

  const add = async () => {
    const ok = await addToCart(product._id, variant._id, isPhysical ? 'physical' : 'digital', 1);
    if (!ok) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
    if (drawerMounted) openDrawer();
  };

  return (
    <li className="flex list-none flex-col gap-4 p-4 sm:p-5" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 20, background: t.colors.bg }}>
      <div className="flex gap-4">
        <Link to={href} aria-label={product.name} className="grid shrink-0 place-items-center overflow-hidden" style={{ width: 104, height: 130, borderRadius: 14, background: t.colors.bgAlt }}>
          {image ? <img src={image} alt="" loading="lazy" decoding="async" className="size-full object-cover" /> : <ImageOff size={22} aria-hidden style={{ color: t.colors.inkMuted }} />}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <Link to={href} className="text-base font-medium leading-snug no-underline" style={{ color: t.colors.ink }}>{product.name}</Link>
          {options && <p className="m-0 mt-1 text-[13px]" style={{ color: t.colors.inkMuted }}>{options}</p>}
          <p className="m-0 mt-2 flex flex-wrap items-baseline gap-2 text-base font-semibold">
            {money(variant.price, variant.currency)}
            {compare != null && <span className="text-sm font-normal line-through" style={{ color: t.colors.inkMuted }}>{money(compare, variant.currency)}</span>}
          </p>
          {soldOut && <div className="mt-2"><StatusPill tone="bad">{ts('product.soldOut', 'Sold out')}</StatusPill></div>}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
            <PillButton onClick={add} disabled={soldOut} loading={isAdding} style={{ height: 40, padding: '0 20px' }}>
              {!isAdding && <ShoppingBag size={15} aria-hidden />}
              {soldOut ? ts('pg.word_unavailable', 'Unavailable') : added ? ts('pg.added_to_bag', 'Added to bag') : ts('pg.add_to_bag', 'Add to bag')}
            </PillButton>
            <button type="button" onClick={() => void removeFromWishlist(product._id, variant._id)} disabled={busy} aria-label={ts('pg.remove_name_from_wishlist', 'Remove {{name}} from wishlist', { name: product.name })}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-[13px] font-medium disabled:opacity-50" style={{ color: t.colors.inkMuted, cursor: busy ? 'default' : 'pointer' }}>
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />}{ts('checkout.remove', 'Remove')}
            </button>
          </div>
        </div>
      </div>
      <span className="sr-only" role="status">{added ? ts('pg.name_added_to_your_bag', '{{name}} added to your bag', { name: product.name }) : ''}</span>

      {back.show && (
        <form onSubmit={back.submit} className="flex flex-col gap-2 p-3" style={{ borderRadius: 14, background: t.colors.bgAlt }}>
          <label htmlFor={`bis-${variant._id}`} className="flex items-center gap-2 text-[13px] font-medium"><Bell size={14} aria-hidden />{ts('pg.email_me_when_it_is_back', 'Email me when it is back')}</label>
          {back.status !== 'done' && back.status !== 'available' && (
            <div className="flex flex-wrap gap-2">
              <div className="min-w-[180px] flex-1">
                <TextInput id={`bis-${variant._id}`} type="email" required autoComplete="email" placeholder={ts('common.emailPlaceholder', 'you@example.com')} value={back.email} onChange={e => back.setEmail(e.target.value)} style={{ minHeight: 40, padding: '8px 14px' }} />
              </div>
              <PillButton type="submit" loading={back.status === 'loading'} style={{ height: 40, padding: '0 18px' }}>{ts('product.notifyMe', 'Notify me')}</PillButton>
            </div>
          )}
          <p className="m-0 text-[13px]" role={back.status === 'error' ? 'alert' : 'status'} style={{ color: back.status === 'error' ? t.colors.danger : t.colors.inkMuted }}>{back.message}</p>
        </form>
      )}
    </li>
  );
}
