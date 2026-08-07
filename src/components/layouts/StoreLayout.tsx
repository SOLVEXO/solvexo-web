import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Outlet, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { TokenStorage, type AppRole } from '@/api/services/auth';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart2,
  Settings, Sparkles, ChevronLeft, Monitor, Store,
  ClipboardList, Megaphone, Star, Plug, Search, Wallet,
  Truck, MessageSquare, FolderTree, RefreshCw, Undo2, CreditCard,
  PanelLeftClose, PanelLeftOpen, AlertTriangle, AlertCircle, XCircle, Clock, LogOut, ShieldCheck, Lock,
} from 'lucide-react';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import { apiGetStoreById, type StoreData } from '@/api/services/store';
import { apiGetStorePlatformPlan, type StorePlatformSubscription } from '@/api/services/platformPlans';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useLogout } from '@/hooks/auth/useLogout';
import { NotificationBell, AnnouncementBanner, Modal, Button } from '@/components/comman/ui';
import { CommandPalette, type CommandPaletteItem } from '@/components/comman/ui/CommandPalette';

// ── Store Workspace Context ───────────────────────────────────────────────────
interface StoreWorkspaceValue {
  store:    StoreData | null;
  storeId:  string;
  loading:  boolean;
  error:    string;
  refetch:  () => void;
}

const StoreWorkspaceCtx = createContext<StoreWorkspaceValue | null>(null);

export function useStoreWorkspace(): StoreWorkspaceValue {
  const ctx = useContext(StoreWorkspaceCtx);
  if (!ctx) throw new Error('useStoreWorkspace must be inside StoreLayout');
  return ctx;
}

// ── Sidebar toggle context (for StorePageHeader on mobile) ────────────────────
const StoreSidebarCtx = createContext<{ toggle: () => void }>({ toggle: () => {} });

// ── Sidebar Nav ───────────────────────────────────────────────────────────────
interface NavItem { id: string; Icon: LucideIcon; label: string; path: string }

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard' },
      { id: 'analytics', Icon: BarChart2,       label: 'Analytics', path: 'analytics' },
    ],
  },
  {
    group: 'Sales',
    items: [
      { id: 'orders',   Icon: Package,  label: 'Orders',       path: 'orders'  },
      { id: 'returns',  Icon: Undo2,    label: 'Returns',       path: 'returns' },
      { id: 'pos',      Icon: Monitor,  label: 'POS Register',  path: 'pos'     },
      { id: 'shipping', Icon: Truck,    label: 'Shipping',      path: 'shipping' },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { id: 'products',      Icon: ShoppingBag,   label: 'Products',      path: 'products'     },
      { id: 'inventory',     Icon: ClipboardList, label: 'Inventory',     path: 'inventory'    },
      { id: 'categories',    Icon: FolderTree,    label: 'Categories',    path: 'categories'   },
      { id: 'store-builder', Icon: Store,         label: 'Store Builder', path: 'storebuilder' },
    ],
  },
  {
    group: 'Customers',
    items: [
      { id: 'customers', Icon: Users,          label: 'Customers', path: 'customer/list' },
      { id: 'reviews',   Icon: Star,           label: 'Reviews',   path: 'reviews'        },
      { id: 'messages',  Icon: MessageSquare,  label: 'Messages',  path: 'messages'       },
    ],
  },
  {
    group: 'Growth',
    items: [
      { id: 'marketing',     Icon: Megaphone, label: 'Marketing',     path: 'marketing'     },
      { id: 'loyalty',       Icon: Star,      label: 'Loyalty',       path: 'loyalty'       },
      { id: 'subscriptions', Icon: RefreshCw, label: 'Subscriptions', path: 'subscriptions' },
      { id: 'seo',           Icon: Search,    label: 'SEO',           path: 'seo'           },
      { id: 'ai',            Icon: Sparkles,  label: 'AI Studio',     path: 'ai/studio'     },
    ],
  },
  {
    group: 'Finance',
    items: [
      { id: 'finance',      Icon: Wallet,     label: 'Finance',        path: 'finance'      },
      { id: 'plan-billing', Icon: CreditCard, label: 'Plan & Billing', path: 'plan-billing' },
    ],
  },
  {
    group: 'Settings',
    items: [
      { id: 'integrations',  Icon: Plug,        label: 'Integrations',          path: 'integrations'  },
      { id: 'verification',  Icon: ShieldCheck, label: 'Business Verification', path: 'verification'  },
      { id: 'settings',      Icon: Settings,    label: 'Settings',              path: 'settings'      },
    ],
  },
];

// Available before the store's business verification is approved — every
// other nav item is locked (see spec: seller workspace must stay restricted
// until `verificationStatus === 'verified'`, not just gated on plan tools).
const ALLOWED_PRE_VERIFICATION = new Set(['dashboard', 'verification', 'settings']);

function isItemLocked(item: NavItem, verified: boolean, posEnabled: boolean): boolean {
  if (item.id === 'pos' && !posEnabled) return true;
  return !verified && !ALLOWED_PRE_VERIFICATION.has(item.id);
}

function buildPaletteItems(
  navigate: (path: string) => void,
  storeId: string,
  posEnabled: boolean,
  verified: boolean,
): CommandPaletteItem[] {
  const result: CommandPaletteItem[] = [];
  NAV.forEach(section => {
    section.items.forEach(item => {
      if (isItemLocked(item, verified, posEnabled)) return; // exclude locked items from search
      result.push({
        id:       item.id,
        label:    item.label,
        group:    section.group,
        icon:     item.Icon,
        onSelect: () => navigate(item.path.startsWith('/') ? item.path : `/seller/store/${storeId}/${item.path}`),
      });
    });
  });
  return result;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface StoreSidebarProps { open: boolean; onToggle: () => void; onClose: () => void; }

function StoreSidebar({ open, onToggle, onClose }: StoreSidebarProps) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const { store, storeId, loading } = useStoreWorkspace();
  const posEnabled = store?.enabledTools?.includes('pos_register') ?? false;
  // Gate on `store.status === 'active'`, NOT `verificationStatus === 'verified'`
  // directly — they're set together by every real approval path (see
  // AdminMarketplaceService.approveLead), but `status` is also the field a
  // pre-existing, already-approved store from before verification tracking
  // existed will have as `'active'` even if its `verificationStatus` was
  // never backfilled. Gating on the newer field alone would retroactively
  // lock out real, already-working sellers.
  const verified   = store?.status === 'active';
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const paletteItems = buildPaletteItems(navigate, storeId, posEnabled, verified);
  const logout = useLogout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const isActive = (seg: string) =>
    seg.startsWith('/')
      ? pathname === seg || pathname.startsWith(seg + '/')
      : pathname === `/seller/store/${storeId}/${seg}`;

  const initials   = store?.name?.slice(0, 2).toUpperCase() ?? '..';
  const credits    = store?.aiCredits ?? 0;
  const maxCredits = 1000;
  const pct        = Math.min(100, Math.round((credits / maxCredits) * 100));

  const toggleBtn = (
    <button
      onClick={onToggle}
      title={open ? 'Collapse sidebar' : 'Expand sidebar'}
      className="size-7 rounded-md flex items-center justify-center shrink-0 text-slate hover:text-white hover:bg-dark-active transition-colors cursor-pointer"
    >
      {open ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
    </button>
  );

  const paletteHint = (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      title="Search (Ctrl+K)"
      className={clsx(
        'flex items-center gap-1 rounded-md border border-dark-active text-slate hover:text-white hover:bg-dark-active transition-colors cursor-pointer shrink-0',
        open ? 'px-[7px] py-[3px] text-[10px] font-semibold' : 'size-7 justify-center text-[9px] font-semibold',
      )}
    >
      {open ? '⌘K' : 'K'}
    </button>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        'bg-carbon flex flex-col',
        'transition-all duration-300 ease-in-out',
        // Mobile: fixed overlay, starts below ReferenceNav (44px) — dev only,
        // that bar doesn't exist in production, so there's nothing to clear.
        'fixed bottom-0 left-0 z-50 w-[220px]', import.meta.env.DEV ? 'top-[44px]' : 'top-0',
        // Desktop: static inline, full viewport height, width toggles
        'lg:static lg:z-auto lg:shrink-0 lg:top-auto lg:bottom-auto', import.meta.env.DEV ? 'lg:h-[calc(100vh-44px)]' : 'lg:h-screen',
        open
          ? 'translate-x-0 lg:w-[220px]'
          : '-translate-x-full lg:translate-x-0 lg:w-[60px]',
      )}>

        {/* Back to stores + toggle */}
        <div className={clsx(
          'flex items-center pt-[14px] pb-[10px] shrink-0',
          open ? 'px-4 gap-2' : 'flex-col gap-[6px] px-[10px]',
        )}>
          {open ? (
            <>
              <button
                onClick={() => navigate('/seller/dashboard')}
                className="flex items-center gap-[7px] flex-1 bg-transparent border-0 cursor-pointer text-slate text-[12px] font-medium transition-colors duration-150 text-left hover:text-brand-orange"
              >
                <ChevronLeft size={14} /> All Stores
              </button>
              {paletteHint}
              {toggleBtn}
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/seller/dashboard')}
                title="All Stores"
                className="size-7 rounded-md flex items-center justify-center text-slate hover:text-brand-orange hover:bg-dark-active transition-colors cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
              {paletteHint}
              {toggleBtn}
            </>
          )}
        </div>

        <div className="h-px bg-dark-active mx-3" />

        {/* Store identity */}
        {open ? (
          <div className="px-4 pt-[14px] pb-3 shrink-0">
            <div className="flex items-center gap-[10px]">
              <div className="size-9 rounded-[9px] shrink-0 bg-brand-orange overflow-hidden flex items-center justify-center text-[13px] font-bold text-white">
                {loading
                  ? <div className="animate-pulse size-9 bg-charcoal rounded-[9px]" />
                  : store?.logo
                    ? <img loading="lazy" decoding="async" src={store.logo} className="w-full h-full object-cover" alt="" />
                    : initials}
              </div>
              <div className="flex-1 min-w-0">
                {loading ? (
                  <>
                    <div className="animate-pulse w-[90px] h-3 rounded-[3px] bg-charcoal mb-[5px]" />
                    <div className="animate-pulse w-[55px] h-[10px] rounded-[3px] bg-charcoal" />
                  </>
                ) : (
                  <>
                    <p className="text-[12px] font-bold text-white leading-[1.3] truncate">{store?.name ?? 'Loading…'}</p>
                    <p className="text-[10px] text-slate leading-[1.3]">
                      {store?.plan ?? ''}{store?.slug ? ` · /${store.slug}` : ''}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="size-8 rounded-[8px] shrink-0 bg-brand-orange overflow-hidden flex items-center justify-center text-[11px] font-bold text-white">
              {loading ? '…' : store?.logo ? <img loading="lazy" decoding="async" src={store.logo} className="w-full h-full object-cover" alt="" /> : initials}
            </div>
          </div>
        )}

        <div className="h-px bg-dark-active mx-3 mb-[6px]" />

        {/* Nav */}
        <nav className={clsx('flex-1 overflow-y-auto', open ? 'px-[10px] pt-1' : 'px-[10px] pt-2')}>
          {NAV.map(section => (
            <div key={section.group} className="mb-1">
              {open
                ? <p className="text-[10px] font-semibold text-dark-label px-2 py-1 uppercase tracking-[0.08em] mb-0.5">{section.group}</p>
                : <div className="h-px bg-dark-active mx-1 mb-2" />
              }
              {section.items.map(item => {
                const active = isActive(item.path);
                const isLockedPos = item.id === 'pos' && !posEnabled;
                const isLockedByVerification = !verified && !ALLOWED_PRE_VERIFICATION.has(item.id) && item.id !== 'pos';
                const locked = isLockedPos || isLockedByVerification;
                const goToItem = () => {
                  if (isLockedByVerification) { navigate(`/seller/store/${storeId}/verification`); return; }
                  if (isLockedPos) return;
                  navigate(item.path.startsWith('/') ? item.path : `/seller/store/${storeId}/${item.path}`);
                };
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={goToItem}
                    onKeyDown={e => { if (!isLockedPos && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); goToItem(); } }}
                    title={!open ? item.label : undefined}
                    aria-label={locked ? `${item.label} — locked` : item.label}
                    aria-current={active ? 'page' : undefined}
                    aria-disabled={isLockedPos || undefined}
                    className={clsx(
                      'flex items-center gap-[10px] py-[9px] px-[10px] rounded-md mb-0.5',
                      isLockedPos ? 'cursor-default' : 'cursor-pointer',
                      'transition-colors duration-150',
                      !open && 'lg:justify-center lg:px-0',
                      active ? 'bg-dark-active' : 'bg-transparent hover:bg-[#1a1917]',
                    )}
                  >
                    {isLockedByVerification
                      ? <Lock size={14} className="shrink-0 text-slate opacity-40" />
                      : <item.Icon
                          size={15}
                          className={clsx(
                            'shrink-0',
                            isLockedPos ? 'text-slate opacity-35' : active ? 'text-brand-orange opacity-100' : 'text-slate opacity-55',
                          )}
                        />}
                    {open && (
                      <>
                        <span className={clsx(
                          'text-[13px] flex-1',
                          locked ? 'font-normal text-slate opacity-40' : active ? 'font-semibold text-white' : 'font-normal text-slate',
                        )}>
                          {item.label}
                        </span>
                        {locked ? (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(isLockedByVerification ? `/seller/store/${storeId}/verification` : `/seller/store/${storeId}/pos`);
                            }}
                            className="text-[9px] font-bold uppercase tracking-[0.03em] px-[7px] py-[2px] rounded-full bg-brand-orange text-white border-none cursor-pointer shrink-0"
                          >
                            {isLockedByVerification ? 'Locked' : 'Upgrade'}
                          </button>
                        ) : active && (
                          <div className="w-[3px] h-[14px] rounded-[2px] bg-brand-orange shrink-0" />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: AI credits */}
        {open ? (
          <div className="px-4 py-3 border-t border-dark-active shrink-0">
            <div className="bg-dark-active rounded-md px-3 py-[10px] mb-[10px]">
              <div className="flex justify-between mb-[6px]">
                <div className="flex items-center gap-[5px]">
                  <Sparkles size={11} className="text-brand-orange" />
                  <span className="text-[11px] text-slate">AI Credits</span>
                </div>
                <span className="text-[11px] font-semibold text-brand-orange">{credits}/{maxCredits}</span>
              </div>
              <div className="h-1 bg-charcoal rounded-[2px]">
                <div
                  className="h-full bg-brand-orange rounded-[2px] transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SolvexoIcon size={20} />
              <p className="text-[11px] text-dark-label flex-1 min-w-0 truncate">Solvexo Store</p>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Logout"
                aria-label="Logout"
                className="size-7 rounded-md flex items-center justify-center shrink-0 text-slate hover:text-white hover:bg-dark-active transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-3 border-t border-dark-active flex flex-col items-center gap-2 shrink-0">
            <SolvexoIcon size={20} />
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              aria-label="Logout"
              className="size-7 rounded-md flex items-center justify-center shrink-0 text-slate hover:text-white hover:bg-dark-active transition-colors cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </aside>

      <CommandPalette items={paletteItems} open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {showLogoutConfirm && (
        <Modal title="Log out?" onClose={() => setShowLogoutConfirm(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut}>Cancel</Button>
            <Button variant="primary" onClick={handleLogout} loading={loggingOut}>Logout</Button>
          </>
        }>
          <p className="text-[13px] text-slate">You'll need to sign in again to access this store's dashboard.</p>
        </Modal>
      )}
    </>
  );
}

// ── Page Header (exported for store pages) ────────────────────────────────────
export interface StorePageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
}

export function StorePageHeader({ title, subtitle, actions }: StorePageHeaderProps) {
  const { toggle } = useContext(StoreSidebarCtx);
  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-bone px-4 md:px-7 py-[14px] flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label="Toggle sidebar"
          className="lg:hidden size-8 rounded-md border border-bone flex items-center justify-center text-slate hover:bg-cream transition-colors cursor-pointer shrink-0"
        >
          <PanelLeftOpen size={16} />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-carbon leading-[1.3]">{title}</h1>
          {subtitle && <p className="text-[12px] text-slate mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        {actions}
        <NotificationBell />
      </div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
function StoreWorkspaceProvider({ children }: { children: ReactNode }) {
  const { storeId = '' } = useParams<{ storeId: string }>();
  const [store,   setStore]   = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await apiGetStoreById(storeId);
        if (!cancelled) setStore(res.data);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load store.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [storeId, tick]);

  const refetch = () => setTick(t => t + 1);

  return (
    <StoreWorkspaceCtx.Provider value={{ store, storeId, loading, error, refetch }}>
      {children}
    </StoreWorkspaceCtx.Provider>
  );
}

// ── Seller business-verification status — workspace-wide so a not-yet-
// verified store's owner sees it on every page, not just their store list.
// Reads `verificationStatus` (never `store.status`, which is the separate
// marketplace-listing lifecycle field — see store.schema.ts). A verified
// store never renders anything here. ──
function StoreVerificationBanner() {
  const navigate = useNavigate();
  const { store, storeId } = useStoreWorkspace();
  // A store that's already marketplace-active (including a pre-verification-
  // tracking legacy approval) never shows a verification nag, even if
  // `verificationStatus` is stale/missing — `status` is the authoritative
  // "already approved" signal (see the `verified` comment in StoreSidebar).
  if (!store || store.status === 'active') return null;

  const goToVerification = () => navigate(`/seller/store/${storeId}/verification`);

  switch (store.verificationStatus) {
    case 'rejected':
      return (
        <button onClick={goToVerification} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-error bg-error-bg border-b border-error-border cursor-pointer text-center">
          <XCircle size={14} className="shrink-0" />
          Your business verification was rejected{store.rejectionReason ? `: ${store.rejectionReason}` : '.'}
          <span className="underline font-semibold shrink-0">Fix &amp; resubmit</span>
        </button>
      );
    case 'under_review':
      return (
        <div className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-[#1a5a8a] bg-info-bg border-b border-[#bfdcf3]">
          <Clock size={14} className="shrink-0" />
          Your store is under review by our team — you'll be notified as soon as a decision is made.
        </div>
      );
    case 'pending':
      return (
        <div className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-[#1a5a8a] bg-info-bg border-b border-[#bfdcf3]">
          <Clock size={14} className="shrink-0" />
          Your verification application has been submitted and is waiting to be reviewed.
        </div>
      );
    case 'not_started':
      return (
        <button onClick={goToVerification} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-[#946200] bg-warning-bg border-b border-[#f5dfa6] cursor-pointer text-center">
          <AlertTriangle size={14} className="shrink-0" />
          Your store isn't visible on the marketplace yet — complete business verification to submit it for review.
          <span className="underline font-semibold shrink-0">Complete verification</span>
        </button>
      );
    default:
      return null;
  }
}

// ── Platform-plan billing banner — past-due / scheduled-cancellation / trial-ending,
// surfaced workspace-wide (not just on the Billing Center page) so a seller can't
// miss it just by not visiting that one page. Same source of truth as StorePlanBilling. ──
function PlatformBillingBanner() {
  const navigate = useNavigate();
  const { storeId } = useStoreWorkspace();
  const [sub, setSub] = useState<StorePlatformSubscription | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    apiGetStorePlatformPlan(storeId)
      .then(res => { if (!cancelled) setSub(res.data); })
      .catch(() => {}); // non-critical — workspace still works without this banner
    return () => { cancelled = true; };
  }, [storeId]);

  if (!sub) return null;
  const goToBilling = () => navigate(`/seller/store/${storeId}/plan-billing`);

  if (sub.status === 'past_due') {
    return (
      <button onClick={goToBilling} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-error bg-error-bg border-b border-error-border cursor-pointer">
        <AlertTriangle size={14} className="shrink-0" />
        Your plan payment failed (attempt {sub.failedPaymentAttempts}) — update your payment method to avoid losing access.
        <span className="underline font-semibold">Fix now</span>
      </button>
    );
  }
  if (sub.cancelAtPeriodEnd) {
    return (
      <button onClick={goToBilling} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-[#946200] bg-[#fdf2da] border-b border-[#f5dfa6] cursor-pointer">
        <XCircle size={14} className="shrink-0" />
        Your plan is set to cancel on {new Date(sub.currentPeriodEnd).toDateString()}.
        <span className="underline font-semibold">Reactivate</span>
      </button>
    );
  }
  if (sub.trialEndsAt) {
    const daysLeft = Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    if (daysLeft <= 7) {
      return (
        <button onClick={goToBilling} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-[#1a5a8a] bg-info-bg border-b border-[#bfdcf3] cursor-pointer">
          <Clock size={14} className="shrink-0" />
          Your trial ends in {daysLeft} day{daysLeft === 1 ? '' : 's'}.
          <span className="underline font-semibold">Add a payment method</span>
        </button>
      );
    }
  }
  return null;
}

// ── Restricted-feature explainer — shown instead of the real page when a
// seller navigates directly (URL bar, bookmark, back button) to a nav item
// that's locked pre-verification, so the restriction is never just a
// silently-vanished sidebar entry. Mirrors the sidebar's own lock logic
// rather than a second source of truth. ──
const VERIFICATION_NOTICE_COPY: Record<StoreData['verificationStatus'], string> = {
  not_started: 'Complete business verification to unlock this feature.',
  pending: 'Your verification application has been submitted and is waiting to be reviewed — this unlocks as soon as it’s approved.',
  under_review: 'Your verification is under review by our team — this unlocks as soon as a decision is made.',
  verified: '', // never shown — this notice only renders for unverified stores
  rejected: 'Your last verification submission was rejected. Fix the issues and resubmit to unlock this feature.',
};

function SellerActivationNotice({ item, storeId, verificationStatus }: {
  item: NavItem; storeId: string; verificationStatus: StoreData['verificationStatus'];
}) {
  const navigate = useNavigate();
  const ctaLabel = verificationStatus === 'rejected' ? 'Fix & Resubmit'
    : verificationStatus === 'not_started' ? 'Start Verification'
    : 'View Verification Status';

  return (
    <div className="flex flex-col items-center text-center gap-4 px-6 py-16 max-w-[440px] mx-auto">
      <div className="size-14 rounded-full bg-brand-pale-orange flex items-center justify-center">
        <Lock size={22} className="text-brand-orange" />
      </div>
      <div>
        <p className="text-[16px] font-bold text-carbon mb-1.5">{item.label} is locked</p>
        <p className="text-[13px] text-slate leading-[1.6]">{VERIFICATION_NOTICE_COPY[verificationStatus] || VERIFICATION_NOTICE_COPY.not_started}</p>
      </div>
      <Button variant="primary" size="md" onClick={() => navigate(`/seller/store/${storeId}/verification`)}>
        {ctaLabel}
      </Button>
    </div>
  );
}

/** Finds the NAV item (if any) whose route matches `pathname`, excluding the
 *  always-available items — the single source of truth for "is this route
 *  locked", shared by the sidebar's own lock styling above. */
function findLockedNavItem(pathname: string, storeId: string): NavItem | null {
  for (const section of NAV) {
    for (const item of section.items) {
      if (ALLOWED_PRE_VERIFICATION.has(item.id) || item.id === 'pos') continue;
      const full = item.path.startsWith('/') ? item.path : `/seller/store/${storeId}/${item.path}`;
      if (pathname === full || pathname.startsWith(full + '/')) return item;
    }
  }
  return null;
}

// Shown instead of the real page when the store fetch itself failed (404,
// timeout, 500) — so a genuine backend failure is never indistinguishable
// from "this store just has no data yet" (every nested page would otherwise
// render its fields as blank/zero once `loading` flips false with `store`
// still null). Mirrors `MyStoreCard`'s error state on the top-level seller
// dashboard rather than inventing a second error-state design.
function StoreWorkspaceError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 px-6 py-16 max-w-[440px] mx-auto">
      <div className="size-14 rounded-full bg-error-bg flex items-center justify-center">
        <AlertCircle size={22} className="text-error" />
      </div>
      <div>
        <p className="text-[16px] font-bold text-carbon mb-1.5">Couldn't load your store</p>
        <p className="text-[13px] text-slate leading-[1.6]">{error}</p>
      </div>
      <Button variant="primary" size="md" onClick={onRetry}>Try Again</Button>
    </div>
  );
}

// Swaps in for `<Outlet/>` — renders the real nested route unless it's a
// verification-locked feature being reached by direct URL/bookmark/back
// button (nav-click already redirects to /verification before ever getting
// here, but a locked feature must never be reachable just by typing its URL),
// or the store fetch itself failed, in which case every nested page is
// blocked behind one shared retry state instead of each page needing its
// own error handling.
function GatedOutlet() {
  const { store, storeId, loading, error, refetch } = useStoreWorkspace();
  const { pathname } = useLocation();
  if (!loading && error) return <StoreWorkspaceError error={error} onRetry={refetch} />;
  // Same `status === 'active'` boundary as the sidebar — see the comment
  // on `verified` in StoreSidebar for why this isn't `verificationStatus`.
  if (!store || store.status === 'active') return <Outlet />;
  const lockedItem = findLockedNavItem(pathname, storeId);
  if (!lockedItem) return <Outlet />;
  return <SellerActivationNotice item={lockedItem} storeId={storeId} verificationStatus={store.verificationStatus} />;
}

// ── Layout ────────────────────────────────────────────────────────────────────
export function StoreLayout() {
  const { pathname: currentPath } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    let wasMobile = window.innerWidth < 1024;
    const onResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (wasMobile && !isMobile) setSidebarOpen(true);
      wasMobile = isMobile;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle  = () => setSidebarOpen(o => !o);
  const onClose = () => setSidebarOpen(false);

  const user = TokenStorage.getUser<{ role?: AppRole }>();
  if (!TokenStorage.isLoggedIn() || user?.role !== 'seller') {
    // Same `?redirect=` convention as SellerLayout's guard — a buyer/
    // logged-out visitor hitting a store-workspace URL directly (e.g. the
    // verification page) lands back on it after logging in, instead of a
    // bare /login that drops where they were headed.
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  return (
    <StoreWorkspaceProvider>
      <StoreSidebarCtx.Provider value={{ toggle }}>
        <div className={clsx('flex bg-cream overflow-hidden', import.meta.env.DEV ? 'h-[calc(100vh-44px)]' : 'h-screen')}>
          <StoreSidebar open={sidebarOpen} onToggle={toggle} onClose={onClose} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AnnouncementBanner audience="sellers" />
            <StoreVerificationBanner />
            <PlatformBillingBanner />
            <div className="flex-1 overflow-y-auto">
              <GatedOutlet />
            </div>
          </div>
        </div>
      </StoreSidebarCtx.Provider>
    </StoreWorkspaceProvider>
  );
}
