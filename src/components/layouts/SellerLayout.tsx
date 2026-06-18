import { type ReactNode, useState, useRef, useEffect } from 'react';
import { ActiveStoreProvider, useActiveStore } from '@/contexts/ActiveStoreContext';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, CornerUpLeft,
  Store, BarChart2, Search, Sparkles, Users, Star, RefreshCw,
  Megaphone, Wallet, ClipboardList, Truck, MessageSquare, Plug, Activity,
  Settings, FolderOpen, Bell, ChevronDown, List, Plus,
} from 'lucide-react';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NavItem {
  id:    string;
  Icon:  LucideIcon;
  label: string;
  path:  string;
}
interface NavDropdown {
  id:       string;
  Icon:     LucideIcon;
  label:    string;
  children: NavItem[];
}
type NavEntry = NavItem | NavDropdown;
interface NavSection {
  label: string;
  items: NavEntry[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard',   Icon: LayoutDashboard, label: 'Dashboard',      path: '/seller/dashboard'        },
      {
        id: 'my-store', Icon: Store, label: 'My Store',
        children: [
          { id: 'store-list',    Icon: List,   label: 'Store List',    path: '/seller/stores' },
          { id: 'store-builder', Icon: Store,  label: 'Store Builder', path: '/seller/store'  },
        ],
      },
    ],
  },
  {
    label: 'Customers',
    items: [
      { id: 'loyalty',       Icon: Star,       label: 'Loyalty',    path: '/seller/loyalty'       },
      { id: 'subscriptions', Icon: RefreshCw,  label: 'Subscriptions',path: '/seller/subscriptions' },
      { id: 'marketing',     Icon: Megaphone,  label: 'Marketing',    path: '/seller/marketing'     },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'inventory',    Icon: ClipboardList, label: 'Inventory',     path: '/seller/inventory'     },
      { id: 'shipping',     Icon: Truck,         label: 'Shipping',      path: '/seller/shipping'      },
      { id: 'messages',     Icon: MessageSquare, label: 'Messages',      path: '/seller/messages'      },
      { id: 'integrations', Icon: Plug,          label: 'Integrations',  path: '/seller/integrations'  },
      { id: 'activity',     Icon: Activity,      label: 'Activity Log',  path: '/seller/activity'      },
      { id: 'settings',     Icon: Settings,      label: 'Settings',      path: '/seller/settings'      },
      { id: 'categories',   Icon: FolderOpen,    label: 'Categories',    path: '/seller/categories'    },
    ],
  },
];

// ── Store Switcher ────────────────────────────────────────────────────────────
function SidebarStoreSwitcher() {
  const navigate = useNavigate();
  const { stores, loading } = useActiveStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayName = loading ? 'Loading…' : 'My Stores';
  const displaySub  = loading ? '' : `${stores.length} store${stores.length !== 1 ? 's' : ''}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={clsx(
          'w-full rounded-md py-2 px-[10px] flex items-center gap-2',
          'cursor-pointer border-0 transition-colors duration-150',
          open ? 'bg-charcoal' : 'bg-dark-active hover:bg-charcoal',
        )}
      >
        <div className="size-6 rounded-sm bg-brand-orange flex items-center justify-center shrink-0">
          <Store size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[11px] font-semibold text-white leading-[1.3] truncate">{displayName}</p>
          {displaySub && (
            <p className="text-[10px] text-slate leading-[1.3]">{displaySub}</p>
          )}
        </div>
        <ChevronDown
          size={13}
          className={clsx('text-slate shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] bg-[#1A1917] border border-charcoal rounded-[10px] shadow-[0_8px_28px_rgba(0,0,0,0.35)] p-[6px]">
          <p className="text-[10px] font-semibold text-dark-label uppercase tracking-[0.08em] px-[10px] pt-1 pb-2">
            Switch Store
          </p>
          <div className="max-h-[205px] overflow-y-auto">
            {stores.map(store => (
              <SidebarStoreItem
                key={store._id}
                label={store.name}
                sub={`/${store.slug} · ${store.plan}`}
                logo={store.logo}
                onClick={() => { navigate(`/seller/store/${store._id}/dashboard`); setOpen(false); }}
              />
            ))}
            {stores.length === 0 && !loading && (
              <p className="text-[11px] text-dark-label px-[10px] py-[6px]">No stores yet</p>
            )}
          </div>
          <div className="h-px bg-charcoal mx-[6px] my-1" />
          <button
            onClick={() => { setOpen(false); navigate('/onboarding'); }}
            className="flex items-center gap-[7px] w-full py-2 px-[10px] rounded-[7px] bg-transparent border-0 cursor-pointer text-[11px] font-semibold text-brand-orange hover:bg-charcoal transition-colors duration-150"
          >
            <Plus size={12} /> New Store
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarStoreItem({ label, sub, logo, onClick }: {
  label:   string;
  sub:     string;
  logo?:   string | null;
  onClick: () => void;
}) {
  const initials = label.slice(0, 2).toUpperCase();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-[9px] w-full py-[7px] px-[10px] rounded-md bg-transparent border-0 cursor-pointer text-left transition-colors duration-[120ms] hover:bg-dark-hover"
    >
      <div className="size-[26px] rounded-[7px] shrink-0 bg-charcoal overflow-hidden flex items-center justify-center text-[9px] font-bold text-slate">
        {logo
          ? <img src={logo} alt={label} className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-dark-text truncate">{label}</p>
        <p className="text-[10px] text-dark-label">{sub}</p>
      </div>
    </button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function isDropdown(item: NavEntry): item is NavDropdown {
  return 'children' in item;
}

function SellerSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const { profile, loading: profileLoading } = useGetProfile();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  const toggleDropdown = (id: string) =>
    setOpenDropdowns(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className="w-[220px] bg-carbon flex flex-col shrink-0 sticky top-0 h-screen">
      {/* Logo + Store selector */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-[9px] mb-4">
          <SolvexoIcon size={32} />
          <div className="flex items-center">
            <span className="text-[17px] font-bold text-white tracking-[-0.3px]">Solvex</span>
            <span className="text-[17px] font-bold text-brand-orange tracking-[-0.3px]">o</span>
          </div>
        </div>
        <SidebarStoreSwitcher />
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 pt-1 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.label} className="mb-1">
            <p className="text-[10px] font-semibold text-dark-label block px-2 py-1 uppercase tracking-[0.08em] mb-1">
              {section.label}
            </p>

            {section.items.map(item => {
              if (isDropdown(item)) {
                const isOpen = openDropdowns[item.id] ?? false;
                const anyChildActive = item.children.some(c => isActive(c.path));
                return (
                  <div key={item.id} className="mb-0.5">
                    <div
                      onClick={() => toggleDropdown(item.id)}
                      className="flex items-center gap-[10px] py-[9px] px-[10px] rounded-md cursor-pointer transition-colors duration-150 hover:bg-dark-active"
                    >
                      <item.Icon
                        size={15}
                        className={clsx(
                          'shrink-0',
                          anyChildActive ? 'text-brand-orange opacity-100' : 'text-slate opacity-45',
                        )}
                      />
                      <span className={clsx(
                        'text-[13px] flex-1',
                        anyChildActive ? 'font-semibold text-white' : 'font-normal text-slate',
                      )}>
                        {item.label}
                      </span>
                      <ChevronDown
                        size={14}
                        className={clsx('text-slate transition-transform duration-200', isOpen && 'rotate-180')}
                      />
                    </div>
                    {isOpen && (
                      <div className="pl-[18px]">
                        {item.children.map(child => {
                          const active = isActive(child.path);
                          return (
                            <div
                              key={child.id}
                              onClick={() => navigate(child.path)}
                              className={clsx(
                                'flex items-center gap-[10px] py-2 px-[10px] rounded-md mb-0.5',
                                'cursor-pointer transition-colors duration-150',
                                active ? 'bg-dark-active' : 'bg-transparent hover:bg-dark-active',
                              )}
                            >
                              <child.Icon
                                size={13}
                                className={clsx(
                                  'shrink-0',
                                  active ? 'text-brand-orange opacity-100' : 'text-slate opacity-45',
                                )}
                              />
                              <span className={clsx(
                                'text-[12px] flex-1',
                                active ? 'font-semibold text-white' : 'font-normal text-slate',
                              )}>
                                {child.label}
                              </span>
                              {active && <div className="w-[3px] h-[14px] rounded-[2px] bg-brand-orange shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const active = isActive(item.path);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={clsx(
                    'flex items-center gap-[10px] py-[9px] px-[10px] rounded-md mb-0.5',
                    'cursor-pointer transition-colors duration-150',
                    active ? 'bg-dark-active' : 'bg-transparent hover:bg-dark-active',
                  )}
                >
                  <item.Icon
                    size={15}
                    className={clsx(
                      'shrink-0',
                      active ? 'text-brand-orange opacity-100' : 'text-slate opacity-45',
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

      {/* User footer */}
      <div className="px-4 py-3 border-t border-dark-active shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full shrink-0 bg-charcoal flex items-center justify-center overflow-hidden">
            {profileLoading
              ? <div className="animate-pulse w-full h-full bg-[#3C3A38]" />
              : profile?.profileImage
                ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                : <span className="text-[10px] font-bold text-brand-orange">{profile?.name?.slice(0, 2).toUpperCase() ?? '--'}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            {profileLoading ? (
              <>
                <div className="animate-pulse w-20 h-[11px] rounded-[3px] bg-charcoal mb-1" />
                <div className="animate-pulse w-[110px] h-[9px] rounded-[3px] bg-charcoal" />
              </>
            ) : (
              <>
                <p className="text-[12px] font-medium text-white leading-[1.3] truncate">{profile?.name ?? '—'}</p>
                <p className="text-[10px] text-slate leading-[1.3] truncate">{profile?.email ?? '—'}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Page Header (shared between Seller pages) ─────────────────────────────────
export interface SellerPageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
}

export function SellerPageHeader({ title, subtitle, actions }: SellerPageHeaderProps) {
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

// ── Layout ────────────────────────────────────────────────────────────────────
export function SellerLayout() {
  return (
    <ActiveStoreProvider>
      <div className="flex h-screen bg-cream overflow-hidden">
        <SellerSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </ActiveStoreProvider>
  );
}
