import { type ReactNode } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, CornerUpLeft, ShoppingBag, Plus, Upload,
  Store, Monitor, BarChart2, Search, Sparkles, Users, Star, RefreshCw,
  Megaphone, Wallet, ClipboardList, Truck, MessageSquare, Plug, Activity,
  Settings, FolderOpen, Bell,
} from 'lucide-react';
import { SolvexoIcon } from '@/components/ui/SolvexoLogo';

// ── Nav sections with Lucide icons ───────────────────────────────────────────
interface NavItem {
  id:    string;
  Icon:  LucideIcon;
  label: string;
  path:  string;
}
interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard',   Icon: LayoutDashboard, label: 'Dashboard',      path: '/seller/dashboard'        },
      { id: 'orders',      Icon: Package,          label: 'Orders',          path: '/seller/orders'           },
      { id: 'returns',     Icon: CornerUpLeft,     label: 'Returns',         path: '/seller/returns'          },
      { id: 'products',    Icon: ShoppingBag,      label: 'Products',        path: '/seller/products'         },
      { id: 'add-product', Icon: Plus,             label: 'Add Product',   path: '/seller/products/add'     },
      { id: 'digital',     Icon: Upload,           label: 'Digital Upload',  path: '/seller/products/digital' },
      { id: 'store',       Icon: Store,            label: 'Store Builder',   path: '/seller/store'            },
      { id: 'pos',         Icon: Monitor,          label: 'POS Register',    path: '/seller/pos'              },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'analytics', Icon: BarChart2, label: 'Analytics',  path: '/seller/analytics' },
      { id: 'seo',        Icon: Search,   label: 'SEO',         path: '/seller/seo'       },
      { id: 'ai',         Icon: Sparkles, label: 'AI Studio',   path: '/seller/ai'        },
    ],
  },
  {
    label: 'Customers',
    items: [
      { id: 'customers',     Icon: Users,      label: 'Customers',    path: '/seller/customers'     },
      { id: 'loyalty',       Icon: Star,       label: '★ Loyalty',    path: '/seller/loyalty'       },
      { id: 'subscriptions', Icon: RefreshCw,  label: 'Subscriptions',path: '/seller/subscriptions' },
      { id: 'marketing',     Icon: Megaphone,  label: 'Marketing',    path: '/seller/marketing'     },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'finance',      Icon: Wallet,       label: 'Finance',       path: '/seller/finance'       },
      { id: 'inventory',    Icon: ClipboardList,label: 'Inventory',     path: '/seller/inventory'     },
      { id: 'shipping',     Icon: Truck,        label: 'Shipping',      path: '/seller/shipping'      },
      { id: 'messages',     Icon: MessageSquare,label: 'Messages',      path: '/seller/messages'      },
      { id: 'reviews',      Icon: Star,         label: 'Reviews',    path: '/seller/reviews'       },
      { id: 'integrations', Icon: Plug,         label: 'Integrations',  path: '/seller/integrations'  },
      { id: 'activity',     Icon: Activity,     label: 'Activity Log',  path: '/seller/activity'      },
      { id: 'settings',     Icon: Settings,     label: 'Settings',      path: '/seller/settings'      },
      { id: 'categories',   Icon: FolderOpen,   label: 'Categories',    path: '/seller/categories'    },
    ],
  },
];

// ── Sidebar ──────────────────────────────────────────────────────────────────
function SellerSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === '/seller/products') return pathname === '/seller/products';
    return pathname.startsWith(path);
  };

  return (
    <aside
      style={{
        width: 220, background: '#141413',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Logo + Store selector */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <SolvexoIcon size={32} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Solvex</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#D97757', letterSpacing: '-0.3px' }}>o</span>
          </div>
        </div>

        {/* Store selector */}
        <div style={{
          background: '#1E1C1A', borderRadius: 8, padding: '8px 10px',
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5, background: '#D97757',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>M</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>My Shop</p>
            <p style={{ fontSize: 10, color: '#8C8A82', lineHeight: 1.3 }}>Professional Plan</p>
          </div>
          <span style={{ fontSize: 12, color: '#8C8A82' }}>⌄</span>
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: '#4A4845',
              display: 'block', padding: '4px 8px',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
            }}>
              {section.label}
            </p>

            {section.items.map(item => {
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
                  {/* Lucide icon */}
                  <item.Icon
                    size={15}
                    style={{
                      opacity: active ? 1 : 0.45,
                      color: active ? '#D97757' : '#8C8A82',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#FFFFFF' : '#8C8A82',
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                  {active && (
                    <div style={{
                      width: 3, height: 14, borderRadius: 2,
                      background: '#D97757', flexShrink: 0,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* AI Credits + User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1E1C1A' }}>
        <div style={{ background: '#1E1C1A', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={11} style={{ color: '#D97757' }} />
              <span style={{ fontSize: 11, color: '#8C8A82' }}>AI Credits</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#D97757' }}>750/1000</span>
          </div>
          <div style={{ height: 4, background: '#2C2A28', borderRadius: 2 }}>
            <div style={{ width: '75%', height: '100%', background: '#D97757', borderRadius: 2 }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#2C2A28', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#D97757' }}>AC</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>Alex Chen</p>
            <p style={{ fontSize: 10, color: '#8C8A82', lineHeight: 1.3 }}>alex@myshop.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
export interface SellerPageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
}

export function SellerPageHeader({ title, subtitle, actions }: SellerPageHeaderProps) {
  return (
    <div style={{
      background: '#FFFFFF', borderBottom: '1px solid #E8E6DC',
      padding: '14px 28px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0,
      zIndex: 10, flexShrink: 0, fontFamily: "'Poppins', sans-serif",
    }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', lineHeight: 1.3 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {actions}
        {/* Lucide Bell icon instead of 🔔 emoji */}
        <div style={{
          width: 34, height: 34, borderRadius: 8, background: '#FBECE4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <Bell size={16} style={{ color: '#D97757' }} />
        </div>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export function SellerLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#FAF9F5', overflow: 'hidden' }}>
      <SellerSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
