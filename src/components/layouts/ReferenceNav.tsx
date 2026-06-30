import { useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import {
  Home, ShoppingCart, Store, DollarSign, Users, BookOpen,
  LogIn, Rocket,
  LayoutDashboard, Upload, Monitor,
  BarChart2, Search, Sparkles, Star, RefreshCw, Megaphone, Wallet,
  Truck, MessageSquare, Plug, Activity, Settings,
  Shield,
} from 'lucide-react';

// ── Page definitions with Lucide icons ───────────────────────────────────────
interface NavPage { label: string; path: string; Icon: LucideIcon }

const PUBLIC_PAGES: NavPage[] = [
  { label: 'Home',       path: '/',                   Icon: Home         },
  { label: 'Marketplace',    path: '/marketplace',        Icon: ShoppingCart },
  // { label: 'Product Detail', path: '/marketplace/1',      Icon: FileText     },
  { label: 'Storefront',     path: '/store/teacherspro',  Icon: Store        },
  { label: 'Pricing',        path: '/pricing',            Icon: DollarSign   },
  { label: 'For Sellers',    path: '/sellers',            Icon: Users        },
  { label: 'Edu Listing',    path: '/education',          Icon: BookOpen     },
];

const AUTH_PAGES: NavPage[] = [
  { label: 'Login',        path: '/login',        Icon: LogIn       },
  { label: 'Onboarding',   path: '/onboarding',   Icon: Rocket      },
];

const SELLER_PAGES: NavPage[] = [
  { label: 'Dashboard',      path: '/seller/dashboard',        Icon: LayoutDashboard },
  // { label: 'Products',       path: '/seller/products',         Icon: ShoppingBag     },
  // { label: 'Add Product',  path: '/seller/products/add',     Icon: Plus            },
  // { label: 'Digital Upload', path: '/seller/products/digital', Icon: Upload          },
  { label: 'Store Builder',  path: '/seller/store',            Icon: Store           },
  // { label: 'POS Register',   path: '/seller/pos',              Icon: Monitor         },
  // { label: 'Orders',         path: '/seller/orders',           Icon: Package         },
  // { label: 'Returns',        path: '/seller/returns',          Icon: CornerUpLeft    },
  // { label: 'Inventory',      path: '/seller/inventory',        Icon: ClipboardList   },
  // { label: 'AI Studio',      path: '/seller/ai',               Icon: Sparkles        },
  // { label: 'Analytics',      path: '/seller/analytics',        Icon: BarChart2       },
  // { label: 'SEO',            path: '/seller/seo',              Icon: Search          },
  // { label: 'Customers',      path: '/seller/customers',        Icon: Users           },
  // { label: 'Loyalty',        path: '/seller/loyalty',          Icon: Star            },
  { label: 'Subscriptions',  path: '/seller/subscriptions',    Icon: RefreshCw       },
  // { label: 'Marketing',      path: '/seller/marketing',        Icon: Megaphone       },
  // { label: 'Finance',        path: '/seller/finance',          Icon: Wallet          },
  // { label: 'Shipping',       path: '/seller/shipping',         Icon: Truck           },
  // { label: 'Messages',       path: '/seller/messages',         Icon: MessageSquare   },
  // { label: 'Reviews',        path: '/seller/reviews',          Icon: Star            },
  // { label: 'Integrations',   path: '/seller/integrations',     Icon: Plug            },
  // { label: 'Activity Log',   path: '/seller/activity',         Icon: Activity        },
  { label: 'Settings',       path: '/seller/settings',         Icon: Settings        },
  // { label: 'Categories',     path: '/seller/categories',       Icon: FolderOpen      },
];

const ADMIN_PAGES: NavPage[] = [
  { label: 'Admin Panel', path: '/admin', Icon: Shield },
];

// ── NavChip with Lucide icon ──────────────────────────────────────────────────
function NavChip({ label, path, Icon, active, disabled }: NavPage & { active: boolean; disabled?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => { if (!disabled) navigate(path); }}
      title={disabled ? 'Not available for your role' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 7, fontSize: 12,
        fontWeight: active ? 600 : 400, fontFamily: "'Poppins', sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none', whiteSpace: 'nowrap', flexShrink: 0,
        background: active ? '#D97757' : 'transparent',
        color: active ? '#fff' : '#8C8A82',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.15s',
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: '#5C5A58',
      fontFamily: "'Poppins', sans-serif",
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '0 8px', flexShrink: 0, alignSelf: 'center',
    }}>
      {children}
    </span>
  );
}

function Pipe() {
  return (
    <div style={{
      width: 1, height: 20, background: '#2C2A28',
      flexShrink: 0, alignSelf: 'center', margin: '0 6px',
    }} />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ReferenceNav() {
  const { pathname } = useLocation();
  const { profile } = useGetProfile();

  const role = profile?.role;
  const isSeller = role === 'seller' || role === 'admin';
  const isAdmin  = role === 'admin';

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 44,
      background: '#0F0E0D', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 2,
      paddingLeft: 12, paddingRight: 12,
      overflowX: 'auto', overflowY: 'hidden',
      borderBottom: '1px solid #1E1C1A',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4, flexShrink: 0 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6, background: '#D97757',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Poppins', sans-serif" }}>S</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'Poppins', sans-serif" }}>
          Solvex<span style={{ color: '#D97757' }}>o</span>
        </span>
      </div>

      <Pipe />

      <SectionLabel>Public</SectionLabel>
      {PUBLIC_PAGES.map(p => <NavChip key={p.path} {...p} active={isActive(p.path)} />)}

      <Pipe />

      <SectionLabel>Auth</SectionLabel>
      {AUTH_PAGES.map(p => <NavChip key={p.path} {...p} active={isActive(p.path)} />)}

      <Pipe />

      <SectionLabel>Seller</SectionLabel>
      {SELLER_PAGES.map(p => <NavChip key={p.path} {...p} active={isActive(p.path)} disabled={!isSeller} />)}

      <Pipe />

      <SectionLabel>Admin</SectionLabel>
      {ADMIN_PAGES.map(p => <NavChip key={p.path} {...p} active={isActive(p.path)} disabled={!isAdmin} />)}
    </div>
  );
}
