import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { User, LayoutDashboard, LogOut } from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { TokenStorage } from '@/api/commerce/auth';
import { Badge } from '@/components/comman/ui';

// ── Nav items — "Sellers" and "Pricing" are ALWAYS orange (reference exact) ───
const NAV_ITEMS = [
  { label: 'Marketplace', path: '/marketplace', orange: false },
  { label: 'Sellers',     path: '/sellers',     orange: true  },
  { label: 'Pricing',     path: '/pricing',     orange: true  },
  { label: 'Learn',       path: '/education',   orange: false },
];

// ── Logo ──────────────────────────────────────────────────────────────────────
function SolvexoNavLogo() {
  return (
    <div className="flex items-center gap-2 cursor-pointer">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#D97757"/>
        <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
        <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7"/>
        <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="flex items-center">
        <span className="text-[18px] font-bold text-carbon tracking-[-0.3px]">Solvex</span>
        <span className="text-[18px] font-bold text-brand-orange tracking-[-0.3px]">o</span>
      </div>
    </div>
  );
}

// ── Nav button (matches exact padding from reference) ─────────────────────────
function NavBtn({
  children, onClick, variant = 'primary',
}: { children: string; onClick: () => void; variant?: 'primary' | 'ghost' }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center py-[6px] px-[14px] rounded-md',
        'text-[13px] font-medium cursor-pointer transition-all duration-[180ms] whitespace-nowrap border-0',
        variant === 'primary'
          ? 'bg-brand-orange text-white hover:opacity-[0.88]'
          : 'bg-transparent text-slate border border-bone hover:bg-cream',
      )}
    >
      {children}
    </button>
  );
}

// ── Profile Avatar ────────────────────────────────────────────────────────────
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={clsx(
          'size-9 rounded-full shrink-0 bg-brand-pale-orange',
          'flex items-center justify-center cursor-pointer overflow-hidden',
          'transition-colors duration-150 border-2',
          open ? 'border-brand-orange' : 'border-bone',
        )}
      >
        {loading ? (
          <div className="w-full h-full bg-bone" />
        ) : profile?.profileImage ? (
          <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] font-bold text-brand-deep-orange">{initials}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[100] bg-white border border-bone rounded-[14px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] min-w-[240px] overflow-hidden">

          {/* User info header */}
          <div className="px-4 pt-4 pb-3 border-b border-bone relative">
            <Badge color="orange" size="sm" dot className="absolute top-3 right-3 capitalize">
              {profile?.role ?? ''}
            </Badge>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-brand-pale-orange flex items-center justify-center overflow-hidden shrink-0 border border-[#EDEBE2]">
                {profile?.profileImage
                  ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                  : <span className="text-[13px] font-bold text-brand-deep-orange">{initials}</span>}
              </div>
              <div className="flex-1 min-w-0 pr-[70px]">
                <p className="text-[13px] font-bold text-[#141413] truncate leading-tight">{profile?.name ?? '—'}</p>
                <p className="text-[11px] text-[#8C8A82] truncate mt-[1px]">{profile?.email ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-[6px]">
            <button
              onClick={() => { navigate('/account/profile'); setOpen(false); }}
              className="w-full flex items-center gap-[10px] py-[8px] px-3 rounded-[8px] border-0 cursor-pointer bg-transparent text-[13px] text-charcoal text-left transition-colors hover:bg-cream"
            >
              <User size={14} className="text-slate shrink-0" />
              My Profile
            </button>

            {profile?.role !== 'user' && (
              <button
                onClick={() => { navigate(dashboardPath); setOpen(false); }}
                className="w-full flex items-center gap-[10px] py-[8px] px-3 rounded-[8px] border-0 cursor-pointer bg-transparent text-[13px] text-charcoal text-left transition-colors hover:bg-cream"
              >
                <LayoutDashboard size={14} className="text-slate shrink-0" />
                Go to Dashboard
              </button>
            )}
          </div>

          <div className="h-px bg-bone mx-3" />

          {/* Logout */}
          <div className="p-[6px]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-[10px] py-[8px] px-3 rounded-[8px] border-0 cursor-pointer bg-transparent text-[13px] text-[#C0392B] text-left transition-colors hover:bg-[#FFF0F0]"
            >
              <LogOut size={14} className="shrink-0" />
              Logout
            </button>
          </div>
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
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-bone h-16 flex items-center">
        <nav className="w-full flex items-center justify-between px-12">

          {/* Logo */}
          <div onClick={() => navigate('/')}>
            <SolvexoNavLogo />
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-7">
            {NAV_ITEMS.map(item => {
              const isCurrentPage = pathname === item.path ||
                (item.path !== '/' && pathname.startsWith(item.path));
              const isHighlighted = item.orange || isCurrentPage;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={clsx(
                    'text-[13px] font-medium bg-none border-none cursor-pointer',
                    'transition-colors duration-150 pb-[2px] border-b-2',
                    isHighlighted
                      ? 'text-brand-orange border-brand-orange'
                      : 'text-charcoal border-transparent',
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Buttons / Profile */}
          <div className="flex items-center gap-[10px]">
            {TokenStorage.isLoggedIn() ? (
              <ProfileAvatar />
            ) : (
              <>
                <NavBtn variant="ghost" onClick={() => navigate('/login')}>Sign In</NavBtn>
                <NavBtn variant="primary" onClick={() => navigate('/onboarding')}>Start Selling</NavBtn>
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
