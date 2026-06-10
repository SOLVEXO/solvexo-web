import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { TokenStorage } from '@/api/commerce/auth';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  orange: '#D97757', deepOrange: '#B95A3A',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
};
const FONT = "'Poppins', sans-serif";

// ── Solvexo Logo Icon (exact SVG from reference) ─────────────────────────────
function SolvexoNavLogo() {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#D97757"/>
        <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
        <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7"/>
        <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: C.carbon, letterSpacing: '-0.3px' }}>
          Solvex
        </span>
        <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: C.orange, letterSpacing: '-0.3px' }}>
          o
        </span>
      </div>
    </div>
  );
}

// ── Nav items — exact from reference source ───────────────────────────────────
// "Sellers" and "Pricing" are ALWAYS orange (reference hardcodes this)
const NAV_ITEMS = [
  { label: 'Marketplace', path: '/marketplace', orange: false },
  { label: 'Sellers',     path: '/sellers',     orange: true  },
  { label: 'Pricing',     path: '/pricing',     orange: true  },
  { label: 'Learn',       path: '/education',   orange: false },
];

// ── Button components matching reference exactly ──────────────────────────────
function NavBtn({
  children, onClick, variant = 'primary',
}: { children: string; onClick: () => void; variant?: 'primary' | 'ghost' }) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    fontFamily: FONT, cursor: 'pointer', transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
  };
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.orange, color: C.white, border: 'none' },
    ghost:   { background: 'transparent', color: C.slate, border: `1px solid ${C.bone}` },
  };
  return (
    <button style={{ ...base, ...styles[variant] }} onClick={onClick}>
      {children}
    </button>
  );
}

// ── Profile Avatar (shown when logged in) ─────────────────────────────────────
function ProfileAvatar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { profile, loading } = useGetProfile();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '..';

  const dashboardPath =
    profile?.role === 'seller' ? '/seller/dashboard' :
    profile?.role === 'admin'  ? '/admin'            : '/marketplace';

  const handleLogout = () => {
    TokenStorage.clear();
    setOpen(false);
    navigate('/');
    window.location.reload();
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: '#FBECE4', border: `2px solid ${open ? C.orange : C.bone}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.15s',
        }}
      >
        {loading ? (
          <div style={{ width: '100%', height: '100%', background: '#E8E6DC' }} />
        ) : profile?.profileImage ? (
          <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#B95A3A', fontFamily: FONT }}>{initials}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 100,
          background: C.white, border: `1px solid ${C.bone}`, borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)', minWidth: 220, padding: 6,
          fontFamily: FONT,
        }}>
          {/* User info */}
          <div style={{ padding: '10px 12px 12px', borderBottom: `1px solid ${C.bone}`, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#FBECE4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {profile?.profileImage
                  ? <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 12, fontWeight: 700, color: '#B95A3A' }}>{initials}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.carbon, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.name ?? '—'}
                </p>
                <p style={{ fontSize: 11, color: C.slate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.email ?? '—'}
                </p>
              </div>
            </div>
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: 4,
              background: '#FBECE4', color: '#B95A3A',
              fontSize: 10, fontWeight: 600, textTransform: 'capitalize',
            }}>
              {profile?.role ?? ''}
            </span>
          </div>

          {/* My Profile — always visible */}
          <button
            onClick={() => { navigate('/account/profile'); setOpen(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 13, color: C.charcoal,
              fontFamily: FONT, textAlign: 'left', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            My Profile
          </button>

          {/* Dashboard — only for seller/admin */}
          {profile?.role !== 'user' && (
            <button
              onClick={() => { navigate(dashboardPath); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', fontSize: 13, color: C.charcoal,
                fontFamily: FONT, textAlign: 'left', transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Go to Dashboard
            </button>
          )}

          <div style={{ height: 1, background: C.bone, margin: '4px 6px' }} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 13, color: '#C0392B',
              fontFamily: FONT, textAlign: 'left', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FDECEA')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export function PublicLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: C.white }}>
      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: C.white, borderBottom: `1px solid ${C.bone}`,
        height: 64, display: 'flex', alignItems: 'center',
      }}>
        <nav style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 48px',
        }}>

          {/* Logo */}
          <div onClick={() => navigate('/')}>
            <SolvexoNavLogo />
          </div>

          {/* Nav links — "Sellers" and "Pricing" always orange (reference exact) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {NAV_ITEMS.map(item => {
              const isCurrentPage = pathname === item.path ||
                (item.path !== '/' && pathname.startsWith(item.path));
              const color = item.orange || isCurrentPage ? C.orange : C.charcoal;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  style={{
                    fontFamily: FONT, fontSize: 13, fontWeight: 500,
                    color: color, background: 'none', border: 'none',
                    cursor: 'pointer', transition: 'color 0.15s',
                    borderBottom: item.orange || isCurrentPage
                      ? `2px solid ${C.orange}`
                      : '2px solid transparent',
                    paddingBottom: 2,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Buttons / Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {TokenStorage.isLoggedIn() ? (
              <ProfileAvatar />
            ) : (
              <>
                <NavBtn variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </NavBtn>
                <NavBtn variant="primary" onClick={() => navigate('/onboarding')}>
                  Start Selling
                </NavBtn>
              </>
            )}
          </div>

        </nav>
      </header>

      {/* Page content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
