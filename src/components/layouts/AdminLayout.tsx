import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, Shield, Store, DollarSign, Bell, Settings, UserCog,
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
  { id: 'overview',      Icon: LayoutDashboard, label: 'Overview',         path: '/admin'                },
  { id: 'users',         Icon: Users,           label: 'Users & Sellers',  path: '/admin/users'          },
  { id: 'moderation',    Icon: Shield,          label: 'Moderation',       path: '/admin/moderation'     },
  { id: 'marketplace',   Icon: Store,           label: 'Marketplace',      path: '/admin/marketplace'    },
  { id: 'finance',       Icon: DollarSign,      label: 'Finance',          path: '/admin/finance'        },
  { id: 'announcements', Icon: Bell,            label: 'Announcements',    path: '/admin/announcements'  },
  { id: 'config',        Icon: Settings,        label: 'Platform Config',  path: '/admin/config'         },
  { id: 'settings',      Icon: UserCog,         label: 'My Settings',      path: '/admin/settings'       },
];

function AdminSidebar() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const { profile, loading: profileLoading } = useGetProfile();

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

  return (
    <aside className="w-[220px] bg-admin-bg flex flex-col shrink-0 sticky top-0 h-screen">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-[10px] mb-2">
          <div className="size-[30px] rounded-md bg-error flex items-center justify-center shrink-0">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-[1.3]">Solvexo Admin</p>
            <p className="text-[10px] text-pos-muted leading-[1.3]">Super Admin Panel</p>
          </div>
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

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {ADMIN_NAV.map(item => {
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
                  active ? 'text-error opacity-100' : 'text-pos-faint opacity-40',
                )}
              />
              <span className={clsx(
                'text-[12px] flex-1',
                active ? 'font-semibold text-white' : 'font-normal text-pos-faint',
              )}>
                {item.label}
              </span>
              {active && (
                <div className="w-[3px] h-3 rounded-[2px] bg-error" />
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
