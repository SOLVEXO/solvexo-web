import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Camera, Check, Loader2, UserCircle, Phone, MapPin } from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { Card, PageHeader, SkeletonBox, Badge, InfoRow } from '@/components/comman/ui';

const INPUT_CLS = 'w-full py-[11px] px-[14px] text-[13px] border border-bone rounded-[10px] outline-none text-charcoal bg-white box-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors';
const LABEL_CLS = 'text-[12px] font-medium text-graphite mb-[6px] block';

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

export function PersonalInfo() {
  const { profile, loading } = useGetProfile();
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

  const handleSave = () => {
    const name = `${firstName} ${lastName}`.trim();
    editProfile({ name, phone, address });
  };

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '..';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Account"
        title="Personal Information"
        description="Manage your name, contact details, and delivery address."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          {/* Identity card */}
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

                  <div className="h-px bg-[#F0EDE5] my-5" />

                  <SectionHeading icon={<Phone size={14} className="text-brand-orange" />} title="Contact & Delivery" />
                  <div className="mb-5">
                    <label className={LABEL_CLS}>Phone Number</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +92 300 0000000" className={INPUT_CLS} />
                  </div>
                  <div className="mb-6">
                    <label className={LABEL_CLS}><MapPin size={11} className="inline mr-1 -mt-[2px]" />Address</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" className={INPUT_CLS} />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-[#F0EDE5]">
                    <button
                      onClick={handleSave}
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
    </div>
  );
}
