import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, LogOut, Bell,
  ChevronRight, Shield, type LucideIcon,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { TokenStorage, apiLogout } from '@/api/services/auth';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import { useNotification } from '@/contexts/NotificationContext';
import { CopyIconButton } from './CopyIconButton';

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
  // A gradient ring (brand-orange → deep-orange, 2px, via padding + an inner
  // white gap) rather than a flat single-color border — gives the avatar its
  // own distinct, on-brand identity mark instead of reading as just another
  // bordered circle in the row next to Wishlist/Cart/Bell.
  return (
    <button
      onClick={onClick}
      className={clsx(
        'size-9 rounded-full shrink-0 p-[2px] bg-gradient-to-br from-brand-orange to-brand-deep-orange cursor-pointer transition-all duration-150',
        open ? 'scale-[0.96] shadow-[0_0_0_3px_rgba(217,119,87,0.18)]' : 'hover:scale-105',
      )}
    >
      <span className="flex items-center justify-center w-full h-full rounded-full bg-white overflow-hidden">
        {loading
          ? <div className="w-full h-full bg-bone animate-pulse rounded-full" />
          : profileImage
          ? <img loading="lazy" decoding="async" src={profileImage} alt={name} className="w-full h-full object-cover" />
          : <span className="text-[11px] font-bold text-brand-deep-orange">{initials}</span>
        }
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownHeader
// ─────────────────────────────────────────────────────────────────────────────
function DropdownHeader({
  profileImage, name, email, initials,
  hasBuyer, hasSeller, hasAdmin,
  unreadCount, onNotificationsClick,
}: {
  profileImage?: string | null; name?: string; email?: string; initials: string;
  hasBuyer: boolean; hasSeller: boolean; hasAdmin: boolean;
  unreadCount: number; onNotificationsClick: () => void;
}) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-bone">
      <div className="flex items-start gap-3">
        <AvatarImage profileImage={profileImage} name={name} initials={initials} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-carbon leading-tight truncate">{name ?? '—'}</p>
          <div className="flex items-center gap-1 mt-[2px] mb-[7px]">
            <p className="text-[11px] text-slate truncate min-w-0">{email ?? '—'}</p>
            {email && <CopyIconButton value={email} title="Copy email" size={11} className="text-slate hover:text-charcoal" />}
          </div>
          <div className="flex items-center gap-[5px] flex-wrap">
            {hasBuyer  && <RoleChip role="buyer"  />}
            {hasSeller && <RoleChip role="seller" />}
            {hasAdmin  && <RoleChip role="admin"  />}
          </div>
        </div>
        {/* Notifications now live inside the avatar dropdown instead of as
           its own standalone navbar icon — a plain link, not another nested
           dropdown/panel stacked underneath this one: clicking it closes
           this menu and goes straight to the notifications page. */}
        <button
          onClick={onNotificationsClick}
          aria-label="Notifications"
          className="relative shrink-0 -mt-0.5 -mr-0.5 w-9 h-9 rounded-full bg-brand-pale-orange/50 flex items-center justify-center cursor-pointer border-none transition-colors hover:bg-brand-pale-orange"
        >
          <Bell size={16} className="text-brand-orange" />
          {unreadCount > 0 && (
            <span className="absolute -top-[3px] -right-[3px] min-w-[15px] h-[15px] bg-[#c0392b] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px] border border-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
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
        danger ? 'hover:bg-[#fff0f0]' : 'hover:bg-cream',
      )}
    >
      <div className={clsx(
        'w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 transition-colors',
        danger ? 'bg-[#fff0f0] group-hover:bg-[#fecdd3]' : 'bg-bone group-hover:bg-[#edebe2]',
      )}>
        <Icon size={14} className={danger ? 'text-[#c0392b]' : 'text-slate'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-[13px] font-medium leading-tight', danger ? 'text-[#c0392b]' : 'text-charcoal')}>
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
  hasDash, isAdmin, onNavigate, onGoToStore, onLogout,
}: {
  hasDash: boolean; isAdmin: boolean;
  onNavigate: (path: string) => void; onGoToStore: () => void; onLogout: () => void;
}) {
  return (
    <>
      <div className="p-[6px]">
        {hasDash && (
          <MenuItem
            icon={isAdmin ? Shield : LayoutDashboard}
            label={isAdmin ? 'Admin Panel' : 'My Store'}
            sublabel={isAdmin ? 'Manage the platform' : 'Go to your store dashboard'}
            onClick={() => (isAdmin ? onNavigate('/admin') : onGoToStore())}
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

// Same business rule LoginPage's `SELLER_ONLY_LOGIN` / RegisterPage's
// `SELLER_ONLY_REGISTER` already encode, now made permanent here too: the
// apex-domain "Buyer" role chip only (My Account/My Orders were removed
// outright from `DropdownMenu` below, not just hidden — their destinations,
// the whole apex-domain Marketplace/Account/Cart/Checkout flow, were
// deleted from `router/index.tsx`; a real buyer now always shops a store's
// own themed subdomain instead, which has its own real account/cart/
// checkout via `ThemedRoute`). Unlike the old comment here, flipping this
// back to `true` would NOT "restore instantly with no other changes" any
// more for My Account/My Orders — only the role chip badge itself still
// works either way, since it doesn't navigate anywhere.
const SHOW_BUYER_FEATURES = false;

// ─────────────────────────────────────────────────────────────────────────────
// ProfileDropdown
// ─────────────────────────────────────────────────────────────────────────────
function ProfileDropdown({
  profile, initials, onNavigate, onGoToStore, onLogout, unreadCount, onNotificationsClick,
}: {
  profile: ReturnType<typeof useGetProfile>['profile'];
  initials: string;
  onNavigate: (path: string) => void;
  onGoToStore: () => void;
  onLogout: () => void;
  unreadCount: number;
  onNotificationsClick: () => void;
}) {
  const role      = profile?.role;
  const isSeller  = role === 'seller';
  const isAdmin   = role === 'admin';
  const hasBuyer  = SHOW_BUYER_FEATURES && (role === 'user' || isSeller || isAdmin);
  const hasSeller = isSeller;
  const hasAdmin  = isAdmin;
  const hasDash   = isSeller || isAdmin;

  return (
    <div className="relative w-[272px]">
      {/* Arrow indicator — a rotated square clipped by the panel's own border/bg,
          connecting the floating panel visually back to its trigger. */}
      <div className="absolute -top-[7px] right-[14px] w-3 h-3 bg-white border-t border-l border-bone rotate-45" />
      <div className="relative bg-white border border-bone rounded-[16px] overflow-hidden">
      <DropdownHeader
        profileImage={profile?.profileImage}
        name={profile?.name}
        email={profile?.email}
        initials={initials}
        hasBuyer={hasBuyer}
        hasSeller={hasSeller}
        hasAdmin={hasAdmin}
        unreadCount={unreadCount}
        onNotificationsClick={onNotificationsClick}
      />
      <DropdownMenu
        hasDash={hasDash}
        isAdmin={isAdmin}
        onNavigate={onNavigate}
        onGoToStore={onGoToStore}
        onLogout={onLogout}
      />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProfileAvatar
// ─────────────────────────────────────────────────────────────────────────────
const CLOSE_DELAY_MS = 150;
const PANEL_WIDTH = 272;
const PANEL_HEIGHT_ESTIMATE = 320;

export function ProfileAvatar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right?: number }>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { profile, loading } = useGetProfile();
  const { unreadCount } = useNotification();

  const clearCloseTimer = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const scheduleClose = () => { clearCloseTimer(); closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS); };

  // The dropdown used to be a plain absolutely-positioned child of the
  // trigger — any scrollable/clipped ancestor between it and the page root
  // (e.g. BuyerNavbar's icon row, which deliberately has `overflow-x-auto`
  // as a mobile safety net for the wishlist/cart/account icons) silently
  // clipped or trapped it, exactly like ActionMenu's dropdown would if it
  // weren't already portaled to <body>. Computing a fixed position against
  // the trigger's real screen coordinates and portaling out is the same
  // fix, applied here for the same reason.
  const calcPos = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const GAP = 10;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < PANEL_HEIGHT_ESTIMATE + GAP && rect.top > PANEL_HEIGHT_ESTIMATE;
    setPos({
      [openUpward ? 'bottom' : 'top']: openUpward ? window.innerHeight - rect.top + GAP : rect.bottom + GAP,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    calcPos();
    const onOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(t) ?? false;
      const insidePanel = panelRef.current?.contains(t) ?? false;
      if (!insideTrigger && !insidePanel) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onReflow = () => calcPos();
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [open, calcPos]);

  useEffect(() => () => clearCloseTimer(), []);

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '..';
  const handleNavigate = (path: string) => { navigate(path); setOpen(false); };
  // Same resolver login already uses (useLogin/useVerifyOtp/useSocialLogin) —
  // lands on THIS seller's own store dashboard (or /onboard if they have none
  // yet), never a generic "seller dashboard"/store-picker page. Keeps this
  // avatar's destination identical to where the seller already landed after
  // signing in, instead of drifting into its own hardcoded route.
  const handleGoToStore = async () => {
    setOpen(false);
    const destination = await resolveSellerDestinationRemote();
    navigate(destination);
  };
  const handleLogout   = async () => {
    try { await apiLogout(); } catch { /* best-effort — clear local session regardless */ }
    TokenStorage.clear();
    setOpen(false);
    navigate('/');
    window.location.reload();
  };
  // Straight to the notifications page — no nested dropdown/panel stacked
  // underneath this one. A seller's notification settings live inside
  // THEIR OWN store's workspace (/store/:storeId/account?tab=notifications,
  // same as SellerSettings variant="store") — never the orphaned cross-store
  // /seller/settings route, which nothing else in the app links to any more
  // (see "Store switcher moved into the top navbar" in CLAUDE.md). If we're
  // not already inside a store's own pages, resolve which store via the
  // same resolver login/"My Store" already use.
  const handleNotificationsClick = async () => {
    setOpen(false);
    const storeMatch = pathname.match(/^\/store\/([^/]+)/);
    if (storeMatch) {
      navigate(`/store/${storeMatch[1]}/account?tab=notifications`);
      return;
    }
    const role = profile?.role;
    if (role === 'seller') {
      const destination = await resolveSellerDestinationRemote();
      const idMatch = destination.match(/^\/store\/([^/]+)/);
      navigate(idMatch ? `/store/${idMatch[1]}/account?tab=notifications` : destination);
    } else if (role === 'admin') {
      navigate('/admin/settings?tab=notifications');
    } else {
      // `role === 'user'` (a buyer) on the apex domain — `/account/notifications`
      // no longer exists (see `SHOW_BUYER_FEATURES`'s own comment above: the
      // whole apex-domain Account/Marketplace/Cart/Checkout flow was removed
      // outright, since a real buyer always shops a store's own themed
      // subdomain now, which has its own real notifications inside that
      // store's `/account?tab=notifications`). Nothing meaningful to land a
      // bare apex-domain buyer on any more, so just go home.
      navigate('/');
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="relative"
        onMouseEnter={() => { clearCloseTimer(); setOpen(true); }}
        onMouseLeave={scheduleClose}
      >
        <AvatarTrigger
          open={open}
          onClick={() => setOpen(p => !p)}
          profileImage={profile?.profileImage}
          name={profile?.name}
          initials={initials}
          loading={loading}
        />
      </div>

      {createPortal(
        <div
          ref={panelRef}
          // Re-armed here too — the panel is now a DOM sibling of the
          // trigger (not a child of it), so without this, moving the mouse
          // from the avatar into the menu would read as "left" and close it
          // mid-hover.
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
          style={{ position: 'fixed', zIndex: 100, width: PANEL_WIDTH, ...pos }}
          className={clsx(
            'transition-all duration-200 origin-top-right',
            open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none',
          )}
        >
          <ProfileDropdown
            profile={profile}
            initials={initials}
            onNavigate={handleNavigate}
            onGoToStore={handleGoToStore}
            onLogout={handleLogout}
            unreadCount={unreadCount}
            onNotificationsClick={handleNotificationsClick}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
