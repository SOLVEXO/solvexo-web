import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Home, Search, ShoppingCart, FileText, UserCircle, Gift } from 'lucide-react';
import { TokenStorage } from '@/api/services/auth';
import { useCartContext } from '@/contexts/CartContext';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { AnnouncementBanner, AppOpenPrompt, AppOpenFab, Button, SearchBox } from '@/components/comman/ui';

// ── Guest sign-in bar — sits directly above the bottom nav, guests only ──────
function GuestSignInBar() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-[10px] bg-gradient-to-r from-brand-pale-orange to-cream border-t border-bone">
      <div className="flex items-center gap-2 min-w-0">
        <Gift size={16} className="text-brand-orange shrink-0" />
        <span className="text-[12px] font-medium text-charcoal truncate">Sign in for a better shopping experience</span>
      </div>
      <Button variant="primary" size="sm" pill onClick={() => navigate('/login')} className="shrink-0">
        Sign In
      </Button>
    </div>
  );
}

// ── Bottom navigation tab bar (mobile only) ───────────────────────────────────
interface BottomTab {
  id:            string;
  Icon:          typeof Home;
  label:         string;
  path:          string;
  badge?:        number;
  authRequired?: boolean;
}

function BottomNav({ isLoggedIn, onOpenSearch }: { isLoggedIn: boolean; onOpenSearch: () => void }) {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { cartCount } = useCartContext();
  const { profile }   = useGetProfile();

  const tabs: BottomTab[] = [
    { id: 'home',    Icon: Home,         label: 'Home',    path: '/'                             },
    { id: 'shop',    Icon: Search,       label: 'Shop',    path: '/marketplace'                  },
    { id: 'orders',  Icon: FileText,     label: 'Orders',  path: '/account/orders',    authRequired: true },
    { id: 'cart',    Icon: ShoppingCart, label: 'Cart',    path: '/cart',   badge: cartCount, authRequired: true },
    { id: 'account', Icon: UserCircle,   label: 'Account', path: '/account/dashboard', authRequired: true },
  ];

  const isActive = (path: string) => {
    const base = path.split('?')[0];
    if (base === '/') return pathname === '/';
    return pathname === base || pathname.startsWith(base + '/');
  };

  const handleTab = (tab: BottomTab) => {
    // "Shop" opens search directly — no page change underneath, matching a
    // native app's dedicated search tab instead of landing on Marketplace
    // first and having to tap search again from there.
    if (tab.id === 'shop') { onOpenSearch(); return; }
    navigate(tab.authRequired && !isLoggedIn ? '/login' : tab.path);
  };

  return (
    <nav className="bg-white border-t border-bone">
      <div className="flex items-stretch">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          const showAvatar = tab.id === 'account' && isLoggedIn && profile?.profileImage;
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab)}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.badge ? `${tab.label}, ${tab.badge} items` : tab.label}
              className="flex-1 flex flex-col items-center justify-center py-[11px] gap-[5px] cursor-pointer bg-transparent border-none relative"
            >
              {/* Icon (or real avatar photo for the logged-in Account tab) + badge */}
              <div className="relative">
                {showAvatar ? (
                  <img
                    src={profile!.profileImage!}
                    alt=""
                    className={clsx(
                      'size-[22px] rounded-full object-cover transition-[box-shadow] duration-150',
                      active ? 'ring-2 ring-brand-orange' : 'ring-1 ring-bone',
                    )}
                  />
                ) : (
                  <tab.Icon
                    size={21}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={clsx(
                      'transition-colors duration-150',
                      active ? 'text-brand-orange' : 'text-slate',
                    )}
                  />
                )}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-[5px] -right-[6px] min-w-[15px] h-[15px] bg-brand-orange text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Active indicator — a small bar under the icon, not a text label */}
              <span className={clsx(
                'w-[16px] h-[3px] rounded-full transition-colors duration-150',
                active ? 'bg-brand-orange' : 'bg-transparent',
              )} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── BuyerLayout ───────────────────────────────────────────────────────────────
// Thin shell that adds the fixed bottom nav (+ guest sign-in bar above it) to
// every buyer-facing page. Individual pages keep their own top nav (either
// PublicLayout's or their own embedded one). The bottom padding reserves
// space for whichever combination is showing so page content never hides
// behind the fixed bar(s) on mobile.
export function BuyerLayout() {
  const isLoggedIn = TokenStorage.isLoggedIn();
  const navigate = useNavigate();

  // Global search — lives here (not tied to whatever page's own SearchBox
  // instance) so the bottom-nav Search tab can open it from anywhere without
  // first navigating to Marketplace. Uncontrolled query text is fine here;
  // there's no host-page search state to sync with.
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const submitSearch = (term?: string) => {
    const q = (term ?? searchQuery).trim();
    setSearchOpen(false);
    setSearchQuery('');
    navigate(q ? `/marketplace?search=${encodeURIComponent(q)}` : '/marketplace');
  };

  return (
    <>
      <div className={clsx('page-fade-in', isLoggedIn ? 'pb-[64px]' : 'pb-[108px]', 'md:pb-0')}>
        <AnnouncementBanner audience="buyers" />
        <Outlet />
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {!isLoggedIn && <GuestSignInBar />}
        <BottomNav isLoggedIn={isLoggedIn} onOpenSearch={() => setSearchOpen(true)} />
      </div>
      {searchOpen && (
        <SearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={submitSearch}
          autoFocus
          onClose={() => setSearchOpen(false)}
        />
      )}
      <AppOpenPrompt />
      <AppOpenFab />
    </>
  );
}
