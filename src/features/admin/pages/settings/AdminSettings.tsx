import { useEffect, useState } from 'react';
import {
  User, KeyRound,
  Camera, Check, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { useUpload } from '@/hooks/upload/useUpload';
import { PasteImageUrl, Button } from '@/components/comman/ui';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { SettingsCard, SettingsRow, SettingsSaveBar } from '@/components/comman/settings';

const inputCls = "w-full px-3 py-[9px] rounded-[10px] text-[13px] border border-bone bg-white text-charcoal outline-none box-border transition-colors placeholder:text-slate/70 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15";

const readonlyValueCls = 'text-[12.5px] font-semibold text-charcoal';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="text-[12px] font-semibold text-charcoal block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
/** The hub's "My Account" tab: who you are, then the password that signs you in.
 *  It used to carry its own Profile / Email & Password / Notifications strip on
 *  top of the hub rail — three more tabs inside a tab, and its Notifications was
 *  the very panel the rail already links to. One page, two cards, no sub-nav. */
export function AdminSettings({ embedded = false }: { embedded?: boolean } = {}) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');
  const [profileImage, setProfileImage] = useState('');

  const { profile, loading: profileLoading } = useGetProfile();
  const { execute: editProfile, loading: saving, error: saveError, success: saved } = useEditProfile();
  const { upload: uploadPhoto, uploadUrl: uploadPhotoUrl, uploading: photoUploading } = useUpload('public');

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

  // Nothing pending until a field actually differs from the loaded profile —
  // the same dirty rule the store-settings tabs use, so the shared save bar can
  // hide itself when there is nothing to save.
  const isDirty =
    !!profile &&
    (firstName !== (profile.name.split(' ')[0] ?? '') ||
      lastName !== profile.name.split(' ').slice(1).join(' ') ||
      phone !== (profile.phone ?? '') ||
      address !== (profile.address ?? '') ||
      profileImage !== (profile.profileImage ?? ''));

  const saveMsg = saved
    ? { ok: true, text: 'Profile updated' }
    : saveError
      ? { ok: false, text: saveError }
      : null;

  return (
    <div>
      {!embedded && <AdminPageHeader title="My Account" subtitle="Manage your admin profile and password." />}

      <div className={embedded ? 'px-4 lg:px-7 py-6' : 'px-4 sm:px-7 pt-5 pb-8'}>
        <div className="flex flex-col gap-5">
          <SettingsCard
            title="Profile"
            icon={<User size={14} />}
            description="Your own details as the panel shows them — avatar, name and contact."
          >
            {profileLoading ? null : (
              <>
                {/* Avatar */}
                <div className="mb-5 flex items-center gap-4">
                  <label className={`relative flex-shrink-0 ${photoUploading ? 'cursor-wait' : 'cursor-pointer'}`}>
                    <div className="size-[76px] rounded-full bg-brand-pale-orange text-brand-deep-orange text-[26px] font-bold flex items-center justify-center overflow-hidden">
                      {photoUploading
                        ? <Loader2 size={24} className="animate-spin" />
                        : profileImage
                          ? <img loading="lazy" decoding="async" src={profileImage} alt={profile?.name} className="w-full h-full object-cover" />
                          : (profile?.name?.slice(0, 2).toUpperCase() ?? 'AD')}
                    </div>
                    <span className="absolute bottom-0 right-0 size-6 rounded-full bg-brand-orange flex items-center justify-center">
                      <Camera size={12} className="text-white" />
                    </span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
                  </label>
                  <div>
                    <p className="mb-[3px] text-[13px] font-medium text-charcoal">Profile Photo</p>
                    <p className="mb-2 text-[11.5px] text-slate">JPG, PNG — max 2 MB</p>
                    <div className="flex items-center gap-3">
                      <label className={`inline-block px-[14px] py-[5px] bg-white border border-bone rounded-md text-[12px] text-graphite ${photoUploading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
                        {photoUploading ? 'Uploading…' : 'Upload Photo'}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
                      </label>
                      <PasteImageUrl upload={uploadPhotoUrl} onUploaded={setProfileImage} />
                    </div>
                  </div>
                </div>

                {/* Editable details */}
                <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                  <Field label="First Name">
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Last Name">
                    <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
                  </Field>
                </div>

                <Field label="Phone Number">
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +92 300 0000000" className={inputCls} />
                </Field>

                <Field label="Address">
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" className={inputCls} />
                </Field>

                {/* Read-only identity (was a pile of disabled inputs) */}
                <div className="-mx-5 mt-5 divide-y divide-fog border-y border-fog px-5">
                  <SettingsRow label="Email" description="The address you sign in with — it can't be changed here.">
                    <span className="flex items-center gap-2">
                      <span className={readonlyValueCls}>{profile?.email ?? '—'}</span>
                      {profile?.isVerified && (
                        <span className="flex items-center gap-1 rounded-md bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                          <Check size={10} /> Verified
                        </span>
                      )}
                    </span>
                  </SettingsRow>

                  <SettingsRow label="Role" description="Granted by your admin permissions.">
                    <span className={clsx(readonlyValueCls, 'capitalize')}>{profile?.role ?? '—'}</span>
                  </SettingsRow>

                  <SettingsRow label="Account status">
                    <span className={clsx('text-[12.5px] font-semibold capitalize', profile?.status === 'active' ? 'text-success' : 'text-slate')}>
                      {profile?.status ?? '—'}
                    </span>
                  </SettingsRow>
                </div>

                <SettingsSaveBar
                  isDirty={isDirty}
                  saving={saving}
                  onSave={handleSave}
                  saveMsg={saveMsg}
                />
              </>
            )}
          </SettingsCard>

          <SettingsCard
            title="Password"
            icon={<KeyRound size={14} />}
            description="Change the password you sign in with."
          >
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <Field label="Current Password">
                <div className="relative">
                  <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    className={`${inputCls} pr-[42px]`} />
                  <button type="button" onClick={() => setShowCurrentPassword(s => !s)}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors">
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="New Password">
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    aria-describedby="admin-new-password-rule"
                    className={`${inputCls} pr-[42px]`}
                  />
                  <button type="button" onClick={() => setShowNewPassword(s => !s)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p id="admin-new-password-rule" className="mt-1 text-[11.5px] text-slate">
                  At least 8 characters — mix letters, numbers and a symbol.
                </p>
              </Field>
            </div>

            {/* A one-off action, not a form save — it keeps its own disabled
                rule (both fields filled) and clears the fields on success, so
                it stays a plain button instead of the shared save bar. */}
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword}
                loading={pwSaving}
              >
                {pwSaving ? 'Updating…' : 'Update Password'}
              </Button>
              {pwSuccess && <span className="text-[12px] font-medium text-success">Password changed successfully</span>}
              {pwError && <span className="text-[12px] font-medium text-error">{pwError}</span>}
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
