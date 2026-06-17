import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart2,
  Settings, Sparkles, Bell, ChevronLeft, Monitor, Store,
} from 'lucide-react';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import { apiGetStoreById, type StoreData } from '@/api/commerce/store';

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

// ── Sidebar Nav ───────────────────────────────────────────────────────────────
interface NavItem { id: string; Icon: LucideIcon; label: string; path: string }

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Store',
    items: [
      { id: 'dashboard',      Icon: LayoutDashboard, label: 'Dashboard',     path: 'dashboard'  },
      { id: 'orders',         Icon: Package,         label: 'Orders',        path: 'orders'     },
      { id: 'products',       Icon: ShoppingBag,     label: 'Products',      path: 'products'   },
      { id: 'customers',      Icon: Users,           label: 'Customers',     path: 'customers'  },
      { id: 'pos',            Icon: Monitor,         label: 'POS Register',  path: '/seller/store/pos'  },
      { id: 'store-builder',  Icon: Store,           label: 'Store Builder', path: 'store-builder'  },

    ],
  },
  {
    group: 'Analytics',
    items: [
      { id: 'analytics',  Icon: BarChart2,        label: 'Analytics',  path: 'analytics'  },
    ],
  },
  {
    group: 'Manage',
    items: [
      { id: 'settings',   Icon: Settings,        label: 'Settings',   path: 'settings'   },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function StoreSidebar() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const { store, storeId, loading } = useStoreWorkspace();

  const isActive = (seg: string) =>
    seg.startsWith('/')
      ? pathname === seg || pathname.startsWith(seg + '/')
      : pathname === `/seller/store/${storeId}/${seg}`;

  const initials    = store?.name?.slice(0, 2).toUpperCase() ?? '..';
  const credits     = store?.aiCredits ?? 0;
  const maxCredits  = 1000;
  const pct         = Math.min(100, Math.round((credits / maxCredits) * 100));

  return (
    <aside className="w-[220px] bg-carbon flex flex-col shrink-0 h-screen overflow-y-auto">

      {/* Back to All Stores */}
      <button
        onClick={() => navigate('/seller/dashboard')}
        className="flex items-center gap-[7px] px-4 pt-[14px] pb-[10px] bg-transparent border-0 cursor-pointer text-slate text-[12px] font-medium transition-colors duration-150 text-left hover:text-brand-orange"
      >
        <ChevronLeft size={14} /> All Stores
      </button>

      <div className="h-px bg-dark-active mx-3" />

      {/* Store identity */}
      <div className="px-4 pt-[14px] pb-3">
        <div className="flex items-center gap-[10px]">
          <div className="size-9 rounded-[9px] shrink-0 bg-brand-orange overflow-hidden flex items-center justify-center text-[13px] font-bold text-white">
            {loading
              ? <div className="animate-pulse size-9 bg-charcoal rounded-[9px]" />
              : store?.logo
                ? <img src={store.logo} className="w-full h-full object-cover" alt="" />
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
                <p className="text-[12px] font-bold text-white leading-[1.3] truncate">
                  {store?.name ?? 'Loading…'}
                </p>
                <p className="text-[10px] text-slate leading-[1.3]">
                  {store?.plan ?? ''}{store?.slug ? ` · /${store.slug}` : ''}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-dark-active mx-3 mb-[6px]" />

      {/* Nav */}
      <nav className="flex-1 px-[10px] pt-1 overflow-y-auto">
        {NAV.map(section => (
          <div key={section.group} className="mb-1">
            <p className="text-[10px] font-semibold text-dark-label px-2 py-1 uppercase tracking-[0.08em] mb-0.5">
              {section.group}
            </p>
            {section.items.map(item => {
              const active = isActive(item.path);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(item.path.startsWith('/') ? item.path : `/seller/store/${storeId}/${item.path}`)}
                  className={clsx(
                    'flex items-center gap-[10px] py-[9px] px-[10px] rounded-md mb-0.5',
                    'cursor-pointer transition-colors duration-150',
                    active ? 'bg-dark-active' : 'bg-transparent hover:bg-[#1A1917]',
                  )}
                >
                  <item.Icon
                    size={15}
                    className={clsx(
                      'shrink-0',
                      active ? 'text-brand-orange opacity-100' : 'text-slate opacity-55',
                    )}
                  />
                  <span className={clsx(
                    'text-[13px] flex-1',
                    active ? 'font-semibold text-white' : 'font-normal text-slate',
                  )}>
                    {item.label}
                  </span>
                  {active && <div className="w-[3px] h-[14px] rounded-[2px] bg-brand-orange shrink-0" />}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: AI credits */}
      <div className="px-4 py-3 border-t border-dark-active">
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
    </aside>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
export interface StorePageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
}

export function StorePageHeader({ title, subtitle, actions }: StorePageHeaderProps) {
  return (
    <div className="bg-white border-b border-bone px-7 py-[14px] flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-[18px] font-bold text-carbon leading-[1.3]">{title}</h1>
        {subtitle && <p className="text-[12px] text-slate mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-[10px]">
        {actions}
        <div className="size-[34px] rounded-md bg-brand-pale-orange flex items-center justify-center cursor-pointer shrink-0">
          <Bell size={16} className="text-brand-orange" />
        </div>
      </div>
    </div>
  );
}

// ── Provider + Layout ─────────────────────────────────────────────────────────
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

export function StoreLayout() {
  return (
    <StoreWorkspaceProvider>
      <div className="flex h-screen bg-cream overflow-hidden">
        <StoreSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </StoreWorkspaceProvider>
  );
}
