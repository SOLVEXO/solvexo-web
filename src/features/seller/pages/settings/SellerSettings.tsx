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

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '24px 26px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, outline: 'none', fontFamily: poppins, color: '#2C2A28', background: '#fff', boxSizing: 'border-box' as const };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 5, display: 'block', fontFamily: poppins };

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

      <div style={{ padding: '20px 28px 32px', fontFamily: poppins }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>

          {/* ── LEFT: Content ── */}
          <div>

            {/* Profile section */}
            {active === 'profile' && (
              <div style={cardStyle}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#141413', marginBottom: 22 }}>Profile</p>

                {profileLoading ? (
                  <div>
                    {/* Avatar skeleton */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                      <div className="animate-pulse" style={{ width: 76, height: 76, borderRadius: '50%', background: '#E8E6DC', flexShrink: 0 }} />
                      <div>
                        <div className="animate-pulse" style={{ width: 110, height: 13, borderRadius: 4, background: '#E8E6DC', marginBottom: 8 }} />
                        <div className="animate-pulse" style={{ width: 80, height: 11, borderRadius: 4, background: '#E8E6DC' }} />
                      </div>
                    </div>
                    <div style={{ height: 1, background: '#F0EEE6', margin: '0 0 20px' }} />
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div className="animate-pulse" style={{ width: 80, height: 11, borderRadius: 4, background: '#E8E6DC', marginBottom: 6 }} />
                        <div className="animate-pulse" style={{ width: '100%', height: 38, borderRadius: 8, background: '#E8E6DC' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Photo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#FBECE4', color: '#B95A3A', fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {profile?.profileImage
                            ? <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (profile?.name?.slice(0, 2).toUpperCase() ?? 'ME')}
                        </div>
                        <button style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: '#D97757', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Camera size={12} style={{ color: '#fff' }} />
                        </button>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 3 }}>Profile Photo</p>
                        <p style={{ fontSize: 12, color: '#8C8A82', marginBottom: 8 }}>JPG, PNG — max 2 MB</p>
                        <button style={{ padding: '5px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                          Upload Photo
                        </button>
                      </div>
                    </div>

                    <div style={{ height: 1, background: '#F0EEE6', margin: '0 0 20px' }} />

                    {/* Name */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                      <div>
                        <label style={labelStyle}>First Name</label>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Last Name</label>
                        <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Email</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input readOnly value={profile?.email ?? ''}
                          style={{ ...inputStyle, flex: 1, background: '#FAF9F5', color: '#8C8A82' }} />
                        {profile?.isVerified && (
                          <span style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#E3F4EA', color: '#1E7A3C', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <Check size={10} /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Phone Number</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +92 300 0000000" style={inputStyle} />
                    </div>

                    {/* Address */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Address</label>
                      <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" style={inputStyle} />
                    </div>

                    {/* Role + Status — read only */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
                      <div>
                        <label style={labelStyle}>Role</label>
                        <input readOnly value={profile?.role ?? ''} style={{ ...inputStyle, background: '#FAF9F5', color: '#8C8A82', textTransform: 'capitalize' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Account Status</label>
                        <input readOnly value={profile?.status ?? ''} style={{ ...inputStyle, background: '#FAF9F5', color: profile?.status === 'active' ? '#1E7A3C' : '#8C8A82', textTransform: 'capitalize' }} />
                      </div>
                    </div>

                    <button style={{ padding: '10px 24px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Other sections */}
            {active !== 'profile' && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
                  <div style={{ color: '#8C8A82', marginBottom: 14 }}>
                    {activeItem ? <activeItem.Icon size={40} /> : <Settings size={40} />}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#141413', marginBottom: 6, fontFamily: poppins }}>
                    {activeItem?.label ?? 'Settings'}
                  </p>
                  <p style={{ fontSize: 13, color: '#8C8A82', fontFamily: poppins }}>
                    {active === 'delete-account'
                      ? 'Permanently delete your account and all data.'
                      : 'Settings for this section are coming soon.'}
                  </p>
                  {active === 'delete-account' && (
                    <button style={{ marginTop: 16, padding: '8px 18px', background: '#FDECEA', border: '1px solid #F5C6C2', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#C0392B', cursor: 'pointer', fontFamily: poppins }}>
                      Delete My Account
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Nav sidebar ── */}
          <div>
            <div style={{ ...cardStyle, padding: 0, position: 'sticky', top: 70 }}>
              {SETTINGS_NAV.map((group, gi) => (
                <div key={group.group}>
                  {gi > 0 && <div style={{ height: 1, background: '#F0EEE6' }} />}
                  <div style={{ padding: '10px 16px 4px' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: group.isDanger ? '#C0392B' : '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: poppins }}>
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
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 16px', cursor: 'pointer', border: 'none',
                          borderLeft: `3px solid ${isActive ? (isDanger ? '#C0392B' : '#D97757') : 'transparent'}`,
                          background: isActive ? (isDanger ? '#FDECEA' : '#FBECE4') : 'transparent',
                          color: isActive ? (isDanger ? '#C0392B' : '#B95A3A') : (isDanger ? '#C0392B' : '#4A4945'),
                          textAlign: 'left', fontFamily: poppins, transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAF9F5'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <item.Icon size={14} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
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