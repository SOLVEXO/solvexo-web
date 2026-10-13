import { lazy, Suspense, useState } from 'react';
import { KeyRound, LogOut, ShieldCheck, User } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox, Badge } from '@/components/comman/ui';
import { TokenStorage } from '@/api/services/auth';
import { useGetProfile, invalidateProfileCache } from '@/hooks/auth/useGetProfile';
import { useLogout } from '@/hooks/auth/useLogout';
import { useToast } from '@/contexts/ToastContext';
import {
  apiUpdateOwnStaffProfile, apiChangeOwnStaffPassword,
  PERMISSION_LABELS, type StaffPermission,
} from '@/api/services/staff';

const SellerSettings = lazy(() => import('@/features/seller/dashboard/settings/SellerSettings').then(m => ({ default: m.SellerSettings })));

const inputCls = 'w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40 disabled:bg-cream disabled:text-slate';

/** `/store/:storeId/account` — a staff session gets its OWN account page
 *  (profile, role, password); the owner keeps the full seller Account page. */
export default function StoreAccountRoute() {
  const isStaff = TokenStorage.getUser<{ role?: string }>()?.role === 'staff';
  if (!isStaff) {
    return <Suspense fallback={null}><SellerSettings /></Suspense>;
  }
  return <StaffAccountPage />;
}

function StaffAccountPage() {
  const { storeId } = useStoreWorkspace();
  const { profile, loading, error, refetch } = useGetProfile();
  const toast = useToast();
  const logout = useLogout();

  const [name, setName] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const shownName = name ?? profile?.name ?? '';
  const permissions = (profile?.permissions ?? []) as string[];

  const saveName = async () => {
    setNameError('');
    if (!shownName.trim()) { setNameError('Name is required.'); return; }
    setSavingName(true);
    try {
      await apiUpdateOwnStaffProfile(shownName.trim());
      invalidateProfileCache();
      refetch();
      setName(null);
      toast.success('Profile updated');
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Could not update your profile.');
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    setPwError('');
    if (!current) { setPwError('Enter your current password.'); return; }
    if (next.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setPwError("Passwords don't match."); return; }
    setSavingPw(true);
    try {
      const res = await apiChangeOwnStaffPassword(current, next);
      // The change revokes every older session — keep THIS device signed in with the fresh token.
      TokenStorage.save(res.data.accessToken, res.data.accessToken);
      setCurrent(''); setNext(''); setConfirm('');
      toast.success('Password changed. Other devices were signed out.');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <StorePageHeader title="My account" subtitle="Your staff profile, access level and password." titleContext="store" />
      <div className="px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-5 max-w-[640px]">
        {error && (
          <div role="alert" className="bg-error-bg border border-error/30 rounded-lg px-3.5 py-2.5 text-[12px] text-error flex items-center justify-between gap-3">
            <span>Couldn't load your profile — {error}</span>
            <Button size="xs" variant="outline" onClick={refetch}>Retry</Button>
          </div>
        )}

        <section className="bg-white rounded-xl border border-bone p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2"><User size={15} className="text-brand-orange" /><p className="text-[14px] font-semibold text-charcoal">Profile</p></div>
          {loading && !profile ? <SkeletonBox height={96} rounded="10px" /> : (
            <>
              <div>
                <label htmlFor="staff-acc-name" className="text-[12px] font-medium text-graphite mb-1 block">Name</label>
                <input id="staff-acc-name" className={inputCls} value={shownName} maxLength={80} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="staff-acc-email" className="text-[12px] font-medium text-graphite mb-1 block">Email</label>
                <input id="staff-acc-email" className={inputCls} value={profile?.email ?? ''} disabled />
                <p className="text-[11px] text-slate mt-1">Your sign-in email can only be changed by the store owner.</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-slate">
                <span>Store: <strong className="text-charcoal">{profile?.storeName ?? '—'}</strong></span>
                <span>Role: <strong className="text-charcoal">{profile?.staffRoleName ?? 'No role assigned'}</strong></span>
              </div>
              {nameError && <p role="alert" className="text-[12px] text-error">{nameError}</p>}
              <div><Button size="sm" loading={savingName} disabled={name === null || name === profile?.name} onClick={saveName}>Save changes</Button></div>
            </>
          )}
        </section>

        <section className="bg-white rounded-xl border border-bone p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand-orange" /><p className="text-[14px] font-semibold text-charcoal">What you can do</p></div>
          {permissions.length === 0 ? (
            <p className="text-[12px] text-slate">No permissions are assigned to your role yet. Ask the store owner.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {permissions.map(p => <Badge key={p} color="gray" size="sm">{PERMISSION_LABELS[p as StaffPermission] ?? p}</Badge>)}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-bone p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2"><KeyRound size={15} className="text-brand-orange" /><p className="text-[14px] font-semibold text-charcoal">Change password</p></div>
          <div>
            <label htmlFor="staff-acc-cur" className="text-[12px] font-medium text-graphite mb-1 block">Current password</label>
            <input id="staff-acc-cur" type="password" autoComplete="current-password" className={inputCls} value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
          <div>
            <label htmlFor="staff-acc-new" className="text-[12px] font-medium text-graphite mb-1 block">New password</label>
            <input id="staff-acc-new" type="password" autoComplete="new-password" placeholder="At least 8 characters" className={inputCls} value={next} onChange={e => setNext(e.target.value)} />
          </div>
          <div>
            <label htmlFor="staff-acc-conf" className="text-[12px] font-medium text-graphite mb-1 block">Confirm new password</label>
            <input id="staff-acc-conf" type="password" autoComplete="new-password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          {pwError && <p role="alert" className="text-[12px] text-error">{pwError}</p>}
          <div><Button size="sm" loading={savingPw} onClick={savePassword}>Update password</Button></div>
        </section>

        <div>
          <Button variant="outline" size="sm" icon={<LogOut size={13} />} onClick={() => logout(`/staff-login/${storeId}`)}>Log out</Button>
        </div>
      </div>
    </>
  );
}
