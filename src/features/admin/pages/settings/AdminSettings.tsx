import { useState, useEffect } from 'react';
import {
  User, KeyRound, ShieldCheck, Bell, Camera,
  Settings, Check, Loader2, Eye, EyeOff, type LucideIcon,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { useUpload } from '@/hooks/upload/useUpload';
import { NotificationsPanel } from '@/components/comman/ui';

// ── Types & Nav ───────────────────────────────────────────────────────────────
// No "Delete Account" here — admin self-deletion isn't supported by the
// backend (usersService.deleteAccount only handles role==='user'|'seller')
// and isn't intended: removing an admin account needs a separate admin-team
// management flow (revoke access), not a self-service delete button.
type Section = 'profile' | 'security' | 'two-factor' | 'notifications';

const NAV: { group: string; isDanger?: boolean; items: { id: Section; label: string; Icon: LucideIcon }[] }[] = [
  {
    group: 'Account',
    items: [
      { id: 'profile',       label: 'Profile',          Icon: User       },
      { id: 'security',      label: 'Email & Password', Icon: KeyRound   },
      { id: 'two-factor',    label: 'Two-Factor Auth',  Icon: ShieldCheck},
      { id: 'notifications', label: 'Notifications',    Icon: Bell       },
    ],
  },
];

// ── Page Header ───────────────────────────────────────────────────────────────
function AdminPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-white border-b border-bone px-7 py-[14px] sticky top-0 z-10">
      <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">{title}</h1>
      {subtitle && <p className="text-[12px] text-slate mt-[2px]">{subtitle}</p>}
    </div>
  );
}

// ── Profile Skeleton ──────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <>
      <div className="flex items-center gap-4 mb-[22px]">
        <div className="animate-pulse w-[76px] h-[76px] rounded-full bg-bone flex-shrink-0" />
        <div>
          <div className="animate-pulse w-[110px] h-[13px] rounded bg-bone mb-2" />
          <div className="animate-pulse w-20 h-[11px] rounded bg-bone" />
        </div>
      </div>
      <div className="h-px bg-[#F0EEE6] mb-5" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="mb-4">
          <div className="animate-pulse w-20 h-[11px] rounded bg-bone mb-[6px]" />
          <div className="animate-pulse w-full h-[38px] rounded-lg bg-bone" />
        </div>
      ))}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AdminSettings() {
  const [active,    setActive]    = useState<Section>('profile');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');
  const [profileImage, setProfileImage] = useState('');

  const { profile, loading: profileLoading } = useGetProfile();
  const { execute: editProfile, loading: saving, error: saveError, success: saved } = useEditProfile();
  const { upload: uploadPhoto, uploading: photoUploading } = useUpload('public');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword,     setShowNewPassword]     = useState(false);
  const { execute: changePassword, loading: pwSaving, error: pwError, success: pwSuccess } = useChangePassword();

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

  const handleChangePassword = async () => {
    const ok = await changePassword({ currentPassword, newPassword });
    if (ok) { setCurrentPassword(''); setNewPassword(''); }
  };

  const allItems  = NAV.flatMap(g => g.items);
  const activeItem = allItems.find(i => i.id === active);

  return (
    <>
      <AdminPageHeader title="Settings" subtitle="Manage your admin account and preferences." />

      <div className="px-7 pt-5 pb-8">
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 260px' }}>

          {/* ── LEFT: Content ── */}
          <div>

            {/* Profile */}
            {active === 'profile' && (
              <div className="bg-white border border-bone rounded-[10px] px-[26px] py-6">
                <p className="text-[16px] font-bold text-charcoal mb-[22px]">Profile</p>

                {profileLoading ? <ProfileSkeleton /> : (
                  <>
                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-[22px]">
                      <label className={`relative flex-shrink-0 ${photoUploading ? 'cursor-wait' : 'cursor-pointer'}`}>
                        <div className="w-[76px] h-[76px] rounded-full bg-[#FDECEA] text-[#C0392B] text-[26px] font-bold flex items-center justify-center overflow-hidden">
                          {photoUploading
                            ? <Loader2 size={24} className="animate-spin" />
                            : profileImage
                              ? <img loading="lazy" decoding="async" src={profileImage} alt={profile?.name} className="w-full h-full object-cover" />
                              : (profile?.name?.slice(0, 2).toUpperCase() ?? 'AD')}
                        </div>
                        <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#C13030] flex items-center justify-center">
                          <Camera size={12} className="text-white" />
                        </span>
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
                      </label>
                      <div>
                        <p className="text-[13px] font-semibold text-charcoal mb-[3px]">Profile Photo</p>
                        <p className="text-[12px] text-slate mb-2">JPG, PNG — max 2 MB</p>
                        <label className={`inline-block px-[14px] py-[5px] bg-white border border-bone rounded-[7px] text-[12px] text-graphite ${photoUploading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
                          {photoUploading ? 'Uploading…' : 'Upload Photo'}
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
                        </label>
                      </div>
                    </div>

                    <div className="h-px bg-[#F0EEE6] mb-5" />

                    {/* Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-4">
                      <div>
                        <label className="text-[12px] font-medium text-graphite mb-[5px] block">First Name</label>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)}
                          className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-graphite mb-[5px] block">Last Name</label>
                        <input value={lastName} onChange={e => setLastName(e.target.value)}
                          className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                      <label className="text-[12px] font-medium text-graphite mb-[5px] block">Email</label>
                      <div className="flex items-center gap-[10px]">
                        <input readOnly value={profile?.email ?? ''}
                          className="flex-1 px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-slate bg-cream box-border" />
                        {profile?.isVerified && (
                          <span className="px-[10px] py-1 rounded-[5px] text-[11px] font-semibold bg-[#E3F4EA] text-[#1E7A3C] flex items-center gap-1 flex-shrink-0">
                            <Check size={10} /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="mb-4">
                      <label className="text-[12px] font-medium text-graphite mb-[5px] block">Phone Number</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +92 300 0000000"
                        className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                    </div>

                    {/* Address */}
                    <div className="mb-4">
                      <label className="text-[12px] font-medium text-graphite mb-[5px] block">Address</label>
                      <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address"
                        className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                    </div>

                    {/* Role + Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[22px]">
                      <div>
                        <label className="text-[12px] font-medium text-graphite mb-[5px] block">Role</label>
                        <input readOnly value={profile?.role ?? ''}
                          className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-slate bg-cream box-border capitalize" />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-graphite mb-[5px] block">Account Status</label>
                        <input readOnly value={profile?.status ?? ''}
                          className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none bg-cream box-border capitalize"
                          style={{ color: profile?.status === 'active' ? '#1E7A3C' : '#8C8A82' }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 py-[10px] bg-[#C13030] border-none rounded-lg text-[13px] font-semibold text-white flex items-center gap-2 ${saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                      >
                        {saving && <Loader2 size={13} className="animate-spin" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      {saved && <span className="text-[11px] text-success font-medium">Profile updated</span>}
                      {saveError && <span className="text-[11px] text-error font-medium">{saveError}</span>}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Email & Password section */}
            {active === 'security' && (
              <div className="bg-white border border-bone rounded-[10px] px-[26px] py-6">
                <p className="text-[16px] font-bold text-charcoal mb-[22px]">Email &amp; Password</p>

                <div className="mb-5">
                  <label className="text-[12px] font-medium text-graphite mb-[5px] block">Email</label>
                  <input readOnly value={profile?.email ?? ''}
                    className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-slate bg-cream box-border" />
                </div>

                <div className="h-px bg-[#F0EEE6] mb-5" />

                <p className="text-[13px] font-semibold text-charcoal mb-4">Change Password</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-4">
                  <div>
                    <label className="text-[12px] font-medium text-graphite mb-[5px] block">Current Password</label>
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
                    <label className="text-[12px] font-medium text-graphite mb-[5px] block">New Password</label>
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
                    className={`px-6 py-[10px] bg-[#C13030] border-none rounded-lg text-[13px] font-semibold text-white flex items-center gap-2 ${pwSaving || !currentPassword || !newPassword ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
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
            {active !== 'profile' && active !== 'security' && active !== 'notifications' && (
              <div className="bg-white border border-bone rounded-[10px] px-[26px] py-6">
                <div className="flex flex-col items-center justify-center py-[60px] text-center">
                  <div className="text-slate mb-[14px]">
                    {activeItem ? <activeItem.Icon size={40} /> : <Settings size={40} />}
                  </div>
                  <p className="text-[15px] font-semibold text-charcoal mb-[6px]">
                    {activeItem?.label ?? 'Settings'}
                  </p>
                  <p className="text-[13px] text-slate">
                    Settings for this section are coming soon.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Nav sidebar ── */}
          <div>
            <div className="bg-white border border-bone rounded-[10px] sticky top-[70px]" style={{ padding: 0 }}>
              {NAV.map((group, gi) => (
                <div key={group.group}>
                  {gi > 0 && <div className="h-px bg-[#F0EEE6]" />}
                  <div className="px-4 pt-[10px] pb-1">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${group.isDanger ? 'text-[#C0392B]' : 'text-slate'}`}>
                      {group.group}
                    </p>
                  </div>
                  {group.items.map(item => {
                    const isActive  = active === item.id;
                    const isDanger  = group.isDanger;
                    const activeColor = isDanger ? '#C0392B' : '#C13030';
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className="w-full flex items-center gap-[10px] px-4 py-[9px] cursor-pointer border-none text-left transition-colors duration-[120ms]"
                        style={{
                          borderLeft: `3px solid ${isActive ? activeColor : 'transparent'}`,
                          background: isActive ? (isDanger ? '#FDECEA' : '#FFF0F0') : 'transparent',
                          color: isActive ? activeColor : (isDanger ? '#C0392B' : '#4A4945'),
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAF9F5'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <item.Icon size={14} className="flex-shrink-0" />
                        <span className="text-[13px]" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
