import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, Shield, Store, DollarSign, Bell, Settings, UserCog,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';

interface AdminNavItem {
  id:    string;
  Icon:  LucideIcon;
  label: string;
  path:  string;
}

const ADMIN_NAV: AdminNavItem[] = [
  { id: 'overview',      Icon: LayoutDashboard, label: 'Overview',        path: '/admin'               },
  { id: 'users',         Icon: Users,           label: 'Users & Sellers', path: '/admin/users'         },
  { id: 'moderation',    Icon: Shield,          label: 'Moderation',      path: '/admin/moderation'    },
  { id: 'marketplace',   Icon: Store,           label: 'Marketplace',     path: '/admin/marketplace'   },
  { id: 'finance',       Icon: DollarSign,      label: 'Finance',         path: '/admin/finance'       },
  { id: 'announcements', Icon: Bell,            label: 'Announcements',   path: '/admin/announcements' },
  { id: 'config',        Icon: Settings,        label: 'Platform Config', path: '/admin/config'        },
  { id: 'settings',      Icon: UserCog,         label: 'My Settings',     path: '/admin/settings'      },
];

interface AdminSidebarProps { open: boolean; onToggle: () => void; onClose: () => void; }

function AdminSidebar({ open, onToggle, onClose }: AdminSidebarProps) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const { profile, loading: profileLoading } = useGetProfile();

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

  const toggleBtn = (
    <button
      onClick={onToggle}
      title={open ? 'Collapse sidebar' : 'Expand sidebar'}
      className="size-7 rounded-md flex items-center justify-center shrink-0 text-pos-muted hover:text-white hover:bg-dark-active transition-colors cursor-pointer"
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
        'bg-admin-bg flex flex-col h-screen',
        'transition-all duration-300 ease-in-out',
        // Mobile: fixed overlay
        'fixed inset-y-0 left-0 z-50 w-[220px]',
        // Desktop: static inline with width toggle
        'lg:static lg:z-auto lg:shrink-0',
        open
          ? 'translate-x-0 lg:w-[220px]'
          : '-translate-x-full lg:translate-x-0 lg:w-[60px]',
      )}>

        {/* Header */}
        {open ? (
          <div className="p-5 pb-4 shrink-0">
            <div className="flex items-center gap-[10px] mb-2">
              <div className="size-[30px] rounded-md bg-error flex items-center justify-center shrink-0">
                <Shield size={15} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white leading-[1.3]">Solvexo Admin</p>
                <p className="text-[10px] text-pos-muted leading-[1.3]">Super Admin Panel</p>
              </div>
              {toggleBtn}
            </div>

            <div className="bg-admin-surface rounded-sm px-[10px] py-[6px]">
              {profileLoading ? (
                <div className="animate-pulse w-[140px] h-[10px] rounded-[3px] bg-charcoal" />
              ) : (
                <>
                  <span className="text-[10px] text-pos-muted">Logged in as: </span>
                  <span className="text-[10px] font-semibold text-white">{profile?.email ?? '—'}</span>
                </>
              )}
            </div>

            {!profileLoading && profile && (
              <div className="flex items-center gap-2 mt-2">
                <div className="size-[26px] rounded-full shrink-0 bg-error flex items-center justify-center overflow-hidden text-[9px] font-bold text-white">
                  {profile.profileImage
                    ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                    : profile.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate">{profile.name}</p>
                  <p className="text-[9px] text-pos-muted capitalize">{profile.role}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-5 pb-4 flex flex-col items-center gap-3 shrink-0">
            <div className="size-[30px] rounded-md bg-error flex items-center justify-center shrink-0">
              <Shield size={15} className="text-white" />
            </div>
            {toggleBtn}
          </div>
        )}

        {/* Nav */}
        <nav className={clsx('flex-1 overflow-y-auto', open ? 'px-3' : 'px-[10px] pt-2')}>
          {ADMIN_NAV.map(item => {
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
                <item.Icon
                  size={15}
                  className={clsx(
                    'shrink-0',
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
              </div>
            );
          })}
        </nav>
      </aside>
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

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <AdminSidebar open={sidebarOpen} onToggle={toggle} onClose={onClose} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile-only topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-[11px] bg-admin-bg border-b border-charcoal sticky top-0 z-30 shrink-0">
          <button
            onClick={toggle}
            className="size-8 rounded-md flex items-center justify-center text-pos-muted hover:text-white hover:bg-dark-active transition-colors cursor-pointer"
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
