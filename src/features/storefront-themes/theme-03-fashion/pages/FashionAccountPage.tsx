import { LogOut } from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useLogout } from '@/hooks/auth/useLogout';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { usePageTemplateSections } from '../../usePageTemplateSections';
import { FashionSectionRenderer } from '../sections';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { PillButton, ErrorState, SkeletonBlock } from '../ui/primitives';
import { AccountLayout } from '../ui/AccountLayout';
import { ProfileCard } from './account/ProfileCard';
import { PasswordCard } from './account/PasswordCard';
import { RecentOrders } from './account/RecentOrders';

/** `/account`: profile, password and recent orders. Guest sessions are sent to /login?redirect=/account. */
export function FashionAccountPage() {
  const guest = useRequireRealAccount();
  useStorefrontSeo({ title: 'My account', noindex: true });
  const { store } = useStorefront();
  const logout = useLogout();
  const { profile, loading, error, refetch } = useGetProfile();
  const sections = usePageTemplateSections(store.storeId, 'account');

  if (guest) return null;

  return (
    <>
      <AccountLayout title="My" accent="account" subtitle={`Your account at ${store.name}.`}
        actions={<PillButton variant="outline" onClick={() => void logout('/')}><LogOut size={16} aria-hidden /> Log out</PillButton>}>
        <div className="flex flex-col gap-6">
          {loading && !profile ? <SkeletonBlock h={220} />
            : !profile ? <ErrorState message={error ? 'Could not load your profile.' : 'Your profile is not available.'} onRetry={refetch} />
            : <ProfileCard key={profile._id} profile={profile} />}
          <PasswordCard />
          <RecentOrders />
        </div>
      </AccountLayout>
      {sections.length > 0 && <FashionSectionRenderer sections={sections} />}
    </>
  );
}
