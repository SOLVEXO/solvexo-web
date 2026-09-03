import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGetProfile, invalidateProfileCache } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { useUpload } from '@/hooks/upload/useUpload';
import { useMyStores } from '@/hooks/store/useMyStores';
import { apiDeleteAccount } from '@/api/services/users';
import { TokenStorage } from '@/api/services/auth';
import { Modal, Button, NotificationsPanel, StarRating } from '@/components/comman/ui';
import {
  User, KeyRound,
  Trash2, Camera, Settings, Check, Loader2, Eye, EyeOff, ChevronLeft, ChevronRight, Quote, type LucideIcon,
} from 'lucide-react';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  apiGetMyTestimonialSubmission, apiSubmitTestimonial, type MyTestimonialSubmission,
} from '@/api/services/testimonials';

// ── Data ──────────────────────────────────────────────────────────────────────
// Account-level only. Store Info/Domain/Payments/Shipping/Billing/Payouts/
// Invoices used to live here as tabs, but they're inherently per-store (a
// seller can own multiple stores) and can't be edited from an account-wide
// page — they're reached from the store workspace sidebar instead
// (StoreSettings/StoreSEO/StoreFinance/StorePlanBilling), not duplicated here.
// Staff/Permissions/Tax have no backend implementation anywhere yet either
// (no RBAC system, no tax module) — building them is a separate product decision.
//
// 'notifications' is deliberately kept in this union, in `validTabs` below,
// and still fully rendered (`active === 'notifications'` → <NotificationsPanel/>)
// even though it's no longer a browsable item in SETTINGS_NAV — both
// NotificationBell's "View All" and the store navbar's own bell already
// hard-navigate to this exact page's `?tab=notifications` (see
// NotificationBell.tsx / ProfileAvatar.tsx), so deleting the tab itself
// would silently break those two live links. Only its standalone entry in
// the Account sidebar/mobile menu was removed, at the seller's request —
// real notifications now live in the store dashboard's own navbar bell, so
// browsing to a second, separate "Notifications" page from inside Account
// was pure duplication of the same data.
//
// 'two-factor' was removed outright (not just hidden) — unlike the section
// above, nothing else in the app links to `?tab=two-factor`, and its content
// was never more than a "Settings for this section are coming soon"
// placeholder (no 2FA backend exists yet), so there was nothing live left
// to preserve.
type SettingSection = 'profile' | 'email-password' | 'notifications' | 'delete-account';

const SETTINGS_NAV: { group: string; isDanger?: boolean; items: { id: SettingSection; label: string; Icon: LucideIcon }[] }[] = [
  {
    group: 'Account',
    items: [
      { id: 'profile',         label: 'Profile',          Icon: User           },
      { id: 'email-password',  label: 'Email & Password', Icon: KeyRound       },
    ],
  },
  {
    group: 'Danger Zone',
    isDanger: true,
    items: [
      { id: 'delete-account',  label: 'Delete Account',   Icon: Trash2         },
    ],
  },
];

// ── Mobile-only profile hero — centered avatar/name/email/role badge on a
// gradient, with a stats strip overlapping its bottom edge (rounded-top
// white sheet pulled up over the gradient) — same native-app "profile tab"
// pattern already established on the buyer side (AccountDashboard's
// MobileProfileHero), just recolored/re-stat'd for a seller identity
// (Stores/Products/Revenue instead of Orders/Wishlist/Addresses — all real
// numbers from the same useMyStores() summary the "My Stores" page uses,
// never fabricated).
function MobileSellerHero({
  name, email, image, role, isVerified, storeCount, totalProducts, totalRevenueUSD, loading,
}: {
  name?: string; email?: string; image?: string | null; role?: string; isVerified?: boolean;
  storeCount: number; totalProducts: number; totalRevenueUSD: number; loading: boolean;
}) {
  return (
    <div className="lg:hidden -mx-4 -mt-5">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-orange via-[#d98a6f] to-[#f0b8a0] px-6 pt-8 pb-12 flex flex-col items-center text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
        />
        {image ? (
          <img
            loading="lazy" decoding="async"
            src={image} alt={name ?? 'Seller'}
            className="relative size-24 rounded-full object-cover ring-4 ring-white/40"
          />
        ) : (
          <div className="relative size-24 rounded-full bg-white/15 ring-4 ring-white/40 flex items-center justify-center text-white text-[26px] font-bold">
            {name ? name.slice(0, 2).toUpperCase() : 'SE'}
          </div>
        )}
        <p className="relative text-[19px] font-bold text-white mt-3 leading-tight">{name ?? 'Seller'}</p>
        {email && <p className="relative text-[13px] text-white/75 mt-[2px]">{email}</p>}
        <div className="relative flex items-center gap-1.5 mt-3">
          <span className="inline-flex px-4 py-[6px] rounded-full bg-white/20 text-[11px] font-semibold text-white capitalize">
            {role ?? 'Seller'} Account
          </span>
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-3 py-[6px] rounded-full bg-white/20 text-[11px] font-semibold text-white">
              <Check size={10} /> Verified
            </span>
          )}
        </div>
      </div>

      <div className="relative -mt-6 mx-4 rounded-t-[24px] bg-white px-2 pt-5 pb-4 flex items-center">
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">{loading ? '—' : storeCount}</span>
          <span className="text-[11px] text-slate">Stores</span>
        </div>
        <div className="w-px h-9 bg-bone" />
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">{loading ? '—' : totalProducts.toLocaleString()}</span>
          <span className="text-[11px] text-slate">Products</span>
        </div>
        <div className="w-px h-9 bg-bone" />
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">
            {loading ? '—' : `$${totalRevenueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </span>
          <span className="text-[11px] text-slate">Revenue</span>
        </div>
      </div>
    </div>
  );
}

// ── Mobile-only navigation menu — a flat, grouped list of every settings
// section (icon + label + chevron), same native-app "account home" pattern
// as the buyer side's MobileAccountMenu. Unlike the buyer version this
// doesn't navigate to a real route (SellerSettings has no nested routing) —
// it drills into the same tab content this page already renders, via local
// state (see mobileDrilledIn below).
function MobileSellerMenu({ active, onSelect }: { active: SettingSection; onSelect: (id: SettingSection) => void }) {
  return (
    <div className="lg:hidden flex flex-col gap-4">
      {SETTINGS_NAV.map(section => (
        <div key={section.group} className="bg-white border border-bone rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className={`text-[10.5px] font-bold uppercase tracking-[0.06em] ${section.isDanger ? 'text-[#C0392B]' : 'text-slate'}`}>
              {section.group}
            </p>
          </div>
          <div className="divide-y divide-[#f5f4ef]">
            {section.items.map(item => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-[13px] bg-transparent border-0 cursor-pointer text-left transition-colors ${isActive ? 'bg-cream' : 'hover:bg-cream'}`}
                >
                  <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${section.isDanger ? 'bg-[#FDECEA]' : 'bg-brand-pale-orange'}`}>
                    <item.Icon size={15} className={section.isDanger ? 'text-[#C0392B]' : 'text-brand-orange'} />
                  </div>
                  <span className={`flex-1 text-[13px] font-medium ${section.isDanger ? 'text-[#C0392B]' : 'text-charcoal'}`}>{item.label}</span>
                  <ChevronRight size={15} className="text-slate shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Self-serve testimonial submission — a seller's own quote about Solvexo
// (not their store), reviewed by admin before it can show up on the
// homepage. See `PlatformTestimonial` schema's own doc comment on why
// sellerName/storeName are never sent from here. `undefined` = still
// loading (renders nothing, rather than flashing the form then swapping to
// an already-submitted state); `null` = no submission yet.
function ShareStoryCard() {
  const [submission, setSubmission] = useState<MyTestimonialSubmission | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGetMyTestimonialSubmission()
      .then(res => { if (!cancelled) setSubmission(res.data); })
      .catch(() => { if (!cancelled) setSubmission(null); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit() {
    if (!rating || !text.trim()) { setError('Please add a rating and a short story.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await apiSubmitTestimonial({ rating, text: text.trim() });
      setSubmission(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit your story.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submission === undefined) return null;
  // A prior rejected submission is treated the same as "none yet" — the
  // seller can submit again rather than being permanently locked out.
  const hasSubmission = !!submission && submission.status !== 'rejected';

  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden mt-5">
      <div className="px-4 sm:px-[26px] py-5 bg-gradient-to-br from-brand-pale-orange/50 to-cream border-b border-bone flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white border border-bone flex items-center justify-center shrink-0">
          <Quote size={18} className="text-brand-orange" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-charcoal">Share Your Solvexo Story</p>
          <p className="text-[12px] text-slate mt-[2px]">Your quote could be featured on our homepage.</p>
        </div>
      </div>

      <div className="px-4 sm:px-[26px] py-6">
        {hasSubmission ? (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center shrink-0 mt-[1px]">
              <Check size={16} className="text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-charcoal">
                Submitted! {submission!.status === 'approved' ? "It's live on our homepage." : "It's pending review."}
              </p>
              <StarRating value={submission!.rating} size={13} className="mt-[6px] mb-2" />
              <p className="text-[13px] text-charcoal italic leading-[1.6]">"{submission!.text}"</p>
              <span
                className="inline-flex items-center mt-3 px-[10px] py-[3px] rounded-full text-[11px] font-semibold"
                style={submission!.status === 'approved' ? { background: '#E3F4EA', color: '#1E7A3C' } : { background: '#FDF3E7', color: '#9A6A17' }}
              >
                {submission!.status === 'approved' ? 'Published' : 'Pending Review'}
              </span>
            </div>
          </div>
        ) : (
          <>
            <label className="text-[12px] font-medium text-slate mb-2 block">Your rating</label>
            <StarRating value={rating} onChange={setRating} size={22} className="mb-4" />
            <label className="text-[12px] font-medium text-slate mb-[5px] block">Your story</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              placeholder="What has Solvexo helped you do?"
              className="w-full px-3 py-[10px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors resize-none"
            />
            {error && <p className="text-[11.5px] text-error mt-2">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`mt-4 px-6 py-[10px] bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white flex items-center gap-2 ${submitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit Your Story'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
// `variant="store"` renders this same account-settings content inside a
// specific store's dashboard (via StorePageHeader, with that workspace's
// back-nav/notification bell) — used at /store/:storeId/account. There's no
// separate cross-store "seller dashboard" page any more, so a seller's own
// profile/security/notifications must be reachable from inside whichever
// store they're currently working in, not just from the legacy /seller/settings
// page (kept reachable by direct URL only, matching this project's established
// "disconnect, don't delete" convention — nothing links to it any more).
export function SellerSettings({ variant = 'seller' }: { variant?: 'seller' | 'store' } = {}) {
  usePageTitle('Settings');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as SettingSection | null;
  const validTabs: SettingSection[] = ['profile', 'email-password', 'notifications', 'delete-account'];
  const [active, setActive] = useState<SettingSection>(
    requestedTab && validTabs.includes(requestedTab) ? requestedTab : 'profile',
  );
  // Mobile-only: whether we've drilled into a section from the account-hub
  // menu below (mirrors the buyer AccountLayout's back-arrow drill-in, done
  // via local state instead of real routes since this page has none).
  // Desktop ignores this entirely — content + sidebar are always shown there.
  const [mobileDrilledIn, setMobileDrilledIn] = useState(
    !!(requestedTab && validTabs.includes(requestedTab)),
  );
  const { summary: storesSummary, loading: storesLoading } = useMyStores();
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { profile, loading: profileLoading } = useGetProfile();
  const { execute: editProfile, loading: saving, error: saveError, success: saved } = useEditProfile();
  const { upload: uploadPhoto, uploading: photoUploading } = useUpload('public');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword,     setShowNewPassword]     = useState(false);
  const { execute: changePassword, loading: pwSaving, error: pwError, success: pwSuccess } = useChangePassword();

  const handleChangePassword = async () => {
    const ok = await changePassword({ currentPassword, newPassword });
    if (ok) { setCurrentPassword(''); setNewPassword(''); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await apiDeleteAccount();
      TokenStorage.clear();
      invalidateProfileCache();
      navigate('/login');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    const parts = profile.name.split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
    setProfileImage(profile.profileImage ?? '');
  }, [profile]);

  const handleSave = () => {
    const name = `${firstName} ${lastName}`.trim();
    editProfile({ name, phone, address, profileImage });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhoto(file).then(data => setProfileImage(data.url)).catch(() => {});
  };

  const allItems = SETTINGS_NAV.flatMap(g => g.items);
  const activeItem = allItems.find(i => i.id === active);
  // `activeItem` is undefined for 'notifications' now that it's not a
  // SETTINGS_NAV entry any more (see the comment above SettingSection) — this
  // covers just the mobile back-bar title, the one place that still needs a
  // human label for a tab that can be reached without ever appearing in the
  // menu (a deep link from NotificationBell/ProfileAvatar's own bell).
  const activeSectionLabel = activeItem?.label ?? (active === 'notifications' ? 'Notifications' : 'Settings');

  return (
    <>
      {variant === 'store'
        ? <StorePageHeader title="Account" subtitle="Manage your personal profile and login details." />
        : <SellerPageHeader title="Settings" subtitle="Manage your account preferences." />}

      <div className="px-4 lg:px-7 pt-5 pb-8">
        {/* Mobile-only account hub — hero (avatar/name/email/role + real
           Stores/Products/Revenue stats) + a grouped menu list, replacing
           the old horizontal pill-tab row with the same native-app "account
           home" pattern already established on the buyer side. Hidden once
           a section has been opened (mobileDrilledIn) and always hidden on
           desktop, which keeps its persistent sidebar instead. */}
        {!mobileDrilledIn && (
          <div className="lg:hidden flex flex-col gap-4 mb-5">
            <MobileSellerHero
              name={profile?.name}
              email={profile?.email}
              image={profileImage}
              role={profile?.role}
              isVerified={profile?.isVerified}
              storeCount={storesSummary.storeCount}
              totalProducts={storesSummary.totalProducts}
              totalRevenueUSD={storesSummary.totalRevenueUSD}
              loading={storesLoading}
            />
            <MobileSellerMenu active={active} onSelect={id => { setActive(id); setMobileDrilledIn(true); }} />
          </div>
        )}

        {/* Mobile-only back bar — shown only once a section is open. */}
        {mobileDrilledIn && (
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <button
              onClick={() => setMobileDrilledIn(false)}
              aria-label="Back to account menu"
              className="size-8 -ml-1 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-charcoal hover:bg-cream transition-colors"
            >
              <ChevronLeft size={19} />
            </button>
            <p className="text-[15px] font-bold text-carbon">{activeSectionLabel}</p>
          </div>
        )}

        <div className={`${mobileDrilledIn ? 'grid' : 'hidden lg:grid'} grid-cols-1 lg:grid-cols-[1fr_260px] gap-5`}>

          {/* ── LEFT: Content ── */}
          <div>

            {/* Profile section — a warm hero band (avatar + name + role/
               verified badges), same pattern as the buyer side's Profile
               page, instead of a plain "Profile Photo" form row plus
               separate read-only Role/Status input boxes further down. */}
            {active === 'profile' && (
              <>
              <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
                {profileLoading ? (
                  <div className="px-4 sm:px-[26px] py-6">
                    {/* Avatar skeleton */}
                    <div className="flex items-center gap-4 mb-[22px]">
                      <div className="animate-pulse w-[76px] h-[76px] rounded-full bg-bone shrink-0" />
                      <div>
                        <div className="animate-pulse w-[110px] h-[13px] rounded bg-bone mb-2" />
                        <div className="animate-pulse w-20 h-[11px] rounded bg-bone" />
                      </div>
                    </div>
                    <div className="h-px bg-[#f0eee6] mb-5" />
                    {[1,2,3,4].map(i => (
                      <div key={i} className="mb-4">
                        <div className="animate-pulse w-20 h-[11px] rounded bg-bone mb-[6px]" />
                        <div className="animate-pulse w-full h-[38px] rounded-lg bg-bone" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Hero — avatar (camera button overlaid on it, not a
                       separate row below) + name + email + role/verified
                       badges, all in one warm-tinted band. */}
                    <div className="px-4 sm:px-[26px] py-6 bg-gradient-to-br from-brand-pale-orange/60 to-cream flex items-center gap-4 sm:gap-5 border-b border-bone">
                      <label className={`relative shrink-0 ${photoUploading ? 'cursor-wait' : 'cursor-pointer'}`}>
                        <div className="w-[72px] h-[72px] rounded-full bg-white text-brand-deep-orange text-[24px] font-bold flex items-center justify-center overflow-hidden border-[3px] border-white outline outline-1 outline-bone">
                          {photoUploading
                            ? <Loader2 size={22} className="animate-spin" />
                            : profileImage
                              ? <img loading="lazy" decoding="async" src={profileImage} alt={profile?.name} className="w-full h-full object-cover" />
                              : (profile?.name?.slice(0, 2).toUpperCase() ?? 'ME')}
                        </div>
                        <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-orange border-2 border-white flex items-center justify-center">
                          <Camera size={11} className="text-white" />
                        </span>
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
                      </label>
                      <div className="min-w-0">
                        <p className="text-[17px] font-bold text-charcoal truncate">{profile?.name || 'Seller'}</p>
                        <p className="text-[12.5px] text-slate truncate mt-[3px]">{profile?.email ?? ''}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="px-[9px] py-[3px] rounded-full text-[10.5px] font-bold uppercase tracking-wide bg-brand-orange/15 text-brand-deep-orange capitalize">{profile?.role ?? ''}</span>
                          {profile?.isVerified && (
                            <span className="px-[9px] py-[3px] rounded-full text-[10.5px] font-bold bg-success-bg text-success flex items-center gap-1">
                              <Check size={10} /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 sm:px-[26px] py-6">

                    {/* Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-4">
                      <div>
                        <label className="text-[12px] font-medium text-slate mb-[5px] block">First Name</label>
                        <input
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          className="w-full px-3 py-[10px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-slate mb-[5px] block">Last Name</label>
                        <input
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          className="w-full px-3 py-[10px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                      <label className="text-[12px] font-medium text-slate mb-[5px] block">Email</label>
                      <div className="flex items-center gap-[10px]">
                        <input
                          readOnly
                          value={profile?.email ?? ''}
                          className="flex-1 min-w-0 px-3 py-[10px] text-[13px] border border-bone rounded-lg outline-none text-slate bg-cream box-border"
                        />
                        {profile?.isVerified && (
                          <span className="px-[10px] py-1 rounded-[5px] text-[11px] font-semibold bg-success-bg text-success flex items-center gap-1 shrink-0">
                            <Check size={10} /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="mb-4">
                      <label className="text-[12px] font-medium text-slate mb-[5px] block">Phone Number</label>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. +92 300 0000000"
                        className="w-full px-3 py-[10px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors"
                      />
                    </div>

                    {/* Address */}
                    <div className="mb-[22px]">
                      <label className="text-[12px] font-medium text-slate mb-[5px] block">Address</label>
                      <input
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Your address"
                        className="w-full px-3 py-[10px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 py-[10px] bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white flex items-center gap-2 ${saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                      >
                        {saving && <Loader2 size={13} className="animate-spin" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      {saved && <span className="text-[11px] text-success font-medium">Profile updated</span>}
                      {saveError && <span className="text-[11px] text-error font-medium">{saveError}</span>}
                    </div>
                    </div>
                  </>
                )}
              </div>
              <ShareStoryCard />
              </>
            )}

            {/* Email & Password section */}
            {active === 'email-password' && (
              <div className="bg-white border border-bone rounded-[10px] px-4 sm:px-[26px] py-6">
                <p className="text-base font-bold text-carbon mb-[22px]">Email &amp; Password</p>

                <div className="mb-5">
                  <label className="text-[12px] font-medium text-slate mb-[5px] block">Email</label>
                  <input readOnly value={profile?.email ?? ''}
                    className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-slate bg-cream box-border" />
                </div>

                <div className="h-px bg-[#f0eee6] mb-5" />

                <p className="text-[13px] font-semibold text-carbon mb-4">Change Password</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-4">
                  <div>
                    <label className="text-[12px] font-medium text-slate mb-[5px] block">Current Password</label>
                    <div className="relative">
                      <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full px-3 pr-[42px] py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                      <button type="button" onClick={() => setShowCurrentPassword(s => !s)}
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors">
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-slate mb-[5px] block">New Password</label>
                    <div className="relative">
                      <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-3 pr-[42px] py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                      <button type="button" onClick={() => setShowNewPassword(s => !s)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors">
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={pwSaving || !currentPassword || !newPassword}
                    className={`px-6 py-[10px] bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white flex items-center gap-2 ${pwSaving || !currentPassword || !newPassword ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                  >
                    {pwSaving && <Loader2 size={13} className="animate-spin" />}
                    {pwSaving ? 'Updating…' : 'Update Password'}
                  </button>
                  {pwSuccess && <span className="text-[11px] text-success font-medium">Password changed successfully</span>}
                  {pwError && <span className="text-[11px] text-error font-medium">{pwError}</span>}
                </div>
              </div>
            )}

            {/* Notifications section */}
            {active === 'notifications' && (
              <NotificationsPanel />
            )}

            {/* Other sections */}
            {active !== 'profile' && active !== 'email-password' && active !== 'notifications' && (
              <div className="bg-white border border-bone rounded-[10px] px-4 sm:px-[26px] py-6">
                <div className="flex flex-col items-center justify-center py-[60px] text-center">
                  <div className="text-slate mb-[14px]">
                    {activeItem ? <activeItem.Icon size={40} /> : <Settings size={40} />}
                  </div>
                  <p className="text-[15px] font-semibold text-carbon mb-[6px]">
                    {activeItem?.label ?? 'Settings'}
                  </p>
                  <p className="text-[13px] text-slate">
                    {active === 'delete-account'
                      ? 'Permanently delete your account and all data.'
                      : 'Settings for this section are coming soon.'}
                  </p>
                  {active === 'delete-account' && (
                    <button
                      onClick={() => { setShowDeleteConfirm(true); setDeleteError(''); }}
                      className="mt-4 px-[18px] py-2 bg-[#fdecea] border border-[#f5c6c2] rounded-lg text-[13px] font-semibold text-[#c0392b] cursor-pointer"
                    >
                      Delete My Account
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Nav sidebar — desktop only, mobile uses the tab row above ── */}
          <div className="hidden lg:block">
            <div className="bg-white border border-bone rounded-[10px] p-0 sticky top-[70px]">
              {SETTINGS_NAV.map((group, gi) => (
                <div key={group.group}>
                  {gi > 0 && <div className="h-px bg-[#f0eee6]" />}
                  <div className="px-4 pt-[10px] pb-1">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${group.isDanger ? 'text-[#c0392b]' : 'text-slate'}`}>
                      {group.group}
                    </p>
                  </div>
                  {group.items.map(item => {
                    const isActive = active === item.id;
                    const isDanger = group.isDanger;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className="w-full flex items-center gap-[10px] px-4 py-[9px] cursor-pointer border-none text-left transition-[background] duration-[120ms]"
                        style={{
                          borderLeft: `3px solid ${isActive ? (isDanger ? '#C0392B' : '#D97757') : 'transparent'}`,
                          background: isActive ? (isDanger ? '#FDECEA' : '#FBECE4') : 'transparent',
                          color: isActive ? (isDanger ? '#C0392B' : '#B95A3A') : (isDanger ? '#C0392B' : '#4A4945'),
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAF9F5'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <item.Icon size={14} className="shrink-0" />
                        <span className={`text-[13px] ${isActive ? 'font-semibold' : 'font-normal'}`}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {showDeleteConfirm && (
        <Modal title="Delete your account?" onClose={() => setShowDeleteConfirm(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting}>Delete Account</Button>
          </>
        }>
          <p className="text-[13px] text-slate">
            This deactivates your seller account and signs you out immediately. Your stores and listings will no
            longer be visible to buyers. You'll need to contact support to reactivate it.
          </p>
          {deleteError && <p className="text-[12px] text-error mt-2">{deleteError}</p>}
        </Modal>
      )}
    </>
  );
}
