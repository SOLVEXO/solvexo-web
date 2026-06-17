import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import {
  User, KeyRound, ShieldCheck, Bell, Store, Search, CreditCard,
  Package, Receipt, Users, Lock, DollarSign, ArrowDownToLine,
  FileText, Trash2, Camera, Settings, Check, type LucideIcon,
} from 'lucide-react';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
type SettingSection =
  | 'profile' | 'email-password' | 'two-factor' | 'notifications'
  | 'store-info' | 'domain-seo' | 'payment-methods' | 'shipping' | 'tax'
  | 'staff' | 'permissions'
  | 'plan-billing' | 'payouts' | 'invoices'
  | 'delete-account';

const SETTINGS_NAV: { group: string; isDanger?: boolean; items: { id: SettingSection; label: string; Icon: LucideIcon }[] }[] = [
  {
    group: 'Account',
    items: [
      { id: 'profile',         label: 'Profile',          Icon: User           },
      { id: 'email-password',  label: 'Email & Password', Icon: KeyRound       },
      { id: 'two-factor',      label: 'Two-Factor Auth',  Icon: ShieldCheck    },
      { id: 'notifications',   label: 'Notifications',    Icon: Bell           },
    ],
  },
  {
    group: 'Store',
    items: [
      { id: 'store-info',      label: 'Store Info',       Icon: Store          },
      { id: 'domain-seo',      label: 'Domain & SEO',     Icon: Search         },
      { id: 'payment-methods', label: 'Payment Methods',  Icon: CreditCard     },
      { id: 'shipping',        label: 'Shipping',         Icon: Package        },
      { id: 'tax',             label: 'Tax Settings',     Icon: Receipt        },
    ],
  },
  {
    group: 'Team',
    items: [
      { id: 'staff',           label: 'Staff Members',    Icon: Users          },
      { id: 'permissions',     label: 'Permissions',      Icon: Lock           },
    ],
  },
  {
    group: 'Billing',
    items: [
      { id: 'plan-billing',    label: 'Plan & Billing',   Icon: DollarSign     },
      { id: 'payouts',         label: 'Payouts',          Icon: ArrowDownToLine},
      { id: 'invoices',        label: 'Invoices',         Icon: FileText       },
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

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerSettings() {
  usePageTitle('Settings');
  const [active,    setActive]    = useState<SettingSection>('profile');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');

  const { profile, loading: profileLoading } = useGetProfile();

  useEffect(() => {
    if (!profile) return;
    const parts = profile.name.split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  const allItems = SETTINGS_NAV.flatMap(g => g.items);
  const activeItem = allItems.find(i => i.id === active);

  return (
    <>
      <SellerPageHeader
        title="Settings"
        subtitle="Manage your account and store preferences."
      />

      <div className="px-7 pt-5 pb-8">
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 260px' }}>

          {/* ── LEFT: Content ── */}
          <div>

            {/* Profile section */}
            {active === 'profile' && (
              <div className="bg-white border border-bone rounded-[10px] px-[26px] py-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <p className="text-base font-bold text-[#141413] mb-[22px]">Profile</p>

                {profileLoading ? (
                  <div>
                    {/* Avatar skeleton */}
                    <div className="flex items-center gap-4 mb-[22px]">
                      <div className="animate-pulse w-[76px] h-[76px] rounded-full bg-bone shrink-0" />
                      <div>
                        <div className="animate-pulse w-[110px] h-[13px] rounded bg-bone mb-2" />
                        <div className="animate-pulse w-20 h-[11px] rounded bg-bone" />
                      </div>
                    </div>
                    <div className="h-px bg-[#F0EEE6] mb-5" />
                    {[1,2,3,4].map(i => (
                      <div key={i} className="mb-4">
                        <div className="animate-pulse w-20 h-[11px] rounded bg-bone mb-[6px]" />
                        <div className="animate-pulse w-full h-[38px] rounded-lg bg-bone" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Photo */}
                    <div className="flex items-center gap-4 mb-[22px]">
                      <div className="relative shrink-0">
                        <div className="w-[76px] h-[76px] rounded-full bg-brand-pale-orange text-brand-deep-orange text-[26px] font-bold flex items-center justify-center overflow-hidden">
                          {profile?.profileImage
                            ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                            : (profile?.name?.slice(0, 2).toUpperCase() ?? 'ME')}
                        </div>
                        <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-orange border-none flex items-center justify-center cursor-pointer">
                          <Camera size={12} className="text-white" />
                        </button>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#141413] mb-[3px]">Profile Photo</p>
                        <p className="text-xs text-[#8C8A82] mb-2">JPG, PNG — max 2 MB</p>
                        <button className="px-[14px] py-[5px] bg-white border border-bone rounded-[7px] text-xs text-slate cursor-pointer">
                          Upload Photo
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-[#F0EEE6] mb-5" />

                    {/* Name */}
                    <div className="grid grid-cols-2 gap-[14px] mb-4">
                      <div>
                        <label className="text-[12px] font-medium text-slate mb-[5px] block">First Name</label>
                        <input
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-slate mb-[5px] block">Last Name</label>
                        <input
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border"
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
                          className="flex-1 px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#8C8A82] bg-[#FAF9F5] box-border"
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
                        className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border"
                      />
                    </div>

                    {/* Address */}
                    <div className="mb-4">
                      <label className="text-[12px] font-medium text-slate mb-[5px] block">Address</label>
                      <input
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Your address"
                        className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border"
                      />
                    </div>

                    {/* Role + Status — read only */}
                    <div className="grid grid-cols-2 gap-[14px] mb-[22px]">
                      <div>
                        <label className="text-[12px] font-medium text-slate mb-[5px] block">Role</label>
                        <input
                          readOnly
                          value={profile?.role ?? ''}
                          className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#8C8A82] bg-[#FAF9F5] capitalize box-border"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-slate mb-[5px] block">Account Status</label>
                        <input
                          readOnly
                          value={profile?.status ?? ''}
                          className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none bg-[#FAF9F5] capitalize box-border"
                          style={{ color: profile?.status === 'active' ? '#1E7A3C' : '#8C8A82' }}
                        />
                      </div>
                    </div>

                    <button className="px-6 py-[10px] bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white cursor-pointer">
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Other sections */}
            {active !== 'profile' && (
              <div className="bg-white border border-bone rounded-[10px] px-[26px] py-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col items-center justify-center py-[60px] text-center">
                  <div className="text-[#8C8A82] mb-[14px]">
                    {activeItem ? <activeItem.Icon size={40} /> : <Settings size={40} />}
                  </div>
                  <p className="text-[15px] font-semibold text-[#141413] mb-[6px]">
                    {activeItem?.label ?? 'Settings'}
                  </p>
                  <p className="text-[13px] text-[#8C8A82]">
                    {active === 'delete-account'
                      ? 'Permanently delete your account and all data.'
                      : 'Settings for this section are coming soon.'}
                  </p>
                  {active === 'delete-account' && (
                    <button className="mt-4 px-[18px] py-2 bg-[#FDECEA] border border-[#F5C6C2] rounded-lg text-[13px] font-semibold text-[#C0392B] cursor-pointer">
                      Delete My Account
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Nav sidebar ── */}
          <div>
            <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-0 sticky top-[70px]">
              {SETTINGS_NAV.map((group, gi) => (
                <div key={group.group}>
                  {gi > 0 && <div className="h-px bg-[#F0EEE6]" />}
                  <div className="px-4 pt-[10px] pb-1">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${group.isDanger ? 'text-[#C0392B]' : 'text-[#8C8A82]'}`}>
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
    </>
  );
}
