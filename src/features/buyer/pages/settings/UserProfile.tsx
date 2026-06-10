import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ShoppingBag, Heart, MapPin, Phone, Mail,
  Camera, Check, Shield, LogOut, type LucideIcon,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { TokenStorage } from '@/api/auth';

// ── Styles ────────────────────────────────────────────────────────────────────
const FONT = "'Poppins', sans-serif";
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #E8E6DC',
  borderRadius: 12, padding: '24px 26px',
  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', fontSize: 13,
  border: '1px solid #E8E6DC', borderRadius: 9, outline: 'none',
  fontFamily: FONT, color: '#2C2A28', background: '#fff',
  boxSizing: 'border-box' as const,
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#4A4945',
  marginBottom: 6, display: 'block', fontFamily: FONT,
};

// ── Tab nav ───────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'orders' | 'wishlist';
const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'profile',  label: 'My Profile', Icon: User       },
  { id: 'orders',   label: 'My Orders',  Icon: ShoppingBag},
  { id: 'wishlist', label: 'Wishlist',   Icon: Heart      },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w, h, radius = 6 }: { w: number | string; h: number; radius?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: radius, background: '#E8E6DC' }}
    />
  );
}

// ── Placeholder tab ───────────────────────────────────────────────────────────
function PlaceholderTab({ Icon, label, desc }: { Icon: LucideIcon; label: string; desc: string }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 20px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FAF9F5', border: '1px solid #E8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={28} style={{ color: '#D97757', opacity: 0.6 }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#141413', marginBottom: 6, fontFamily: FONT }}>{label}</p>
      <p style={{ fontSize: 13, color: '#8C8A82', maxWidth: 320, fontFamily: FONT }}>{desc}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function UserProfile() {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState<Tab>('profile');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');

  const { profile, loading } = useGetProfile();

  useEffect(() => {
    if (!profile) return;
    const parts = profile.name.split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  const handleLogout = () => {
    TokenStorage.clear();
    navigate('/');
    window.location.reload();
  };

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '..';

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F5', fontFamily: FONT }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* ── Hero card ── */}
        <div style={{
          background: '#fff', border: '1px solid #E8E6DC', borderRadius: 14,
          padding: '28px 28px 24px', marginBottom: 20,
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#FBECE4', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#B95A3A',
                border: '3px solid #FBECE4',
              }}>
                {loading
                  ? <Skeleton w={80} h={80} radius={40} />
                  : profile?.profileImage
                    ? <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
              </div>
              <button style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 24, height: 24, borderRadius: '50%',
                background: '#D97757', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <Camera size={11} style={{ color: '#fff' }} />
              </button>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 180 }}>
              {loading ? (
                <>
                  <Skeleton w={160} h={18} /><div style={{ height: 8 }} />
                  <Skeleton w={200} h={12} /><div style={{ height: 8 }} />
                  <Skeleton w={60}  h={20} radius={10} />
                </>
              ) : (
                <>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: '#141413', margin: 0 }}>{profile?.name ?? '—'}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <Mail size={12} style={{ color: '#8C8A82' }} />
                    <span style={{ fontSize: 12, color: '#8C8A82' }}>{profile?.email ?? '—'}</span>
                    {profile?.isVerified && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '1px 8px', borderRadius: 10, background: '#E3F4EA', color: '#1E7A3C', fontSize: 10, fontWeight: 600 }}>
                        <Check size={9} /> Verified
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 12px', borderRadius: 20, background: '#FBECE4', color: '#B95A3A', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                      {profile?.role ?? ''}
                    </span>
                    <span style={{ padding: '3px 12px', borderRadius: 20, background: profile?.status === 'active' ? '#E3F4EA' : '#F0EEE6', color: profile?.status === 'active' ? '#1E7A3C' : '#8C8A82', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                      {profile?.status ?? ''}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 9,
                border: '1px solid #E8E6DC', background: '#fff',
                fontSize: 13, color: '#8C8A82', cursor: 'pointer',
                fontFamily: FONT, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C0392B'; e.currentTarget.style.color = '#C0392B'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E6DC'; e.currentTarget.style.color = '#8C8A82'; }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>

          {/* Quick info row */}
          {!loading && (
            <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 18, borderTop: '1px solid #F0EEE6', flexWrap: 'wrap' }}>
              {[
                { Icon: Phone,   value: profile?.phone   || '—', label: 'Phone'   },
                { Icon: MapPin,  value: profile?.address || '—', label: 'Address' },
                { Icon: Shield,  value: 'Secure Account',         label: 'Security'},
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <item.Icon size={13} style={{ color: '#D97757', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 10, color: '#8C8A82', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#2C2A28', margin: 0, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 10, padding: 5, border: '1px solid #E8E6DC', width: 'fit-content' }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 7, border: 'none',
                  background: active ? '#D97757' : 'transparent',
                  color: active ? '#fff' : '#8C8A82',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', fontFamily: FONT,
                  transition: 'all 0.15s',
                }}
              >
                <t.Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}

        {/* Profile form */}
        {tab === 'profile' && (
          <div style={card}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', marginBottom: 22 }}>Edit Profile</p>

            {loading ? (
              <div>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <Skeleton w={90} h={11} /><div style={{ height: 6 }} />
                    <Skeleton w="100%" h={40} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email Address</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input readOnly value={profile?.email ?? ''} style={{ ...inputStyle, flex: 1, background: '#FAF9F5', color: '#8C8A82' }} />
                    {profile?.isVerified && (
                      <span style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: '#E3F4EA', color: '#1E7A3C', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <Check size={10} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +92 300 0000000" style={inputStyle} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Address</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" style={inputStyle} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button style={{ padding: '10px 28px', background: '#D97757', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: FONT }}>
                    Save Changes
                  </button>
                  <p style={{ fontSize: 11, color: '#8C8A82' }}>Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}</p>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <PlaceholderTab
            Icon={ShoppingBag}
            label="No orders yet"
            desc="Your order history will appear here once you make your first purchase on the marketplace."
          />
        )}

        {tab === 'wishlist' && (
          <PlaceholderTab
            Icon={Heart}
            label="Wishlist is empty"
            desc="Save products you love to your wishlist and find them here anytime."
          />
        )}

      </div>
    </div>
  );
}
