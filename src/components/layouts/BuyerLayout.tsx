import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Home, Search, ShoppingCart, FileText, UserCircle, Gift } from 'lucide-react';
import { TokenStorage } from '@/api/services/auth';
import { useCartContext } from '@/contexts/CartContext';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { AnnouncementBanner, AppOpenPrompt, AppOpenFab, Button, SearchBox } from '@/components/comman/ui';

// ── Guest sign-in bar — sits directly above the bottom nav, guests only.
// Floating rounded card (same `mx-3` margin + radius family as the nav pill
// below it) instead of a full-bleed, square-cornered strip — the two used to
// read as unrelated pieces stacked on top of each other. Warm brand gradient
// (not plain white) + a glowing icon chip so it reads as an on-theme promo
// nudge. `.guest-bar-rise` (paired with `relative z-10`, one step below the
// nav's own `z-20` in BuyerLayout below) makes it visibly rise up from
// behind the nav pill on arrival, rather than just fading in in place. The
// "Sign In" button is bumped up a size and given the same gradient+glow
// language as the bottom nav's own elevated Cart button (not a plain flat
// fill) plus `.countdown-pulse` (reused as-is — the same gentle breathing
// scale the Flash Sale countdown already uses) so it keeps drawing the eye
// after it lands instead of going fully static. ──
function GuestSignInBar() {
  const navigate = useNavigate();
  return (
    <div className="guest-bar-rise relative z-10 mx-3 mb-2 flex items-center justify-between gap-2 px-3 py-[6px] rounded-[16px] bg-gradient-to-r from-brand-pale-orange via-[#fdf1ea] to-white border border-brand-orange/15 shadow-[0_6px_18px_-6px_rgba(20,15,10,0.14)]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex size-6 items-center justify-center rounded-full bg-white shrink-0">
          <Gift size={12} className="text-brand-orange" />
        </span>
        <span className="text-[11.5px] font-medium text-charcoal truncate">Sign in for a better shopping experience</span>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate('/login')}
        className="countdown-pulse shrink-0 px-4 rounded-xl! bg-gradient-to-br from-brand-orange to-brand-deep-orange shadow-[0_6px_16px_-2px_rgba(217,119,87,0.55)] border-2 border-white"
      >
        Sign In
      </Button>
    </div>
  );
}

// ── Bottom navigation tab bar (mobile only) ───────────────────────────────────
// Floating rounded pill (not an edge-to-edge bar) with the Cart tab raised
// into a circular button that pops above it — still the same 5 tabs as
// before (Home/Shop/Orders/Cart/Account), just reordered so the elevated
// one lands in the middle and restyled to match. `elevated` is the only new
// flag — everything else about a tab (path/auth/badge) works exactly as it
// did.
interface BottomTab {
  id:            string;
  Icon:          typeof Home;
  label:         string;
  path:          string;
  badge?:        number;
  authRequired?: boolean;
  elevated?:     boolean;
}

function BottomNav({ isLoggedIn, onOpenSearch }: { isLoggedIn: boolean; onOpenSearch: () => void }) {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { cartCount } = useCartContext();
  const { profile }   = useGetProfile();

  const tabs: BottomTab[] = [
    { id: 'home',    Icon: Home,         label: 'Home',    path: '/'                             },
    { id: 'shop',    Icon: Search,       label: 'Search',    path: '/marketplace'                  },
    { id: 'cart',    Icon: ShoppingCart, label: 'Cart',    path: '/cart',   badge: cartCount, authRequired: true, elevated: true },
    { id: 'orders',  Icon: FileText,     label: 'Orders',  path: '/account/orders',    authRequired: true },
    // No `authRequired` — a guest can open this tab too; AccountDashboard
    // itself now renders a "Sign in or Register" guest state instead of
    // fetching real account data (see AccountDashboard.tsx), so the page
    // never 401s out from under them.
    { id: 'account', Icon: UserCircle,   label: 'Account', path: '/account/dashboard' },
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

  const cartTab = tabs.find(t => t.elevated);

  return (
    // The FAB is deliberately rendered OUTSIDE `<nav>` below, as a sibling —
    // `mask-image` composites an element and its whole subtree as one unit,
    // so a masked <nav> cuts through anything positioned inside it too
    // (that's what turned the button itself into a crescent before: the
    // notch was cutting through the button, not just the bar behind it).
    // Keeping the FAB out of the masked subtree and absolutely centering it
    // on this wrapper's own top-center — the same point the mask is
    // centered on — lands it exactly over the cut with no gap, while the
    // bar's mask only ever touches the bar's own background.
    <div className="relative">
      <nav className="bottom-nav-notch relative z-20 mx-3 mb-2 rounded-[22px] bg-white border border-bone shadow-[0_10px_28px_-8px_rgba(20,15,10,0.18),0_2px_10px_rgba(20,15,10,0.06)]">
      <div className="flex items-stretch px-1">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          const showAvatar = tab.id === 'account' && isLoggedIn && profile?.profileImage;

          // Just a spacer reserving this column's width so the other 4
          // tabs stay evenly distributed — the real, visible FAB is the
          // sibling button rendered after `</nav>` below.
          if (tab.elevated) {
            return <div key={tab.id} className="flex-1" />;
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab)}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.badge ? `${tab.label}, ${tab.badge} items` : tab.label}
              className="flex-1 flex flex-col items-center justify-center py-[9px] gap-[3px] cursor-pointer bg-transparent border-none relative"
            >
              {/* Icon (or real avatar photo for the logged-in Account tab) + badge */}
              <div className="relative">
                {showAvatar ? (
                  <img
                    src={profile!.profileImage!}
                    alt=""
                    className={clsx(
                      'size-[20px] rounded-full object-cover transition-[box-shadow] duration-150',
                      active ? 'ring-2 ring-brand-orange' : 'ring-1 ring-bone',
                    )}
                  />
                ) : (
                  <tab.Icon
                    size={19}
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

              <span className={clsx(
                'text-[10px] font-medium leading-none transition-colors duration-150',
                active ? 'text-brand-orange' : 'text-slate',
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      </nav>

      {cartTab && (() => {
        const active = isActive(cartTab.path);
        return (
          <button
            onClick={() => handleTab(cartTab)}
            aria-current={active ? 'page' : undefined}
            aria-label={cartTab.badge ? `${cartTab.label}, ${cartTab.badge} items` : cartTab.label}
            className="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center size-[54px] rounded-full bg-gradient-to-br from-brand-orange to-brand-deep-orange border-[3px] border-white shadow-[0_8px_18px_-4px_rgba(217,119,87,0.5),0_2px_6px_rgba(20,15,10,0.15)] cursor-pointer transition-transform duration-150 active:scale-95"
          >
            <cartTab.Icon size={22} strokeWidth={2} className="text-white" />
            {cartTab.badge != null && cartTab.badge > 0 && (
              <span className="absolute -top-[3px] -right-[3px] min-w-[17px] h-[17px] bg-white text-brand-deep-orange text-[9px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none border border-bone">
                {cartTab.badge > 99 ? '99+' : cartTab.badge}
              </span>
            )}
          </button>
        );
      })()}
    </div>
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
      <div className={clsx('page-fade-in', isLoggedIn ? 'pb-[72px]' : 'pb-[116px]', 'md:pb-0')}>
        <AnnouncementBanner audience="buyers" />
        <Outlet />
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {!isLoggedIn && <GuestSignInBar />}
        <BottomNav isLoggedIn={isLoggedIn} onOpenSearch={() => setSearchOpen(true)} />
      </div>
      {searchOpen && (
        // This trigger (the bottom nav's Search tab) stays reachable up to
        // 768px (`md:hidden`), wider than SearchBox's own default <640px
        // full-screen threshold — `alwaysFullScreen` makes it take over the
        // whole screen unconditionally here, instead of only below 640px,
        // so there's no width window where it falls back to rendering as a
        // plain in-flow block wherever it happens to be mounted.
        <SearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={submitSearch}
          autoFocus
          onClose={() => setSearchOpen(false)}
          alwaysFullScreen
        />
      )}
      <AppOpenPrompt />
      <AppOpenFab />
    </>
  );
}
