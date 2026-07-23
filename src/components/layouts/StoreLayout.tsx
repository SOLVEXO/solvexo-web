import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Outlet, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { TokenStorage, type AppRole } from '@/api/services/auth';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart2,
  Settings, Sparkles, ChevronLeft, Monitor, Store,
  ClipboardList, Megaphone, Star, Plug, Activity, Search, Wallet,
  Truck, MessageSquare, UserPlus, FolderTree, RefreshCw, Undo2, CreditCard,
  PanelLeftClose, PanelLeftOpen, AlertTriangle, XCircle, Clock,
} from 'lucide-react';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import { apiGetStoreById, type StoreData } from '@/api/services/store';
import { apiGetStorePlatformPlan, type StorePlatformSubscription } from '@/api/services/platformPlans';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { NotificationBell, AnnouncementBanner } from '@/components/comman/ui';
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
    group: 'Store',
    items: [
      { id: 'dashboard',     Icon: LayoutDashboard, label: 'Dashboard',     path: 'dashboard'    },
      { id: 'orders',        Icon: Package,         label: 'Orders',        path: 'orders'       },
      { id: 'returns',       Icon: Undo2,           label: 'Returns',       path: 'returns'      },
      { id: 'products',      Icon: ShoppingBag,     label: 'Products',      path: 'products'     },
      { id: 'customers',     Icon: Users,           label: 'Customers',     path: 'customer/list' },
      { id: 'pos',           Icon: Monitor,         label: 'POS Register',  path: 'pos'          },
      { id: 'store-builder', Icon: Store,           label: 'Store Builder', path: 'storebuilder' },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { id: 'analytics', Icon: BarChart2, label: 'Analytics', path: 'analytics' },
      { id: 'seo',        Icon: Search,   label: 'SEO',        path: 'seo'       },
      { id: 'ai',         Icon: Sparkles, label: 'AI Studio',  path: 'ai/studio' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { id: 'reviews',      Icon: Star,          label: 'Reviews',      path: 'reviews'      },
      { id: 'finance',      Icon: Wallet,        label: 'Finance',      path: 'finance'      },
      { id: 'inventory',    Icon: ClipboardList, label: 'Inventory',    path: 'inventory'    },
      { id: 'marketing',    Icon: Megaphone,     label: 'Marketing',    path: 'marketing'    },
      { id: 'loyalty',      Icon: Star,          label: 'Loyalty',      path: 'loyalty'      },
      { id: 'subscriptions',Icon: RefreshCw,     label: 'Subscriptions', path: 'subscriptions' },
      { id: 'integrations', Icon: Plug,           label: 'Integrations', path: 'integrations' },
      { id: 'followers',    Icon: UserPlus,       label: 'Followers',    path: 'followers'    },
      { id: 'activity',     Icon: Activity,       label: 'Activity Log', path: 'activity'     },
      { id: 'shipping',     Icon: Truck,          label: 'Shipping',     path: 'shipping'     },
      { id: 'messages',     Icon: MessageSquare,  label: 'Messages',     path: 'messages'     },
    ],
  },
  {
    group: 'Manage',
    items: [
      { id: 'categories', Icon: FolderTree, label: 'Categories', path: 'categories' },
      { id: 'plan-billing', Icon: CreditCard, label: 'Plan & Billing', path: 'plan-billing' },
      { id: 'settings',   Icon: Settings,   label: 'Settings',   path: 'settings'   },
    ],
  },
];

function buildPaletteItems(
  navigate: (path: string) => void,
  storeId: string,
  posEnabled: boolean,
): CommandPaletteItem[] {
  const result: CommandPaletteItem[] = [];
  NAV.forEach(section => {
    section.items.forEach(item => {
      if (item.id === 'pos' && !posEnabled) return; // exclude locked POS item from search
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
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const paletteItems = buildPaletteItems(navigate, storeId, posEnabled);

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
        // Mobile: fixed overlay, starts below ReferenceNav (44px)
        'fixed top-[44px] bottom-0 left-0 z-50 w-[220px]',
        // Desktop: static inline, full viewport height, width toggles
        'lg:static lg:z-auto lg:shrink-0 lg:h-[calc(100vh-44px)] lg:top-auto lg:bottom-auto',
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
                const goToItem = () => {
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
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    aria-disabled={isLockedPos || undefined}
                    className={clsx(
                      'flex items-center gap-[10px] py-[9px] px-[10px] rounded-md mb-0.5',
                      isLockedPos ? 'cursor-default' : 'cursor-pointer',
                      'transition-colors duration-150',
                      !open && 'lg:justify-center lg:px-0',
                      active ? 'bg-dark-active' : 'bg-transparent hover:bg-[#1A1917]',
                    )}
                  >
                    <item.Icon
                      size={15}
                      className={clsx(
                        'shrink-0',
                        isLockedPos ? 'text-slate opacity-35' : active ? 'text-brand-orange opacity-100' : 'text-slate opacity-55',
                      )}
                    />
                    {open && (
                      <>
                        <span className={clsx(
                          'text-[13px] flex-1',
                          isLockedPos ? 'font-normal text-slate opacity-40' : active ? 'font-semibold text-white' : 'font-normal text-slate',
                        )}>
                          {item.label}
                        </span>
                        {isLockedPos ? (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); navigate(`/seller/store/${storeId}/pos`); }}
                            className="text-[9px] font-bold uppercase tracking-[0.03em] px-[7px] py-[2px] rounded-full bg-brand-orange text-white border-none cursor-pointer shrink-0"
                          >
                            Upgrade
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
              <p className="text-[11px] text-dark-label">Solvexo Store</p>
            </div>
          </div>
        ) : (
          <div className="py-3 border-t border-dark-active flex justify-center shrink-0">
            <SolvexoIcon size={20} />
          </div>
        )}
      </aside>

      <CommandPalette items={paletteItems} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
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
      <button onClick={goToBilling} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-error bg-error-bg border-b border-[#FECACA] cursor-pointer">
        <AlertTriangle size={14} className="shrink-0" />
        Your plan payment failed (attempt {sub.failedPaymentAttempts}) — update your payment method to avoid losing access.
        <span className="underline font-semibold">Fix now</span>
      </button>
    );
  }
  if (sub.cancelAtPeriodEnd) {
    return (
      <button onClick={goToBilling} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-[#946200] bg-[#FDF2DA] border-b border-[#F5DFA6] cursor-pointer">
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
        <button onClick={goToBilling} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-[#1A5A8A] bg-[#E6F1FB] border-b border-[#BFDCF3] cursor-pointer">
          <Clock size={14} className="shrink-0" />
          Your trial ends in {daysLeft} day{daysLeft === 1 ? '' : 's'}.
          <span className="underline font-semibold">Add a payment method</span>
        </button>
      );
    }
  }
  return null;
}

// ── Layout ────────────────────────────────────────────────────────────────────
export function StoreLayout() {
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
    return <Navigate to="/login" replace />;
  }

  return (
    <StoreWorkspaceProvider>
      <StoreSidebarCtx.Provider value={{ toggle }}>
        <div className="flex h-[calc(100vh-44px)] bg-cream overflow-hidden">
          <StoreSidebar open={sidebarOpen} onToggle={toggle} onClose={onClose} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AnnouncementBanner audience="sellers" />
            <PlatformBillingBanner />
            <div className="flex-1 overflow-y-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </StoreSidebarCtx.Provider>
    </StoreWorkspaceProvider>
  );
}
