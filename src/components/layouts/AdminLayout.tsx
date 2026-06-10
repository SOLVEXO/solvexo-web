import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  { id: 'settings',      Icon: UserCog,         label: 'My Settings',       path: '/admin/settings'       },
];

function AdminSidebar() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const { profile, loading: profileLoading } = useGetProfile();

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

  return (
    <aside style={{
      width: 220, background: '#0F0E0D',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0, height: '100vh',
      fontFamily: "'Poppins', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {/* Admin icon with ⚡ */}
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: '#C13030',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Shield size={15} style={{ color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>Solvexo Admin</p>
            <p style={{ fontSize: 10, color: '#5C5A58', lineHeight: 1.3 }}>Super Admin Panel</p>
          </div>
        </div>
        <div style={{ background: '#1A1918', borderRadius: 6, padding: '6px 10px' }}>
          {profileLoading ? (
            <div className="animate-pulse" style={{ width: 140, height: 10, borderRadius: 3, background: '#2C2A28' }} />
          ) : (
            <>
              <span style={{ fontSize: 10, color: '#5C5A58' }}>Logged in as: </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>{profile?.email ?? '—'}</span>
            </>
          )}
        </div>
        {/* Profile name row */}
        {!profileLoading && profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: '#C13030', display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden', fontSize: 9, fontWeight: 700, color: '#fff',
            }}>
              {profile.profileImage
                ? <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</p>
              <p style={{ fontSize: 9, color: '#5C5A58', textTransform: 'capitalize' }}>{profile.role}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        {ADMIN_NAV.map(item => {
          const active = isActive(item.path);
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                cursor: 'pointer',
                background: active ? '#1E1C1A' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <item.Icon
                size={15}
                style={{
                  opacity: active ? 1 : 0.4,
                  color: active ? '#C13030' : '#6A6866',
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? '#FFFFFF' : '#6A6866',
                flex: 1,
              }}>
                {item.label}
              </span>
              {active && (
                <div style={{ width: 3, height: 12, borderRadius: 2, background: '#C13030' }} />
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
    <div style={{ display: 'flex', height: '100vh', background: '#FAF9F5', overflow: 'hidden' }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
