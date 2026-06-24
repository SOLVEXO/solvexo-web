import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Home, Store, ShoppingCart, Package, UserCircle } from 'lucide-react';
import { TokenStorage } from '@/api/commerce/auth';
import { useCartContext } from '@/contexts/CartContext';

// ── Bottom navigation tab bar (mobile only) ───────────────────────────────────
interface BottomTab {
  id:            string;
  Icon:          typeof Home;
  label:         string;
  path:          string;
  badge?:        number;
  authRequired?: boolean;
}

function BottomNav() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { cartCount } = useCartContext();
  const isLoggedIn   = TokenStorage.isLoggedIn();

  const tabs: BottomTab[] = [
    { id: 'home',    Icon: Home,         label: 'Home',    path: '/'                             },
    { id: 'shop',    Icon: Store,        label: 'Shop',    path: '/marketplace'                  },
    { id: 'cart',    Icon: ShoppingCart, label: 'Cart',    path: '/cart',   badge: cartCount     },
    { id: 'orders',  Icon: Package,      label: 'Orders',  path: '/account/profile?tab=orders',  authRequired: true },
    { id: 'account', Icon: UserCircle,   label: 'Account', path: '/account/profile',             authRequired: true },
  ];

  const isActive = (path: string) => {
    const base = path.split('?')[0];
    if (base === '/') return pathname === '/';
    return pathname === base || pathname.startsWith(base + '/');
  };

  const handleTab = (tab: BottomTab) => {
    navigate(tab.authRequired && !isLoggedIn ? '/login' : tab.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-bone md:hidden">
      <div className="flex items-stretch">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab)}
              className="flex-1 flex flex-col items-center justify-center pt-[10px] pb-[12px] gap-[4px] cursor-pointer bg-transparent border-none relative"
            >
              {/* Active pill at top edge */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[28px] h-[3px] bg-brand-orange rounded-b-full" />
              )}

              {/* Icon + badge */}
              <div className="relative">
                <tab.Icon
                  size={21}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={clsx(
                    'transition-colors duration-150',
                    active ? 'text-brand-orange' : 'text-slate',
                  )}
                />
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-[5px] -right-[6px] min-w-[15px] h-[15px] bg-brand-orange text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={clsx(
                'text-[9.5px] font-medium leading-none transition-colors duration-150',
                active ? 'text-brand-orange' : 'text-slate',
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── BuyerLayout ───────────────────────────────────────────────────────────────
// Thin shell that adds the fixed bottom nav to every buyer-facing page.
// Individual pages keep their own top nav (either PublicLayout's or their own embedded one).
// The pb-[64px] ensures page content isn't hidden behind the fixed bottom nav on mobile.
export function BuyerLayout() {
  return (
    <>
      <div className="pb-[64px] md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}
