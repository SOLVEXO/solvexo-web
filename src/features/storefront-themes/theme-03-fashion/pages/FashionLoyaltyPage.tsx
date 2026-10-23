import { Award } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { AccountLayout } from '../ui/AccountLayout';
import { EmptyState, ErrorState, SkeletonBlock } from '../ui/primitives';
import { useLoad } from '../../core/pageHooks';
import { RequireAccount } from './orders/OrderParts';
import { loadLoyalty } from '../../core/money/loyaltyLoad';
import { LoyaltyRewards } from './money/LoyaltyRewards';

function Loyalty() {
  useStorefrontSeo({ title: ts('pg.loyalty_rewards', 'Loyalty & rewards'), noindex: true });
  const { store } = useStorefront();
  const { data, loading, error, retry } = useLoad(() => loadLoyalty(store.storeId), [store.storeId]);

  return (
    <AccountLayout title={ts('h.loyalty_rewards', 'Loyalty & *rewards*')} subtitle={ts('pg.earn_points_on_every_order_at_store_and', 'Earn points on every order at {{store}} and trade them for rewards.', { store: store.name })}>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_rewards', 'Loading rewards')}><SkeletonBlock h={120} rows={2} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_your_rewards', 'We could not load your rewards.')} onRetry={retry} />
      ) : !data || data.unavailable ? (
        <EmptyState icon={<Award size={24} />} title={ts('pg.no_loyalty_program_yet', 'No loyalty program yet')} text={ts('pg.store_has_not_set_up_a_rewards_program', '{{store}} has not set up a rewards program. Check back later.', { store: store.name })} />
      ) : (
        <LoyaltyRewards key={store.storeId} storeId={store.storeId} balance={data.balance} rewards={data.rewards} />
      )}
    </AccountLayout>
  );
}

/** `/loyalty` - points balance, tier and reward redemption (store-flagged feature, kept compact). */
export function FashionLoyaltyPage() {
  return <RequireAccount><Loyalty /></RequireAccount>;
}
