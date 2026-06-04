import { Outlet, useNavigate, useLocation } from 'react-router-dom';

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

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NavBtn variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </NavBtn>
            <NavBtn variant="primary" onClick={() => navigate('/onboarding')}>
              Start Selling
            </NavBtn>
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
