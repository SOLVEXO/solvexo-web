import { LogOut } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useLogout } from '@/hooks/auth/useLogout';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { PillButton, ErrorState, SkeletonBlock } from '../ui/primitives';
import { AccountLayout } from '../ui/AccountLayout';
import { ProfileCard } from './account/ProfileCard';
import { PasswordCard } from './account/PasswordCard';
import { RecentOrders } from './account/RecentOrders';
import { WithPageSections } from '../ui/WithPageSections';

/** `/account`: profile, password and recent orders. Guest sessions are sent to /login?redirect=/account. */
export function FashionAccountPage() {
  return <WithPageSections pageKey="account"><FashionAccountPageContent /></WithPageSections>;
}

function FashionAccountPageContent() {
  const guest = useRequireRealAccount();
  useStorefrontSeo({ title: ts('pg.my_account', 'My account'), noindex: true });
  const { store } = useStorefront();
  const logout = useLogout();
  const { profile, loading, error, refetch } = useGetProfile();

  if (guest) return null;

  return (
    <>
      <AccountLayout title={ts('pg.word_my', 'My')} accent={ts('pg.word_account', 'account')} subtitle={ts('pg.your_account_at_store', 'Your account at {{store}}.', { store: store.name })}
        actions={<PillButton variant="outline" onClick={() => void logout('/')}><LogOut size={16} aria-hidden /> {ts('account.logout', 'Log out')}</PillButton>}>
        <div className="flex flex-col gap-6">
          {loading && !profile ? <SkeletonBlock h={220} />
            : !profile ? <ErrorState message={error ? ts('pg.could_not_load_your_profile', 'Could not load your profile.') : ts('pg.your_profile_is_not_available', 'Your profile is not available.')} onRetry={refetch} />
            : <ProfileCard key={profile._id} profile={profile} />}
          <PasswordCard />
          <RecentOrders />
        </div>
      </AccountLayout>
    </>
  );
}
