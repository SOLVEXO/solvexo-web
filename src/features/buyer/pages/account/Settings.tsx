import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Shield, MapPin, Trash2, AlertTriangle, UserCog,
  Mail, Check, Loader2, KeyRound, Camera, UserCircle, Phone, Eye, EyeOff,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { invalidateProfileCache } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { apiChangePassword, apiDeleteAccount } from '@/api/services/users';
import { TokenStorage } from '@/api/services/auth';
import { Card, PageHeader, InfoRow, Badge, Modal, Button, SkeletonBox, TabBar, NotificationsPanel } from '@/components/comman/ui';
import { Addresses } from './Addresses';
import { SubscriptionsTab } from '@/features/buyer/pages/MySubscriptionsPage';

const INPUT_CLS = 'w-full py-[11px] px-[14px] text-[13px] border border-bone rounded-[10px] outline-none text-charcoal bg-white box-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors';
const LABEL_CLS = 'text-[12px] font-medium text-graphite mb-[6px] block';

const TABS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'profile',       label: 'Personal Information' },
  { id: 'security',      label: 'Login & Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'addresses',     label: 'Addresses' },
];

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-[9px] bg-brand-pale-orange flex items-center justify-center shrink-0">
        {icon}
      </div>
      <p className="text-[13px] font-bold text-charcoal">{title}</p>
    </div>
  );
}

// Same show/hide affordance the Login/Register password fields already use —
// the plain <input> fields here had no way to reveal what you typed.
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={clsx(INPUT_CLS, 'pr-10')}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState(TABS.some(t => t.id === initialTab) ? initialTab! : 'overview');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some(x => x.id === t)) setTab(t);
  }, [searchParams]);

  const changeTab = (id: string) => {
    setTab(id);
    setSearchParams(id === 'overview' ? {} : { tab: id });
  };

  const { profile, loading } = useGetProfile();
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

  // ── Danger zone ──────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiDeleteAccount();
      TokenStorage.clear();
      invalidateProfileCache();
      navigate('/login');
    } finally {
      setDeleting(false);
    }
  };

  // ── Personal Information tab ────────────────────────────────────────────
  const { execute: editProfile, loading: saving, error: saveError, success: saved } = useEditProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!profile) return;
    const parts = profile.name.split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  const handleSaveProfile = () => {
    const name = `${firstName} ${lastName}`.trim();
    editProfile({ name, phone, address });
  };

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '..';

  // ── Login & Security tab ────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (!currentPassword || !newPassword) { setPwError('Please fill in both password fields.'); return; }
    setPwSaving(true);
    try {
      await apiChangePassword({ currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword(''); setNewPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, security, and account preferences."
      />

      <TabBar tabs={TABS} active={tab} onChange={changeTab} />

      {tab === 'overview' && (
        <>
          <Card padding="none" className="rounded-2xl overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-br from-brand-pale-orange/60 to-cream border-b border-bone flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-white border border-bone flex items-center justify-center shrink-0">
                <UserCog size={16} className="text-brand-orange" />
              </div>
              <p className="text-[13px] font-bold text-charcoal">Account Overview</p>
            </div>
            <div className="px-6 py-1">
              {loading ? (
                <div className="flex flex-col gap-3 py-4">
                  {[1, 2, 3].map(i => <SkeletonBox key={i} height={14} width="60%" />)}
                </div>
              ) : (
                <>
                  <InfoRow label="Full Name" value={profile?.name ?? '—'} />
                  <InfoRow label="Email" value={profile?.email ?? '—'} />
                  <InfoRow label="Member Since" value={memberSince} />
                  <InfoRow label="Account Role" value={<span className="capitalize">{profile?.role ?? '—'}</span>} />
                  <InfoRow
                    label="Status"
                    value={<Badge color={profile?.status === 'active' ? 'green' : 'gray'} size="sm" dot className="capitalize">{profile?.status ?? '—'}</Badge>}
                    border={false}
                  />
                </>
              )}
            </div>
            <div className="h-4" />
          </Card>

          <Card padding="none" className="rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f5bcbc] bg-error-bg/40 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-white border border-[#f5bcbc] flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-error" />
              </div>
              <p className="text-[13px] font-bold text-error">Danger Zone</p>
            </div>
            <div className="p-6">
              <p className="text-[12px] text-slate leading-relaxed mb-4">
                Deleting your account signs you out and deactivates your profile immediately. This can't be undone from the app — you'll need to contact support to reactivate it.
              </p>
              <Button variant="danger" icon={<Trash2 size={13} />} onClick={() => setShowDeleteConfirm(true)}>
                Delete Account
              </Button>
            </div>
          </Card>
        </>
      )}

      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="flex flex-col gap-5 min-w-0">
            <Card padding="none" className="rounded-2xl overflow-hidden">
              <div className="px-6 py-6 bg-gradient-to-br from-brand-pale-orange/60 to-cream flex items-center gap-5 border-b border-bone">
                <div className="relative shrink-0">
                  <div className="w-[72px] h-[72px] rounded-full bg-white overflow-hidden flex items-center justify-center text-[24px] font-bold text-brand-deep-orange border-[3px] border-white outline outline-1 outline-bone">
                    {loading
                      ? <SkeletonBox width={72} height={72} rounded="50%" />
                      : profile?.profileImage
                        ? <img loading="lazy" decoding="async" src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                        : initials}
                  </div>
                  <button className="absolute bottom-0 right-0 w-[24px] h-[24px] rounded-full bg-brand-orange border-2 border-white flex items-center justify-center cursor-pointer">
                    <Camera size={11} className="text-white" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-bold text-charcoal truncate">{loading ? '…' : profile?.name ?? '—'}</p>
                  <p className="text-[12.5px] text-slate truncate mt-[3px]">{loading ? '' : profile?.email ?? '—'}</p>
                  {!loading && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge color="orange" size="sm" className="capitalize">{profile?.role ?? ''}</Badge>
                      {profile?.isVerified && <Badge color="green" size="sm"><Check size={9} className="mr-[2px]" /> Verified</Badge>}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i}>
                        <SkeletonBox width={90} height={11} className="mb-[6px]" />
                        <SkeletonBox width="100%" height={42} rounded="10px" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <SectionHeading icon={<UserCircle size={15} className="text-brand-orange" />} title="Basic Details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className={LABEL_CLS}>First Name</label>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Last Name</label>
                        <input value={lastName} onChange={e => setLastName(e.target.value)} className={INPUT_CLS} />
                      </div>
                    </div>
                    <div className="mb-5">
                      <label className={LABEL_CLS}>Email Address</label>
                      <div className="flex items-center gap-[10px]">
                        <input readOnly value={profile?.email ?? ''} className={clsx(INPUT_CLS, 'flex-1 bg-cream text-slate cursor-default')} />
                        {profile?.isVerified && (
                          <span className="px-3 py-[6px] rounded-[8px] text-[11px] font-semibold bg-success-bg text-success flex items-center gap-1 shrink-0">
                            <Check size={10} /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-[#f0ede5] my-5" />

                    <SectionHeading icon={<Phone size={14} className="text-brand-orange" />} title="Contact & Delivery" />
                    <div className="mb-5">
                      <label className={LABEL_CLS}>Phone Number</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +92 300 0000000" className={INPUT_CLS} />
                    </div>
                    <div className="mb-6">
                      <label className={LABEL_CLS}><MapPin size={11} className="inline mr-1 -mt-[2px]" />Address</label>
                      <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" className={INPUT_CLS} />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-[#f0ede5]">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className={clsx(
                          'mt-4 px-7 py-[11px] bg-brand-orange border-none rounded-[10px] text-[13px] font-semibold text-white flex items-center gap-2',
                          saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-brand-deep-orange transition-colors',
                        )}
                      >
                        {saving && <Loader2 size={13} className="animate-spin" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      {saved && <span className="text-[11px] text-success font-medium mt-4">Profile updated</span>}
                      {saveError && <span className="text-[11px] text-error font-medium mt-4">{saveError}</span>}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="rounded-2xl">
              <p className="text-[12px] font-semibold text-charcoal mb-3">Account Summary</p>
              <InfoRow label="Member Since" value={memberSince} />
              <InfoRow label="Account Role" value={<span className="capitalize">{profile?.role ?? '—'}</span>} />
              <InfoRow label="Status" value={<Badge color={profile?.status === 'active' ? 'green' : 'gray'} size="sm" dot className="capitalize">{profile?.status ?? '—'}</Badge>} border={false} />
            </Card>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <>
          <Card padding="none" className="rounded-2xl overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-br from-brand-pale-orange/60 to-cream flex items-center gap-3 border-b border-bone">
              <div className="w-10 h-10 rounded-[10px] bg-white border border-bone flex items-center justify-center shrink-0">
                <Mail size={16} className="text-brand-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-charcoal">Email Verification</p>
                {loading ? (
                  <SkeletonBox width={140} height={11} className="mt-1" />
                ) : (
                  <p className="text-[11.5px] text-slate mt-[2px] truncate">{profile?.email ?? '—'}</p>
                )}
              </div>
              {!loading && (
                <Badge color={profile?.isVerified ? 'green' : 'gray'} size="sm">
                  {profile?.isVerified ? (<><Check size={9} className="mr-[2px]" /> Verified</>) : 'Unverified'}
                </Badge>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-[9px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                  <KeyRound size={14} className="text-brand-orange" />
                </div>
                <p className="text-[13px] font-bold text-charcoal">Change Password</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
                <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} />
              </div>

              <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-[#f0ede5]">
                <button
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                  className={clsx(
                    'mt-4 px-6 py-[11px] bg-brand-orange border-none rounded-[10px] text-[13px] font-semibold text-white flex items-center gap-2',
                    pwSaving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-brand-deep-orange transition-colors',
                  )}
                >
                  {pwSaving && <Loader2 size={13} className="animate-spin" />}
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
                {pwSuccess && <span className="text-[11px] text-success font-medium mt-4">Password changed successfully</span>}
                {pwError && <span className="text-[11px] text-error font-medium mt-4">{pwError}</span>}
              </div>
            </div>
          </Card>

          <Card padding="none" className="rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-bone flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[9px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                <Shield size={14} className="text-brand-orange" />
              </div>
              <p className="text-[13px] font-bold text-charcoal">Security Overview</p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-graphite">Password protection</span>
                <Badge color="green" size="sm" dot>Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-graphite">Email verification</span>
                <Badge color={profile?.isVerified ? 'green' : 'gray'} size="sm" dot>{profile?.isVerified ? 'Verified' : 'Unverified'}</Badge>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'notifications' && <NotificationsPanel />}

      {tab === 'subscriptions' && <SubscriptionsTab />}

      {tab === 'addresses' && <Addresses />}

      {showDeleteConfirm && (
        <Modal title="Delete your account?" onClose={() => setShowDeleteConfirm(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting}>Delete Account</Button>
          </>
        }>
          <p className="text-[13px] text-slate">
            This deactivates your account and signs you out immediately. You'll need to contact support to reactivate it.
          </p>
        </Modal>
      )}
    </div>
  );
}
