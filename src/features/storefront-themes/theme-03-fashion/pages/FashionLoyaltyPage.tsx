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
  useStorefrontSeo({ title: 'Loyalty & rewards', noindex: true });
  const { store } = useStorefront();
  const { data, loading, error, retry } = useLoad(() => loadLoyalty(store.storeId), [store.storeId]);

  return (
    <AccountLayout title={ts('pg.loyalty', 'Loyalty &')} accent={ts('pg.word_rewards', 'rewards')} subtitle={`Earn points on every order at ${store.name} and trade them for rewards.`}>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_rewards', 'Loading rewards')}><SkeletonBlock h={120} rows={2} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_your_rewards', 'We could not load your rewards.')} onRetry={retry} />
      ) : !data || data.unavailable ? (
        <EmptyState icon={<Award size={24} />} title={ts('pg.no_loyalty_program_yet', 'No loyalty program yet')} text={`${store.name} has not set up a rewards program. Check back later.`} />
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
