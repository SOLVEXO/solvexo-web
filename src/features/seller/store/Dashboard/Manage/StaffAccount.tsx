import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { Camera, Check, KeyRound, Trash2, LogOut, ShieldCheck, Store, User } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { PasswordField } from '@/components/comman/ui/PasswordField';
import { SkeletonBox, Badge } from '@/components/comman/ui';
import { TokenStorage } from '@/api/services/auth';
import { useGetProfile, invalidateProfileCache } from '@/hooks/auth/useGetProfile';
import { useLogout } from '@/hooks/auth/useLogout';
import { useUpload } from '@/hooks/upload/useUpload';
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

  // Unsaved edits only - what is shown is the edit if there is one, else the saved profile value.
  const [edits, setEdits] = useState<{ name?: string; phone?: string; image?: string }>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload: uploadPhoto, uploading: photoUploading } = useUpload('public');

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const shownName = edits.name ?? profile?.name ?? '';
  const shownPhone = edits.phone ?? profile?.phone ?? '';
  const shownImage = edits.image ?? profile?.profileImage ?? '';
  const changed = {
    name: edits.name !== undefined && edits.name.trim() !== (profile?.name ?? ''),
    phone: edits.phone !== undefined && edits.phone.trim() !== (profile?.phone ?? ''),
    image: edits.image !== undefined && edits.image !== (profile?.profileImage ?? ''),
  };
  const profileDirty = changed.name || changed.phone || changed.image;
  const groups = useMemo(() => groupPermissions((profile?.permissions ?? []) as string[]), [profile?.permissions]);
  const permissionCount = groups.reduce((n, g) => n + g.items.length, 0);
  const initials = (profile?.name ?? '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setProfileError('');
    if (!file.type.startsWith('image/')) { setProfileError('Please choose an image file (JPG, PNG or WebP).'); return; }
    if (file.size > 5 * 1024 * 1024) { setProfileError('That image is over 5 MB. Choose a smaller one.'); return; }
    try {
      const data = await uploadPhoto(file);
      setEdits(e => ({ ...e, image: data.url }));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Photo upload failed. Please try again.');
    }
  };

  const saveProfile = async () => {
    setProfileError('');
    if (changed.name && !(edits.name ?? '').trim()) { setProfileError('Name is required.'); return; }
    const payload: { name?: string; phone?: string; profileImage?: string } = {};
    if (changed.name) payload.name = (edits.name ?? '').trim();
    if (changed.phone) payload.phone = (edits.phone ?? '').trim();
    if (changed.image) payload.profileImage = edits.image ?? '';
    setSavingProfile(true);
    try {
      await apiUpdateOwnStaffProfile(payload);
      invalidateProfileCache();
      refetch();
      setEdits({});
      toast.success('Profile updated');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not update your profile.');
    } finally {
      setSavingProfile(false);
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
              {profile?.profileImage
                ? <img src={profile.profileImage} alt="" className="size-14 rounded-full object-cover shrink-0" />
                : <div aria-hidden="true" className="size-14 rounded-full bg-brand-pale-orange text-brand-deep-orange flex items-center justify-center text-[18px] font-bold shrink-0">{initials}</div>}
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
                <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); if (profileDirty) saveProfile(); }}>
                  <div className="flex items-center gap-4">
                    {shownImage
                      ? <img src={shownImage} alt="Profile" className="size-16 rounded-full object-cover shrink-0" />
                      : <div aria-hidden="true" className="size-16 rounded-full bg-brand-pale-orange text-brand-deep-orange flex items-center justify-center text-[20px] font-bold shrink-0">{initials}</div>}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" size="sm" variant="outline" icon={<Camera size={13} />} loading={photoUploading} onClick={() => fileRef.current?.click()}>{shownImage ? 'Change photo' : 'Upload photo'}</Button>
                        {shownImage && <Button type="button" size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => setEdits(e => ({ ...e, image: '' }))}>Remove</Button>}
                      </div>
                      <p className="text-[11.5px] text-slate">JPG, PNG or WebP, up to 5 MB.</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Choose profile photo" onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="staff-acc-name" className={labelCls}>Name</label>
                      <input id="staff-acc-name" className={inputCls} value={shownName} maxLength={80} onChange={e => setEdits(x => ({ ...x, name: e.target.value }))} />
                    </div>
                    <div>
                      <label htmlFor="staff-acc-phone" className={labelCls}>Phone <span className="text-slate font-normal">(optional)</span></label>
                      <input id="staff-acc-phone" type="tel" autoComplete="tel" placeholder="+92 300 1234567" className={inputCls} value={shownPhone} maxLength={30} onChange={e => setEdits(x => ({ ...x, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="staff-acc-email" className={labelCls}>Email</label>
                    <input id="staff-acc-email" className={inputCls} value={profile?.email ?? ''} disabled />
                    <p className="text-[11.5px] text-slate mt-1.5">Your sign-in email can only be changed by the store owner.</p>
                  </div>
                  {profileError && <p role="alert" className="text-[12px] text-error">{profileError}</p>}
                  <div className="flex justify-end gap-2">
                    {profileDirty && <Button type="button" size="sm" variant="ghost" onClick={() => { setEdits({}); setProfileError(''); }}>Discard</Button>}
                    <Button type="submit" size="sm" loading={savingProfile} disabled={!profileDirty || photoUploading}>Save changes</Button>
                  </div>
                </form>
              )}
            </Section>

            <Section icon={<KeyRound size={16} />} title="Password" hint="Changing it signs you out on other devices.">
              <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); savePassword(); }}>
                <div>
                  <label htmlFor="staff-acc-cur" className={labelCls}>Current password</label>
                  <PasswordField id="staff-acc-cur" autoComplete="current-password" className={inputCls} value={current} onChange={e => setCurrent(e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="staff-acc-new" className={labelCls}>New password</label>
                    <PasswordField id="staff-acc-new" autoComplete="new-password" className={inputCls} value={next} onChange={e => setNext(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="staff-acc-conf" className={labelCls}>Confirm new password</label>
                    <PasswordField id="staff-acc-conf" autoComplete="new-password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} />
                  </div>
                </div>
                <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Password requirements">
                  <Rule ok={rules.length} text="At least 8 characters" />
                  <Rule ok={rules.different} text="Different from current" />
                  <Rule ok={rules.match} text="Both entries match" />
                </ul>
                {pwError && <p role="alert" className="text-[12px] text-error">{pwError}</p>}
                <div className="flex justify-end">
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
