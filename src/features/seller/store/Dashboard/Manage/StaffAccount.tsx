import { lazy, Suspense, useMemo, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, LogOut, ShieldCheck, Store, User } from 'lucide-react';
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

const inputCls = 'w-full h-10 border border-bone rounded-lg px-3 text-[13.5px] text-charcoal bg-white placeholder:text-slate/70 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange disabled:bg-cream disabled:text-slate';
const labelCls = 'text-[12.5px] font-medium text-graphite mb-1.5 block';

/** Permission key prefix → the area a store owner thinks of it under. */
const AREAS: { title: string; prefixes: string[] }[] = [
  { title: 'Dashboard & analytics', prefixes: ['home', 'analytics'] },
  { title: 'Orders', prefixes: ['orders', 'draft_orders'] },
  { title: 'Products', prefixes: ['products'] },
  { title: 'Inventory & purchasing', prefixes: ['inventory', 'purchase_orders'] },
  { title: 'Customers & messages', prefixes: ['customers', 'messaging', 'loyalty'] },
  { title: 'Marketing & gift cards', prefixes: ['marketing', 'discounts', 'giftcards', 'seo', 'aistudio'] },
  { title: 'Online store', prefixes: ['onlinestore', 'content', 'files'] },
  { title: 'Finance', prefixes: ['finance'] },
  { title: 'Settings & team', prefixes: ['settings', 'staff'] },
];

function groupPermissions(perms: string[]) {
  const known = perms.filter(p => p in PERMISSION_LABELS);
  const used = new Set<string>();
  const groups = AREAS.map(area => {
    const items = known.filter(p => area.prefixes.includes(p.split('.')[0]));
    items.forEach(p => used.add(p));
    return { title: area.title, items };
  }).filter(g => g.items.length > 0);
  const rest = known.filter(p => !used.has(p));
  if (rest.length > 0) groups.push({ title: 'Other', items: rest });
  return groups;
}

/** `/store/:storeId/account` — a staff session gets its OWN account page
 *  (profile, access, password); the owner keeps the full seller Account page. */
export default function StoreAccountRoute() {
  const isStaff = TokenStorage.getUser<{ role?: string }>()?.role === 'staff';
  if (!isStaff) {
    return <Suspense fallback={null}><SellerSettings /></Suspense>;
  }
  return <StaffAccountPage />;
}

function Section({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-bone">
      <header className="px-5 py-4 border-b border-bone flex items-start gap-3">
        <span className="mt-0.5 text-brand-orange shrink-0">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-semibold text-charcoal leading-tight">{title}</h2>
          {hint && <p className="text-[12px] text-slate mt-0.5">{hint}</p>}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-[12px] ${ok ? 'text-success' : 'text-slate'}`}>
      <span className={`size-4 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-success-bg' : 'bg-bone'}`}>
        {ok && <Check size={10} strokeWidth={3} />}
      </span>
      {text}
    </li>
  );
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
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const shownName = name ?? profile?.name ?? '';
  const nameDirty = name !== null && name.trim() !== '' && name.trim() !== profile?.name;
  const groups = useMemo(() => groupPermissions((profile?.permissions ?? []) as string[]), [profile?.permissions]);
  const permissionCount = groups.reduce((n, g) => n + g.items.length, 0);
  const initials = (profile?.name ?? '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

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

  const rules = {
    length: next.length >= 8,
    different: next.length > 0 && next !== current,
    match: confirm.length > 0 && confirm === next,
  };
  const pwReady = current.length > 0 && rules.length && rules.different && rules.match;

  const savePassword = async () => {
    setPwError('');
    if (!pwReady) { setPwError('Fill in every field and meet the requirements below.'); return; }
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
      <StorePageHeader title="My account" subtitle="Your staff profile, what you can access, and your password." />
      <div className="px-4 lg:px-7 pt-5 pb-10 flex flex-col gap-5 w-full">
        {error && (
          <div role="alert" className="bg-error-bg border border-error/30 rounded-lg px-3.5 py-2.5 text-[12.5px] text-error flex items-center justify-between gap-3">
            <span>Couldn't load your profile — {error}</span>
            <Button size="xs" variant="outline" onClick={refetch}>Retry</Button>
          </div>
        )}

        {/* ── Identity header ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-bone p-5 flex flex-wrap items-center gap-4">
          {loading && !profile ? (
            <SkeletonBox height={56} rounded="12px" />
          ) : (
            <>
              <div aria-hidden="true" className="size-14 rounded-full bg-brand-pale-orange text-brand-deep-orange flex items-center justify-center text-[18px] font-bold shrink-0">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-charcoal truncate">{profile?.name}</p>
                <p className="text-[12.5px] text-slate truncate">{profile?.email}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[12px] text-slate">
                  <span className="inline-flex items-center gap-1.5"><Store size={13} /> {profile?.storeName ?? '—'}</span>
                  <Badge color="orange" size="sm">{profile?.staffRoleName ?? 'No role assigned'}</Badge>
                  <Badge color={profile?.status === 'active' ? 'green' : 'gray'} size="sm">{profile?.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" icon={<LogOut size={13} />} onClick={() => logout(`/staff-login/${storeId}`)}>Log out</Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          {/* ── Left: profile + password ───────────────────────────────── */}
          <div className="flex flex-col gap-5 min-w-0">
            <Section icon={<User size={16} />} title="Profile" hint="This is the name your team sees.">
              {loading && !profile ? <SkeletonBox height={120} rounded="10px" /> : (
                <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); if (nameDirty) saveName(); }}>
                  <div>
                    <label htmlFor="staff-acc-name" className={labelCls}>Name</label>
                    <input id="staff-acc-name" className={inputCls} value={shownName} maxLength={80} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="staff-acc-email" className={labelCls}>Email</label>
                    <input id="staff-acc-email" className={inputCls} value={profile?.email ?? ''} disabled />
                    <p className="text-[11.5px] text-slate mt-1.5">Your sign-in email can only be changed by the store owner.</p>
                  </div>
                  {nameError && <p role="alert" className="text-[12px] text-error">{nameError}</p>}
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" loading={savingName} disabled={!nameDirty}>Save changes</Button>
                  </div>
                </form>
              )}
            </Section>

            <Section icon={<KeyRound size={16} />} title="Password" hint="Changing it signs you out on other devices.">
              <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); savePassword(); }}>
                <div>
                  <label htmlFor="staff-acc-cur" className={labelCls}>Current password</label>
                  <input id="staff-acc-cur" type={showPw ? 'text' : 'password'} autoComplete="current-password" className={inputCls} value={current} onChange={e => setCurrent(e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="staff-acc-new" className={labelCls}>New password</label>
                    <input id="staff-acc-new" type={showPw ? 'text' : 'password'} autoComplete="new-password" className={inputCls} value={next} onChange={e => setNext(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="staff-acc-conf" className={labelCls}>Confirm new password</label>
                    <input id="staff-acc-conf" type={showPw ? 'text' : 'password'} autoComplete="new-password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} />
                  </div>
                </div>
                <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Password requirements">
                  <Rule ok={rules.length} text="At least 8 characters" />
                  <Rule ok={rules.different} text="Different from current" />
                  <Rule ok={rules.match} text="Both entries match" />
                </ul>
                {pwError && <p role="alert" className="text-[12px] text-error">{pwError}</p>}
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setShowPw(s => !s)} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate hover:text-charcoal bg-transparent border-0 cursor-pointer p-0">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />} {showPw ? 'Hide passwords' : 'Show passwords'}
                  </button>
                  <Button type="submit" size="sm" loading={savingPw} disabled={!pwReady}>Update password</Button>
                </div>
              </form>
            </Section>
          </div>

          {/* ── Right: access, grouped by area ─────────────────────────── */}
          <Section
            icon={<ShieldCheck size={16} />}
            title="What you can do"
            hint={permissionCount > 0 ? `${permissionCount} permission${permissionCount === 1 ? '' : 's'} from your “${profile?.staffRoleName ?? 'role'}” role. Only the store owner can change these.` : undefined}
          >
            {loading && !profile ? <SkeletonBox height={240} rounded="10px" /> : groups.length === 0 ? (
              <p className="text-[12.5px] text-slate">No permissions are assigned to your role yet. Ask the store owner to give you a role.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                {groups.map(g => (
                  <div key={g.title} className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate mb-2">{g.title} <span className="font-medium normal-case tracking-normal">· {g.items.length}</span></p>
                    <ul className="flex flex-col gap-1.5">
                      {g.items.map(p => (
                        <li key={p} className="flex items-start gap-2 text-[12.5px] text-charcoal leading-snug">
                          <Check size={13} className="text-success shrink-0 mt-[2px]" strokeWidth={3} />
                          <span>{PERMISSION_LABELS[p as StaffPermission]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
