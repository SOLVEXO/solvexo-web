import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { TokenStorage } from '@/api/services/auth';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { AccountLayout } from '../ui/AccountLayout';
import { EmptyState, PillButton, SkeletonBlock } from '../ui/primitives';
import { WishlistItemCard } from './community/WishlistItemCard';
import { WithPageSections } from '../ui/WithPageSections';

/** `/wishlist` - the buyer's saved products for this store (account page, not indexed). */
export function FashionWishlistPage() {
  return <WithPageSections pageKey="wishlist"><FashionWishlistPageContent /></WithPageSections>;
}

function FashionWishlistPageContent() {
  const guest = useRequireRealAccount();
  useStorefrontSeo({ title: ts('nav.wishlist', 'Wishlist'), noindex: true });
  const { wishlistItems, loading, clearWishlist, clearing } = useWishlistContext();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearError, setClearError] = useState(false);
  const signedIn = TokenStorage.isLoggedIn();
  const count = wishlistItems.length;

  const clearAll = async () => {
    setClearError(false);
    try { await clearWishlist(); setConfirmClear(false); } catch { setClearError(true); }
  };

  const subtitle = loading ? ts('pg.loading_your_saved_items', 'Loading your saved items') : ts('wishlist.itemsSaved', '{{count}} items saved', { count });

  return (
    <AccountLayout title={ts('h.your_wishlist', 'Your *wishlist*')} subtitle={signedIn ? subtitle : ts('pg.sign_in_to_see_the_items_you_saved', 'Sign in to see the items you saved.')}
      actions={signedIn && count > 0 && !confirmClear ? <PillButton variant="outline" onClick={() => setConfirmClear(true)} style={{ height: 40, padding: '0 20px' }}>{ts('pg.clear_all', 'Clear all')}</PillButton> : undefined}>
      {guest ? null : !signedIn ? (
        <EmptyState icon={<Heart size={24} aria-hidden />} title={ts('pg.sign_in_to_use_your_wishlist', 'Sign in to use your wishlist')} text={ts('pg.save_products_you_love_and_find_them_her', 'Save products you love and find them here on any device.')}
          action={<Link to="/login?redirect=%2Fwishlist" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('auth.signInLink', 'Sign in')}</Link>} />
      ) : loading ? (
        <div role="status" aria-label={ts('pg.loading_wishlist', 'Loading wishlist')}><SkeletonBlock h={170} rows={3} /></div>
      ) : count === 0 ? (
        <EmptyState icon={<Heart size={24} aria-hidden />} title={ts('pg.nothing_saved_yet', 'Nothing saved yet')} text={ts('pg.tap_the_heart_on_any_product_to_keep_it_', 'Tap the heart on any product to keep it here for later.')}
          action={<Link to="/search" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('pg.start_browsing', 'Start browsing')}</Link>} />
      ) : (
        <>
          {confirmClear && (
            <div role="alertdialog" aria-label={ts('pg.clear_wishlist', 'Clear wishlist')} className="mb-5 flex flex-wrap items-center gap-3 p-4" style={{ borderRadius: 16, background: t.colors.bgAlt }}>
              <p className="m-0 min-w-[200px] flex-1 text-sm">{ts('pg.remove_all_saved', 'Remove all {{count}} saved items?', { count })}{clearError && <span role="alert" style={{ color: t.colors.danger }}> {ts('pg.something_went_wrong_please_try_again_2', 'Something went wrong, please try again.')}</span>}</p>
              <PillButton variant="outline" onClick={() => { setConfirmClear(false); setClearError(false); }} style={{ height: 40, padding: '0 18px' }}>{ts('common.cancel', 'Cancel')}</PillButton>
              <PillButton onClick={() => void clearAll()} loading={clearing} style={{ height: 40, padding: '0 18px', background: t.colors.danger, borderColor: t.colors.danger, color: '#fff' }}>{ts('browse.removeAll', 'Remove all')}</PillButton>
            </div>
          )}
          <ul className="m-0 grid gap-4 p-0 xl:grid-cols-2" aria-label={ts('pg.saved_products', 'Saved products')}>
            {wishlistItems.map(item => <WishlistItemCard key={item.product._id} item={item} />)}
          </ul>
        </>
      )}
    </AccountLayout>
  );
}
