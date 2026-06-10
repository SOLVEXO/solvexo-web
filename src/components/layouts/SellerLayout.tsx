import { type ReactNode, useState, useRef, useEffect } from 'react';
import { ActiveStoreProvider, useActiveStore } from '@/contexts/ActiveStoreContext';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, CornerUpLeft, ShoppingBag, Plus, Upload,
  Store, Monitor, BarChart2, Search, Sparkles, Users, Star, RefreshCw,
  Megaphone, Wallet, ClipboardList, Truck, MessageSquare, Plug, Activity,
  Settings, FolderOpen, Bell, ChevronDown, List,
} from 'lucide-react';
import { SolvexoIcon } from '@/components/ui/SolvexoLogo';

// ── Nav sections with Lucide icons ───────────────────────────────────────────
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
      { id: 'orders',      Icon: Package,          label: 'Orders',          path: '/seller/orders'           },
      { id: 'returns',     Icon: CornerUpLeft,     label: 'Returns',         path: '/seller/returns'          },
      { id: 'products',    Icon: ShoppingBag,      label: 'Products',        path: '/seller/products'         },
      { id: 'add-product', Icon: Plus,             label: 'Add Product',   path: '/seller/products/add'     },
      { id: 'digital',     Icon: Upload,           label: 'Digital Upload',  path: '/seller/products/digital' },
      {
        id: 'my-store', Icon: Store, label: 'My Store',
        children: [
          { id: 'store-list',    Icon: List,   label: 'Store List',    path: '/seller/stores' },
          { id: 'store-builder', Icon: Store,  label: 'Store Builder', path: '/seller/store'   },
        ],
      },
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

// ── Sidebar Store Switcher ────────────────────────────────────────────────────
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
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', background: open ? '#2C2A28' : '#1E1C1A',
          borderRadius: 8, padding: '8px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', border: 'none', transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#2C2A28')}
        onMouseLeave={e => (e.currentTarget.style.background = open ? '#2C2A28' : '#1E1C1A')}
      >
        {/* Store icon */}
        <div style={{
          width: 24, height: 24, borderRadius: 6, background: '#D97757',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Store size={13} style={{ color: '#fff' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </p>
          {displaySub && (
            <p style={{ fontSize: 10, color: '#8C8A82', lineHeight: 1.3 }}>{displaySub}</p>
          )}
        </div>
        <ChevronDown
          size={13}
          style={{
            color: '#8C8A82', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Dropdown — opens downward */}
      {open && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', zIndex: 200,
          background: '#1A1917', border: '1px solid #2C2A28', borderRadius: 10,
          boxShadow: '0 8px 28px rgba(0,0,0,0.35)', padding: 6,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#4A4845', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 10px 8px', fontFamily: "'Poppins', sans-serif" }}>
            Switch Store
          </p>

          <div style={{ maxHeight: 205, overflowY: 'auto' }}>
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
              <p style={{ fontSize: 11, color: '#4A4845', padding: '6px 10px' }}>No stores yet</p>
            )}
          </div>

          <div style={{ height: 1, background: '#2C2A28', margin: '4px 6px' }} />

          <button
            onClick={() => { setOpen(false); navigate('/onboarding'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              width: '100%', padding: '8px 10px', borderRadius: 7,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, color: '#D97757',
              fontFamily: "'Poppins', sans-serif",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2C2A28')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: '7px 10px', borderRadius: 8,
        background: 'transparent', border: 'none', cursor: 'pointer',
        textAlign: 'left', transition: 'background 0.12s',
        fontFamily: "'Poppins', sans-serif",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#242220'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        background: '#2C2A28', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: '#8C8A82',
      }}>
        {logo
          ? <img src={logo} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#C0BDB5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        <p style={{ fontSize: 10, color: '#4A4845' }}>{sub}</p>
      </div>
    </button>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function isDropdown(item: NavEntry): item is NavDropdown {
  return 'children' in item;
}

function SellerSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const { profile, loading: profileLoading } = useGetProfile();

  const isActive = (path: string) => {
    if (path === '/seller/products') return pathname === '/seller/products';
    // Exact match or path prefix with "/" separator (avoids /seller/store matching /seller/stores)
    return pathname === path || pathname.startsWith(path + '/');
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdowns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      style={{
        width: 220, background: '#141413',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Logo + Store selector */}
      <div style={{ padding: '20px 20px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <SolvexoIcon size={32} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Solvex</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#D97757', letterSpacing: '-0.3px' }}>o</span>
          </div>
        </div>

        {/* Store selector */}
        <SidebarStoreSwitcher />
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
              if (isDropdown(item)) {
                const isOpen = openDropdowns[item.id] ?? false;
                const anyChildActive = item.children.some(c => isActive(c.path));
                return (
                  <div key={item.id} style={{ marginBottom: 2 }}>
                    <div
                      onClick={() => toggleDropdown(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px', borderRadius: 8,
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                    >
                      <item.Icon
                        size={15}
                        style={{
                          opacity: anyChildActive ? 1 : 0.45,
                          color: anyChildActive ? '#D97757' : '#8C8A82',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{
                        fontSize: 13,
                        fontWeight: anyChildActive ? 600 : 400,
                        color: anyChildActive ? '#FFFFFF' : '#8C8A82',
                        flex: 1,
                      }}>
                        {item.label}
                      </span>
                      <ChevronDown
                        size={14}
                        style={{
                          color: '#8C8A82',
                          transition: 'transform 0.2s',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </div>
                    {isOpen && (
                      <div style={{ paddingLeft: 18 }}>
                        {item.children.map(child => {
                          const active = isActive(child.path);
                          return (
                            <div
                              key={child.id}
                              onClick={() => navigate(child.path)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                                cursor: 'pointer',
                                background: active ? '#1E1C1A' : 'transparent',
                                transition: 'background 0.15s',
                              }}
                            >
                              <child.Icon
                                size={13}
                                style={{
                                  opacity: active ? 1 : 0.45,
                                  color: active ? '#D97757' : '#8C8A82',
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{
                                fontSize: 12,
                                fontWeight: active ? 600 : 400,
                                color: active ? '#FFFFFF' : '#8C8A82',
                                flex: 1,
                              }}>
                                {child.label}
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
                    )}
                  </div>
                );
              }

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
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1E1C1A', flexShrink: 0 }}>
        {/* <div style={{ background: '#1E1C1A', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
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
        </div> */}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: '#2C2A28', display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden',
          }}>
            {profileLoading
              ? <div className="animate-pulse" style={{ width: '100%', height: '100%', background: '#3C3A38' }} />
              : profile?.profileImage
                ? <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 10, fontWeight: 700, color: '#D97757' }}>{profile?.name?.slice(0, 2).toUpperCase() ?? '--'}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {profileLoading ? (
              <>
                <div className="animate-pulse" style={{ width: 80, height: 11, borderRadius: 3, background: '#2C2A28', marginBottom: 4 }} />
                <div className="animate-pulse" style={{ width: 110, height: 9, borderRadius: 3, background: '#2C2A28' }} />
              </>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name ?? '—'}</p>
                <p style={{ fontSize: 10, color: '#8C8A82', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email ?? '—'}</p>
              </>
            )}
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
    <ActiveStoreProvider>
      <div style={{ display: 'flex', height: '100vh', background: '#FAF9F5', overflow: 'hidden' }}>
        <SellerSidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </ActiveStoreProvider>
  );
}
