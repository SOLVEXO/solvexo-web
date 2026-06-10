import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart2,
  Settings, Sparkles, Bell, ChevronLeft,
} from 'lucide-react';
import { SolvexoIcon } from '@/components/ui/SolvexoLogo';
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
      { id: 'dashboard',  Icon: LayoutDashboard, label: 'Dashboard',  path: 'dashboard'  },
      { id: 'orders',     Icon: Package,         label: 'Orders',     path: 'orders'     },
      { id: 'products',   Icon: ShoppingBag,     label: 'Products',   path: 'products'   },
      { id: 'customers',  Icon: Users,           label: 'Customers',  path: 'customers'  },
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
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const { store, storeId, loading } = useStoreWorkspace();

  const isActive = (seg: string) =>
    pathname === `/seller/store/${storeId}/${seg}`;

  // Store initials
  const initials = store?.name?.slice(0, 2).toUpperCase() ?? '..';

  // AI credits
  const credits    = store?.aiCredits ?? 0;
  const maxCredits = 1000;
  const pct        = Math.min(100, Math.round((credits / maxCredits) * 100));

  return (
    <aside style={{
      width: 220, background: '#141413',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100vh', overflowY: 'auto',
      fontFamily: "'Poppins', sans-serif",
    }}>

      {/* Back to All Stores */}
      <button
        onClick={() => navigate('/seller/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '14px 16px 10px', background: 'transparent', border: 'none',
          cursor: 'pointer', color: '#8C8A82', fontSize: 12, fontWeight: 500,
          transition: 'color 0.15s', textAlign: 'left',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#D97757')}
        onMouseLeave={e => (e.currentTarget.style.color = '#8C8A82')}
      >
        <ChevronLeft size={14} /> All Stores
      </button>

      <div style={{ height: 1, background: '#1E1C1A', margin: '0 12px' }} />

      {/* Store identity */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: '#D97757', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            {loading
              ? <div className="animate-pulse" style={{ width: 36, height: 36, background: '#2C2A28', borderRadius: 9 }} />
              : store?.logo
                ? <img src={store.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <>
                <div className="animate-pulse" style={{ width: 90, height: 12, borderRadius: 3, background: '#2C2A28', marginBottom: 5 }} />
                <div className="animate-pulse" style={{ width: 55, height: 10, borderRadius: 3, background: '#2C2A28' }} />
              </>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {store?.name ?? 'Loading…'}
                </p>
                <p style={{ fontSize: 10, color: '#8C8A82', lineHeight: 1.3 }}>
                  {store?.plan ?? ''}{store?.slug ? ` · /${store.slug}` : ''}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#1E1C1A', margin: '0 12px 6px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
        {NAV.map(section => (
          <div key={section.group} style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: '#4A4845',
              padding: '4px 8px', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 2,
            }}>
              {section.group}
            </p>
            {section.items.map(item => {
              const active = isActive(item.path);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/seller/store/${storeId}/${item.path}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                    cursor: 'pointer',
                    background: active ? '#1E1C1A' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#1A1917'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <item.Icon size={15} style={{ color: active ? '#D97757' : '#8C8A82', flexShrink: 0, opacity: active ? 1 : 0.55 }} />
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : '#8C8A82', flex: 1 }}>
                    {item.label}
                  </span>
                  {active && <div style={{ width: 3, height: 14, borderRadius: 2, background: '#D97757', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: AI credits */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1E1C1A' }}>
        <div style={{ background: '#1E1C1A', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={11} style={{ color: '#D97757' }} />
              <span style={{ fontSize: 11, color: '#8C8A82' }}>AI Credits</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#D97757' }}>
              {credits}/{maxCredits}
            </span>
          </div>
          <div style={{ height: 4, background: '#2C2A28', borderRadius: 2 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#D97757', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SolvexoIcon size={20} />
          <p style={{ fontSize: 11, color: '#4A4845' }}>Solvexo Store</p>
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
    setLoading(true);
    setError('');
    apiGetStoreById(storeId)
      .then(res => { if (!cancelled) setStore(res.data); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load store.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
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
      <div style={{ display: 'flex', height: '100vh', background: '#FAF9F5', overflow: 'hidden' }}>
        <StoreSidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </StoreWorkspaceProvider>
  );
}
