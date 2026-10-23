import { Gift } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { apiGetGiftCardPublicSettings } from '@/api/services/giftCards';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { AccountLayout } from '../ui/AccountLayout';
import { EmptyState, ErrorState, SkeletonBlock } from '../ui/primitives';
import { useLoad } from '../../core/pageHooks';
import { RequireAccount } from './orders/OrderParts';
import { GiftCardPurchase } from './money/GiftCardPurchase';

function GiftCards() {
  useStorefrontSeo({ title: ts('pg.gift_cards', 'Gift cards'), noindex: true });
  const { store } = useStorefront();
  const { data: res, loading, error, retry } = useLoad(() => apiGetGiftCardPublicSettings(store.storeId), [store.storeId]);
  const settings = res?.data ?? null;

  return (
    <AccountLayout title={ts('h.gift_cards', 'Gift *cards*')} subtitle={ts('pg.buy_a_gift_card_for_yourself_or_someone', 'Buy a gift card for yourself or someone else at {{store}}.', { store: store.name })}>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_gift_cards', 'Loading gift cards')}><SkeletonBlock h={140} rows={2} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_gift_card_options', 'We could not load gift card options.')} onRetry={retry} />
      ) : !settings?.purchaseEnabled || settings.denominations.length === 0 ? (
        <EmptyState icon={<Gift size={24} />} title={ts('pg.gift_cards_are_not_available', 'Gift cards are not available')} text={ts('pg.store_has_not_enabled_gift_card', '{{store}} has not enabled gift card purchases.', { store: store.name })} />
      ) : (
        <GiftCardPurchase settings={settings} storeId={store.storeId} storeName={store.name} />
      )}
    </AccountLayout>
  );
}

/** `/gift-cards` - buy a gift card for someone (redeeming happens with the code at checkout). */
export function FashionGiftCardsPage() {
  return <RequireAccount><GiftCards /></RequireAccount>;
}
