import { useRef, useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  User, LayoutDashboard, LogOut, ShoppingBag,
  ChevronRight, Shield, type LucideIcon,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { TokenStorage } from '@/api/commerce/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Marketplace', path: '/marketplace', orange: false },
  { label: 'Sellers',     path: '/sellers',     orange: true  },
  { label: 'Pricing',     path: '/pricing',     orange: true  },
  { label: 'Learn',       path: '/education',   orange: false },
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
// RoleChip
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_CHIP_CONFIG = {
  buyer:  { label: 'Buyer',  bg: '#EEF7FF', text: '#1A65A8', dot: '#3B82F6' },
  seller: { label: 'Seller', bg: '#FFF4DC', text: '#B36200', dot: '#D97757' },
  admin:  { label: 'Admin',  bg: '#F3F0FF', text: '#5B3BCC', dot: '#7C3AED' },
} as const;

function RoleChip({ role }: { role: keyof typeof ROLE_CHIP_CONFIG }) {
  const cfg = ROLE_CHIP_CONFIG[role];
  return (
    <span
      className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-full text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AvatarImage
// ─────────────────────────────────────────────────────────────────────────────
function AvatarImage({
  profileImage, name, initials, size,
}: { profileImage?: string | null; name?: string; initials: string; size: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-9 h-9 text-[11px]' : 'w-11 h-11 text-[15px]';
  return (
    <div className={clsx(
      dim,
      'rounded-full bg-brand-pale-orange flex items-center justify-center overflow-hidden shrink-0 border-2 border-bone',
    )}>
      {profileImage
        ? <img src={profileImage} alt={name} className="w-full h-full object-cover" />
        : <span className="font-bold text-brand-deep-orange">{initials}</span>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AvatarTrigger
// ─────────────────────────────────────────────────────────────────────────────
function AvatarTrigger({
  open, onClick, profileImage, name, initials, loading,
}: {
  open: boolean; onClick: () => void;
  profileImage?: string | null; name?: string; initials: string; loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'size-9 rounded-full shrink-0 bg-brand-pale-orange overflow-hidden',
        'flex items-center justify-center cursor-pointer border-2 transition-all duration-150',
        open
          ? 'border-brand-orange scale-[0.96]'
          : 'border-bone hover:border-brand-orange/50',
      )}
    >
      {loading
        ? <div className="w-full h-full bg-bone animate-pulse" />
        : profileImage
        ? <img src={profileImage} alt={name} className="w-full h-full object-cover" />
        : <span className="text-[11px] font-bold text-brand-deep-orange">{initials}</span>
      }
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownHeader
// ─────────────────────────────────────────────────────────────────────────────
function DropdownHeader({
  profileImage, name, email, initials,
  hasBuyer, hasSeller, hasAdmin,
}: {
  profileImage?: string | null; name?: string; email?: string; initials: string;
  hasBuyer: boolean; hasSeller: boolean; hasAdmin: boolean;
}) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-bone">
      <div className="flex items-start gap-3">
        <AvatarImage profileImage={profileImage} name={name} initials={initials} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-carbon leading-tight truncate">{name ?? '—'}</p>
          <p className="text-[11px] text-slate truncate mt-[2px] mb-[7px]">{email ?? '—'}</p>
          <div className="flex items-center gap-[5px] flex-wrap">
            {hasBuyer  && <RoleChip role="buyer"  />}
            {hasSeller && <RoleChip role="seller" />}
            {hasAdmin  && <RoleChip role="admin"  />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MenuItem
// ─────────────────────────────────────────────────────────────────────────────
function MenuItem({
  icon: Icon, label, sublabel, onClick, danger = false,
}: {
  icon: LucideIcon; label: string; sublabel?: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-[10px] py-[9px] px-3 rounded-[9px] border-0 cursor-pointer text-left group',
        'transition-colors',
        danger ? 'hover:bg-[#FFF0F0]' : 'hover:bg-cream',
      )}
    >
      <div className={clsx(
        'w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 transition-colors',
        danger ? 'bg-[#FFF0F0] group-hover:bg-[#FECDD3]' : 'bg-bone group-hover:bg-[#EDEBE2]',
      )}>
        <Icon size={14} className={danger ? 'text-[#C0392B]' : 'text-slate'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-[13px] font-medium leading-tight', danger ? 'text-[#C0392B]' : 'text-charcoal')}>
          {label}
        </p>
        {sublabel && <p className="text-[10px] text-slate mt-[1px]">{sublabel}</p>}
      </div>
      {!danger && <ChevronRight size={12} className="text-bone shrink-0 group-hover:text-slate transition-colors" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownMenu
// ─────────────────────────────────────────────────────────────────────────────
function DropdownMenu({
  hasBuyer, hasDash, isAdmin, onNavigate, onLogout,
}: {
  hasBuyer: boolean; hasDash: boolean; isAdmin: boolean;
  onNavigate: (path: string) => void; onLogout: () => void;
}) {
  return (
    <>
      <div className="p-[6px]">
        {hasBuyer && (
          <MenuItem
            icon={User}
            label="My Profile"
            sublabel="Account settings"
            onClick={() => onNavigate('/account/profile')}
          />
        )}
        {hasBuyer && (
          <MenuItem
            icon={ShoppingBag}
            label="My Orders"
            sublabel="Track your purchases"
            onClick={() => onNavigate('/account/profile?tab=orders')}
          />
        )}
        {hasDash && (
          <MenuItem
            icon={isAdmin ? Shield : LayoutDashboard}
            label={isAdmin ? 'Admin Panel' : 'Seller Dashboard'}
            sublabel={isAdmin ? 'Manage the platform' : 'Manage your store'}
            onClick={() => onNavigate(isAdmin ? '/admin' : '/seller/dashboard')}
          />
        )}
      </div>
      <div className="h-px bg-bone mx-3" />
      <div className="p-[6px]">
        <MenuItem icon={LogOut} label="Logout" onClick={onLogout} danger />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProfileDropdown
// ─────────────────────────────────────────────────────────────────────────────
function ProfileDropdown({
  profile, initials, onNavigate, onLogout,
}: {
  profile: ReturnType<typeof useGetProfile>['profile'];
  initials: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) {
  const role      = profile?.role;
  const isSeller  = role === 'seller';
  const isAdmin   = role === 'admin';
  const hasBuyer  = role === 'user' || isSeller || isAdmin;
  const hasSeller = isSeller;
  const hasAdmin  = isAdmin;
  const hasDash   = isSeller || isAdmin;

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-[100] bg-white border border-bone rounded-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.13)] w-[272px] overflow-hidden">
      <DropdownHeader
        profileImage={profile?.profileImage}
        name={profile?.name}
        email={profile?.email}
        initials={initials}
        hasBuyer={hasBuyer}
        hasSeller={hasSeller}
        hasAdmin={hasAdmin}
      />
      <DropdownMenu
        hasBuyer={hasBuyer}
        hasDash={hasDash}
        isAdmin={isAdmin}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProfileAvatar
// ─────────────────────────────────────────────────────────────────────────────
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
  const handleNavigate = (path: string) => { navigate(path); setOpen(false); };
  const handleLogout   = () => { TokenStorage.clear(); setOpen(false); navigate('/'); window.location.reload(); };

  return (
    <div ref={ref} className="relative">
      <AvatarTrigger
        open={open}
        onClick={() => setOpen(p => !p)}
        profileImage={profile?.profileImage}
        name={profile?.name}
        initials={initials}
        loading={loading}
      />
      {open && (
        <ProfileDropdown
          profile={profile}
          initials={initials}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NavActions — right side of navbar
// ─────────────────────────────────────────────────────────────────────────────
function NavActions() {
  const navigate = useNavigate();
  if (TokenStorage.isLoggedIn()) return <ProfileAvatar />;
  return (
    <>
      {/* Desktop: both buttons */}
      <div className="hidden md:flex items-center gap-[10px]">
        <NavBtn variant="ghost"   onClick={() => navigate('/login')}>Sign In</NavBtn>
        <NavBtn variant="primary" onClick={() => navigate('/onboarding')}>Start Selling</NavBtn>
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
