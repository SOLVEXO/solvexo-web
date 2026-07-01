import { type ReactNode, useState, useRef, useEffect, createContext, useContext } from 'react';
import { ActiveStoreProvider, useActiveStore } from '@/contexts/ActiveStoreContext';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Store, RefreshCw,
  Settings, FolderOpen,
  Bell, ChevronDown, List, Plus, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';

// ── Sidebar context (lets SellerPageHeader consume the toggle) ────────────────
const SellerSidebarCtx = createContext<{ toggle: () => void }>({ toggle: () => {} });

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
      { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard', path: '/seller/dashboard' },
      {
        id: 'my-store', Icon: Store, label: 'My Store',
        children: [
          { id: 'store-list',    Icon: List,  label: 'Store List',    path: '/seller/stores' },
          { id: 'store-builder', Icon: Store, label: 'Store Builder', path: '/seller/store'  },
        ],
      },
    ],
  },
  {
    label: 'Customers',
    items: [
      { id: 'subscriptions', Icon: RefreshCw, label: 'Subscriptions', path: '/seller/subscriptions' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'settings',   Icon: Settings,   label: 'Settings',   path: '/seller/settings'   },
      { id: 'categories', Icon: FolderOpen, label: 'Categories', path: '/seller/categories' },
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
          {displaySub && <p className="text-[10px] text-slate leading-[1.3]">{displaySub}</p>}
        </div>
        <ChevronDown size={13} className={clsx('text-slate shrink-0 transition-transform duration-200', open && 'rotate-180')} />
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
        {logo ? <img src={logo} alt={label} className="w-full h-full object-cover" /> : initials}
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

interface SellerSidebarProps { open: boolean; onToggle: () => void; onClose: () => void; }

function SellerSidebar({ open, onToggle, onClose }: SellerSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const { profile, loading: profileLoading } = useGetProfile();

  const isActive     = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const toggleDropdown = (id: string) => setOpenDropdowns(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleBtn = (
    <button
      onClick={onToggle}
      title={open ? 'Collapse sidebar' : 'Expand sidebar'}
      className="size-7 rounded-md flex items-center justify-center shrink-0 text-slate hover:text-white hover:bg-dark-active transition-colors cursor-pointer"
    >
      {open ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
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

        {/* Header: logo + toggle */}
        {open ? (
          <div className="px-5 pt-5 pb-4 shrink-0 flex items-center gap-[9px]">
            <div className="shrink-0"><SolvexoIcon size={28} /></div>
            <div className="flex items-center flex-1 min-w-0">
              <span className="text-[17px] font-bold text-white tracking-[-0.3px]">Solvex</span>
              <span className="text-[17px] font-bold text-brand-orange tracking-[-0.3px]">o</span>
            </div>
            {toggleBtn}
          </div>
        ) : (
          <div className="pt-5 pb-4 flex justify-center shrink-0">
            {toggleBtn}
          </div>
        )}

        {/* Store switcher (only when expanded) */}
        {open && (
          <div className="px-5 pb-4 shrink-0">
            <SidebarStoreSwitcher />
          </div>
        )}

        {/* Nav sections */}
        <nav className={clsx('flex-1 overflow-y-auto', open ? 'px-3 pt-1' : 'px-[10px] pt-2')}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="mb-1">
              {open
                ? <p className="text-[10px] font-semibold text-dark-label block px-2 py-1 uppercase tracking-[0.08em] mb-1">{section.label}</p>
                : <div className="h-px bg-dark-active mx-1 mb-2" />
              }

              {section.items.map(item => {
                if (isDropdown(item)) {
                  const isOpen = openDropdowns[item.id] ?? false;
                  const anyChildActive = item.children.some(c => isActive(c.path));

                  if (!open) {
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.children[0].path)}
                        title={item.label}
                        className={clsx(
                          'flex items-center justify-center py-[9px] rounded-md mb-0.5 cursor-pointer transition-colors duration-150',
                          anyChildActive ? 'bg-dark-active' : 'bg-transparent hover:bg-dark-active',
                        )}
                      >
                        <item.Icon size={15} className={clsx('shrink-0', anyChildActive ? 'text-brand-orange opacity-100' : 'text-slate opacity-45')} />
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="mb-0.5">
                      <div
                        onClick={() => toggleDropdown(item.id)}
                        className="flex items-center gap-[10px] py-[9px] px-[10px] rounded-md cursor-pointer transition-colors duration-150 hover:bg-dark-active"
                      >
                        <item.Icon size={15} className={clsx('shrink-0', anyChildActive ? 'text-brand-orange opacity-100' : 'text-slate opacity-45')} />
                        <span className={clsx('text-[13px] flex-1', anyChildActive ? 'font-semibold text-white' : 'font-normal text-slate')}>
                          {item.label}
                        </span>
                        <ChevronDown size={14} className={clsx('text-slate transition-transform duration-200', isOpen && 'rotate-180')} />
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
                                <child.Icon size={13} className={clsx('shrink-0', active ? 'text-brand-orange opacity-100' : 'text-slate opacity-45')} />
                                <span className={clsx('text-[12px] flex-1', active ? 'font-semibold text-white' : 'font-normal text-slate')}>
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
                    title={!open ? item.label : undefined}
                    className={clsx(
                      'flex items-center gap-[10px] py-[9px] px-[10px] rounded-md mb-0.5',
                      'cursor-pointer transition-colors duration-150',
                      !open && 'lg:justify-center lg:px-0',
                      active ? 'bg-dark-active' : 'bg-transparent hover:bg-dark-active',
                    )}
                  >
                    <item.Icon size={15} className={clsx('shrink-0', active ? 'text-brand-orange opacity-100' : 'text-slate opacity-45')} />
                    {open && (
                      <>
                        <span className={clsx('text-[13px] flex-1', active ? 'font-semibold text-white' : 'font-normal text-slate')}>
                          {item.label}
                        </span>
                        {active && <div className="w-[3px] h-[14px] rounded-[2px] bg-brand-orange shrink-0" />}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-dark-active shrink-0">
          <div className={clsx('flex items-center gap-2', !open && 'justify-center')}>
            <div className="size-7 rounded-full shrink-0 bg-charcoal flex items-center justify-center overflow-hidden">
              {profileLoading
                ? <div className="animate-pulse w-full h-full bg-[#3C3A38]" />
                : profile?.profileImage
                  ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                  : <span className="text-[10px] font-bold text-brand-orange">{profile?.name?.slice(0, 2).toUpperCase() ?? '--'}</span>
              }
            </div>
            {open && (
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
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Page Header (exported for seller pages) ───────────────────────────────────
export interface SellerPageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
}

export function SellerPageHeader({ title, subtitle, actions }: SellerPageHeaderProps) {
  const { toggle } = useContext(SellerSidebarCtx);
  return (
    <div className="bg-white border-b border-bone px-4 md:px-7 py-[14px] flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
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
        <div className="size-[34px] rounded-md bg-brand-pale-orange flex items-center justify-center cursor-pointer shrink-0">
          <Bell size={16} className="text-brand-orange" />
        </div>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export function SellerLayout() {
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

  return (
    <ActiveStoreProvider>
      <SellerSidebarCtx.Provider value={{ toggle }}>
        <div className="flex h-[calc(100vh-44px)] bg-cream">
          <SellerSidebar open={sidebarOpen} onToggle={toggle} onClose={onClose} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <Outlet />
            </div>
          </div>
        </div>
      </SellerSidebarCtx.Provider>
    </ActiveStoreProvider>
  );
}
