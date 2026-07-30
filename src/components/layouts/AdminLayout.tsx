import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, Shield, Store, DollarSign, Bell, Settings, UserCog,
  PanelLeftClose, PanelLeftOpen, MessageSquare, Image as ImageIcon, HelpCircle, FolderTree, RefreshCw,
  BarChart3, Layers, Search, Sparkles, Tag, LogOut, MessageCircle, Landmark, Percent,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useLogout } from '@/hooks/auth/useLogout';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { TokenStorage, type AppRole } from '@/api/services/auth';
import { CommandPalette } from '@/components/comman/ui/CommandPalette';
import { Modal, Button } from '@/components/comman/ui';

interface AdminNavItem {
  id:    string;
  Icon:  LucideIcon;
  label: string;
  path:  string;
}

const ADMIN_NAV: AdminNavItem[] = [
  { id: 'overview',      Icon: LayoutDashboard, label: 'Overview',        path: '/admin'               },
  { id: 'analytics',     Icon: BarChart3,       label: 'Analytics',       path: '/admin/analytics'     },
  { id: 'users',         Icon: Users,           label: 'Users & Sellers', path: '/admin/users'         },
  { id: 'moderation',    Icon: Shield,          label: 'Moderation',      path: '/admin/moderation'    },
  { id: 'messages',      Icon: MessageSquare,   label: 'Messaging',       path: '/admin/messages'      },
  { id: 'marketplace',   Icon: Store,           label: 'Marketplace',     path: '/admin/marketplace'   },
  { id: 'categories',    Icon: FolderTree,      label: 'Categories',      path: '/admin/categories'    },
  { id: 'subscriptions', Icon: RefreshCw,       label: 'Subscriptions',   path: '/admin/subscriptions' },
  { id: 'marketing',     Icon: Tag,             label: 'Marketing',       path: '/admin/marketing'     },
  { id: 'platform-plans',Icon: Layers,          label: 'Platform Plans',  path: '/admin/platform-plans' },
  { id: 'finance',       Icon: DollarSign,      label: 'Finance',         path: '/admin/finance'       },
  { id: 'manual-payments', Icon: Landmark,      label: 'Manual Payments', path: '/admin/manual-payments' },
  { id: 'commission-rules', Icon: Percent,      label: 'Commission Rules', path: '/admin/commission-rules' },
  { id: 'seo',           Icon: Search,          label: 'SEO',             path: '/admin/seo'           },
  { id: 'ai-studio',     Icon: Sparkles,        label: 'AI Studio',       path: '/admin/ai-studio'     },
  { id: 'banners',       Icon: ImageIcon,       label: 'Banners',         path: '/admin/banners'       },
  { id: 'faqs',          Icon: HelpCircle,      label: 'FAQs',            path: '/admin/faqs'          },
  { id: 'contact',       Icon: MessageCircle,   label: 'Contact Messages',path: '/admin/contact'       },
  { id: 'announcements', Icon: Bell,            label: 'Announcements',   path: '/admin/announcements' },
  { id: 'config',        Icon: Settings,        label: 'Platform Config', path: '/admin/config'        },
  { id: 'settings',      Icon: UserCog,         label: 'My Settings',     path: '/admin/settings'      },
];

// Purely visual grouping for the sidebar — does not affect routes, order, or
// which items exist. Every id above must appear in exactly one group.
const NAV_GROUPS: { label: string; ids: AdminNavItem['id'][] }[] = [
  { label: 'Overview',  ids: ['overview', 'analytics'] },
  { label: 'Community', ids: ['users', 'moderation', 'messages'] },
  { label: 'Commerce',  ids: ['marketplace', 'categories', 'subscriptions', 'platform-plans'] },
  { label: 'Growth',    ids: ['marketing', 'seo', 'ai-studio'] },
  { label: 'Finance',   ids: ['finance', 'manual-payments', 'commission-rules'] },
  { label: 'Content',   ids: ['banners', 'faqs', 'contact', 'announcements'] },
  { label: 'Platform',  ids: ['config', 'settings'] },
];

interface AdminSidebarProps { open: boolean; onToggle: () => void; onClose: () => void; }

function AdminSidebar({ open, onToggle, onClose }: AdminSidebarProps) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const { profile, loading: profileLoading } = useGetProfile();
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const logout = useLogout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout('/admin/login');
  };

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

  const paletteItems = ADMIN_NAV.map(item => ({
    id:       item.id,
    label:    item.label,
    icon:     item.Icon,
    onSelect: () => navigate(item.path),
  }));

  const toggleBtn = (
    <button
      onClick={onToggle}
      title={open ? 'Collapse sidebar' : 'Expand sidebar'}
      className="size-7 rounded-md flex items-center justify-center shrink-0 text-pos-muted hover:text-white hover:bg-dark-active transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-error/40"
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
        'flex items-center gap-1 rounded-md border border-dark-active text-pos-muted hover:text-white hover:bg-dark-active transition-colors duration-150 cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-error/40',
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
        'bg-admin-bg flex flex-col',
        'transition-all duration-300 ease-in-out',
        // Mobile: fixed overlay, starts below ReferenceNav (44px)
        'fixed top-[44px] bottom-0 left-0 z-50 w-[220px]',
        // Desktop: static inline, full viewport height, width toggles
        'lg:static lg:z-auto lg:shrink-0 lg:h-[calc(100vh-44px)] lg:top-auto lg:bottom-auto',
        open
          ? 'translate-x-0 lg:w-[220px]'
          : '-translate-x-full lg:translate-x-0 lg:w-[60px]',
      )}>

        {/* Header: logo + toggle (mirrors StoreLayout/SellerLayout header) */}
        {open ? (
          <div className="px-5 pt-5 pb-4 shrink-0 flex items-center gap-[9px]">
            <div className="size-[30px] rounded-md bg-error flex items-center justify-center shrink-0">
              <Shield size={15} className="text-white" />
            </div>
            <div className="flex items-center flex-1 min-w-0">
              <span className="text-[17px] font-bold text-white tracking-[-0.3px]">Solvexo</span>
              <span className="text-[17px] font-bold text-error tracking-[-0.3px]">&nbsp;Admin</span>
            </div>
            {paletteHint}
            {toggleBtn}
          </div>
        ) : (
          <div className="pt-5 pb-4 flex flex-col items-center gap-[6px] shrink-0">
            <div className="size-[30px] rounded-md bg-error flex items-center justify-center shrink-0">
              <Shield size={15} className="text-white" />
            </div>
            {paletteHint}
            {toggleBtn}
          </div>
        )}

        {/* Nav */}
        <nav className={clsx('flex-1 overflow-y-auto', open ? 'px-3' : 'px-[10px] pt-2')}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-2' : undefined}>
              {open ? (
                <p className="px-[10px] pt-2 pb-[5px] text-[10px] font-semibold text-pos-faint/70 uppercase tracking-[0.08em] select-none">
                  {group.label}
                </p>
              ) : gi > 0 ? (
                <div className="mx-2 mb-2 border-t border-dark-active" />
              ) : null}

              {group.ids.map(id => {
                const item = ADMIN_NAV.find(n => n.id === id);
                if (!item) return null;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    title={!open ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={clsx(
                      'w-full flex items-center gap-[10px] py-[9px] px-[10px] rounded-md mb-0.5 border-none text-left',
                      'cursor-pointer transition-colors duration-150 outline-none',
                      'focus-visible:ring-2 focus-visible:ring-error/40',
                      'active:scale-[0.98]',
                      !open && 'lg:justify-center lg:px-0',
                      active ? 'bg-dark-active' : 'bg-transparent hover:bg-dark-active',
                    )}
                  >
                    <item.Icon
                      size={15}
                      className={clsx(
                        'shrink-0 transition-opacity duration-150',
                        active ? 'text-error opacity-100' : 'text-pos-faint opacity-40',
                      )}
                    />
                    {open && (
                      <>
                        <span className={clsx(
                          'text-[12px] flex-1',
                          active ? 'font-semibold text-white' : 'font-normal text-pos-faint',
                        )}>
                          {item.label}
                        </span>
                        {active && <div className="w-[3px] h-3 rounded-[2px] bg-error" />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer (mirrors StoreLayout/SellerLayout's bottom profile card) */}
        <div className="px-4 py-3 border-t border-dark-active shrink-0">
          <div className={clsx('flex items-center gap-2', !open && 'flex-col')}>
            <div className="size-7 rounded-full shrink-0 bg-error flex items-center justify-center overflow-hidden text-[10px] font-bold text-white">
              {profileLoading
                ? <div className="animate-pulse w-full h-full bg-charcoal" />
                : profile?.profileImage
                  ? <img loading="lazy" decoding="async" src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                  : (profile?.name?.slice(0, 2).toUpperCase() ?? 'AD')}
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
                    <p className="text-[12px] font-semibold text-white leading-[1.3] truncate">{profile?.name ?? 'Admin'}</p>
                    <p className="text-[10px] text-pos-muted leading-[1.3] truncate">{profile?.email ?? '—'}</p>
                  </>
                )}
              </div>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              aria-label="Logout"
              className="size-7 rounded-md flex items-center justify-center shrink-0 text-pos-muted hover:text-white hover:bg-dark-active transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <CommandPalette items={paletteItems} open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {showLogoutConfirm && (
        <Modal title="Log out?" onClose={() => setShowLogoutConfirm(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut}>Cancel</Button>
            <Button variant="primary" onClick={handleLogout} loading={loggingOut}>Logout</Button>
          </>
        }>
          <p className="text-[13px] text-slate">You'll need to sign in again to access the admin panel.</p>
        </Modal>
      )}
    </>
  );
}

export function AdminLayout() {
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
  if (!TokenStorage.isLoggedIn() || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex h-[calc(100vh-44px)] bg-cream overflow-hidden">
      <AdminSidebar open={sidebarOpen} onToggle={toggle} onClose={onClose} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile-only topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-[11px] bg-admin-bg border-b border-charcoal sticky top-0 z-30 shrink-0">
          <button
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="size-8 rounded-md flex items-center justify-center text-pos-muted hover:text-white hover:bg-dark-active transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-error/40"
          >
            <PanelLeftOpen size={17} />
          </button>
          <div className="flex items-center gap-[10px]">
            <div className="size-[22px] rounded-md bg-error flex items-center justify-center shrink-0">
              <Shield size={11} className="text-white" />
            </div>
            <span className="text-[14px] font-bold text-white">Admin Panel</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
