import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { TokenStorage } from '@/api/services/auth';
import { NotificationBell, ProfileAvatar } from '@/components/comman/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Marketplace', path: '/marketplace', orange: false },
  { label: 'Sellers',     path: '/sellers',     orange: true  },
  { label: 'Pricing',     path: '/pricing',     orange: true  },
  { label: 'Learn',       path: '/EducationMarketplace',   orange: false },
  { label: 'FAQ',         path: '/faq',         orange: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// SolvexoNavLogo
// ─────────────────────────────────────────────────────────────────────────────
function SolvexoNavLogo() {
  return (
    <div className="flex items-center gap-2 cursor-pointer">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#D97757" />
        <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
        <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7" />
        <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex items-center">
        <span className="text-[18px] font-bold text-carbon tracking-[-0.3px]">Solvex</span>
        <span className="text-[18px] font-bold text-brand-orange tracking-[-0.3px]">o</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NavBtn (desktop only)
// ─────────────────────────────────────────────────────────────────────────────
function NavBtn({
  children, onClick, variant = 'primary',
}: { children: string; onClick: () => void; variant?: 'primary' | 'ghost' }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center py-[6px] px-[14px] rounded-md border-0',
        'text-[13px] font-medium cursor-pointer transition-all duration-[180ms] whitespace-nowrap',
        variant === 'primary'
          ? 'bg-brand-orange text-white hover:opacity-[0.88]'
          : 'bg-transparent text-slate border border-bone hover:bg-cream',
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NavLinks — center navigation (desktop only)
// ─────────────────────────────────────────────────────────────────────────────
function NavLinks({ pathname }: { pathname: string }) {
  const navigate = useNavigate();
  return (
    <div className="hidden md:flex items-center gap-4 lg:gap-7">
      {NAV_ITEMS.map(item => {
        const isActive      = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
        const isHighlighted = item.orange || isActive;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={clsx(
              'text-[13px] font-medium bg-transparent border-none cursor-pointer',
              'transition-colors duration-150 pb-[2px] border-b-2',
              isHighlighted
                ? 'text-brand-orange border-brand-orange'
                : 'text-charcoal border-transparent hover:text-brand-orange',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NavActions — right side of navbar
// ─────────────────────────────────────────────────────────────────────────────
function NavActions() {
  const navigate = useNavigate();
  if (TokenStorage.isLoggedIn()) {
    return (
      <div className="flex items-center gap-3">
        <NotificationBell />
        <ProfileAvatar />
      </div>
    );
  }
  return (
    <>
      {/* Desktop: both buttons */}
      <div className="hidden md:flex items-center gap-[10px]">
        <NavBtn variant="ghost"   onClick={() => navigate('/login')}>Sign In</NavBtn>
        <NavBtn variant="primary" onClick={() => navigate('/onboard')}>Start Selling</NavBtn>
      </div>
      {/* Mobile: compact sign in only */}
      <button
        onClick={() => navigate('/login')}
        className="md:hidden text-[13px] font-medium text-charcoal border border-bone rounded-md px-3 py-[6px] bg-transparent cursor-pointer hover:bg-cream transition-colors"
      >
        Sign In
      </button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Navbar — top bar (no hamburger; mobile handled by BottomNav)
// ─────────────────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-bone h-16 flex items-center">
      <nav className="w-full flex items-center justify-between px-4 md:px-12">
        <div onClick={() => navigate('/')}><SolvexoNavLogo /></div>
        <NavLinks pathname={pathname} />
        <NavActions />
      </nav>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PublicLayout — marketing top navbar only; BottomNav is provided by BuyerLayout
// ─────────────────────────────────────────────────────────────────────────────
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main><Outlet /></main>
    </div>
  );
}
