import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  User, LayoutDashboard, LogOut, ShoppingBag,
  ChevronRight, Shield, type LucideIcon,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { TokenStorage } from '@/api/services/auth';

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
        ? <img loading="lazy" decoding="async" src={profileImage} alt={name} className="w-full h-full object-cover" />
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
        ? <img loading="lazy" decoding="async" src={profileImage} alt={name} className="w-full h-full object-cover" />
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
export function ProfileAvatar() {
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
