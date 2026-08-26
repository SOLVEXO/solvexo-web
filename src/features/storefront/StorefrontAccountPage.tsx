import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { useLogout } from '@/hooks/auth/useLogout';
import { Input } from '@/components/comman/ui/Input';
import { Button } from '@/components/comman/ui/Button';
import { OrdersTab } from '@/features/buyer/pages/MyOrdersPage';
import { useStorefront } from './StorefrontContext';
import { LogOut, Check } from 'lucide-react';

// Minimal storefront-local replacement for the old cross-origin hard-nav to
// the apex Account Workspace (see StorefrontNavbar's "Account" button) — a
// per-store buyer's session (see User.storeId / authCookie.ts's host-scoped
// cookie) is invisible on the apex, so that hard-nav would otherwise show a
// false logged-out state. Deliberately just profile + orders + logout, not
// a full re-implementation of every apex /account/* tab (wishlist,
// subscriptions, messages, etc.) — those stay a later phase.
export function StorefrontAccountPage() {
  usePageTitle('My Account');
  const { store } = useStorefront();
  const logout = useLogout();
  const { profile, loading: profileLoading } = useGetProfile();
  const { execute: editProfile, loading: saving, success: saved } = useEditProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  const handleSave = () => { editProfile({ name, phone, address }); };
  const handleLogout = () => { logout('/'); };

  return (
    <div className="max-w-[720px] mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[20px] font-bold text-carbon">My Account</p>
          <p className="text-[13px] text-slate mt-0.5">Your account at {store.name}.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut size={13} />}>
          Log out
        </Button>
      </div>

      <div className="bg-white border border-bone rounded-2xl p-6">
        <p className="text-[15px] font-bold text-carbon mb-4">Profile</p>
        {profileLoading ? (
          <div className="animate-pulse h-[160px] bg-cream rounded-lg" />
        ) : (
          <div className="flex flex-col gap-4">
            <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email" value={profile?.email ?? ''} readOnly disabled />
            <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} />
            <div className="flex items-center gap-3">
              <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-[12px] text-success font-medium">
                  <Check size={13} /> Saved
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-[15px] font-bold text-carbon mb-4">Order History</p>
        <OrdersTab />
      </div>
    </div>
  );
}
