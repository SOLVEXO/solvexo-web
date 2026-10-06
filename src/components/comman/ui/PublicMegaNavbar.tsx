import { useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import {
  Store, ChevronDown, ArrowRight, Plus, Building2, ShieldCheck,
  MonitorSmartphone, PackageCheck, Users,
} from 'lucide-react';
import { SolvexoLogo } from './SolvexoLogo';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { TokenStorage } from '@/api/services/auth';
import { ProfileAvatar } from './ProfileAvatar';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { useCompactOnScroll } from './BuyerNavbar';
import { PLATFORM_PRODUCTS, ALL_PLATFORM_PRODUCTS } from '@/features/buyer/data/platformProducts';
import { PRODUCT_ICONS } from '@/components/comman/mockups/ProductMockups';

const NAV_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Verified against Shopify's real, live mega-menu (fetched directly, not
// guessed from a screenshot) — same 5 group labels, each slug swapped for a
// genuinely real Solvexo capability instead of a 1:1 feature match (Solvexo
// has no Shop App/B2B/Social Marketplaces/Test & Launch — those are skipped
// rather than faked; every slug below has a real backend module behind it
// and its own /products/:slug page, see platformProducts.ts).
const PRODUCT_JOURNEY = [
  { stage: 'Build your website', slugs: ['store-builder', 'domains', 'customer-accounts'] },
  { stage: 'Sell anywhere',      slugs: ['pos', 'markets'] },
  { stage: 'Marketing & analytics', slugs: ['analytics', 'discounts', 'ai-commerce', 'loyalty'] },
  { stage: 'Run your business',  slugs: ['orders-customers', 'inventory', 'shipping'] },
  { stage: 'Get paid',           slugs: ['payments', 'checkout'] },
] as const;

// Shopify stacks several labeled groups into one column rather than giving
// every group its own thin column ("Run your business" sits under "Build
// your website", "Get paid" sits under "Marketing & analytics") — reproduced
// with the same 3-text-column shape as the real site.
const PRODUCT_NAV_COLUMNS = [
  [PRODUCT_JOURNEY[0], PRODUCT_JOURNEY[3]],
  [PRODUCT_JOURNEY[1]],
  [PRODUCT_JOURNEY[2], PRODUCT_JOURNEY[4]],
] as const;

// Shopify's own right-panel card ("Non-stop innovation") is static — it
// never changes based on which nav link is hovered, confirmed by fetching
// the live site directly rather than guessing from a screenshot. Matched
// here with the same non-reactive shape: one fixed real screenshot + one
// fixed caption, standing in for Shopify's "Latest updates" list with real,
// honest claims about the platform instead (Solvexo has no changelog feed
// to pull a genuine "updates" list from).
const WHY_SOLVEXO = [
  'Store, POS and inventory share one real-time system',
  'AI Studio built into the dashboard, not a bolt-on',
  'Direct-to-you payouts via your own Stripe account',
] as const;

// Bottom strip, same shape as Shopify's "CUSTOMIZE & EXTEND SHOPIFY" row —
// real, already-existing pages only (no app marketplace/dev platform exists
// here to link to, so this isn't a literal copy of Shopify's 3 items).
const EXPLORE_LINKS = [
  { label: 'For Sellers', desc: 'Grow your business with Solvexo', path: '/sellers' },
  { label: 'Pricing', desc: 'Plans that fit your store', path: '/pricing' },
  { label: 'Security', desc: 'How we protect your account and data', path: '/security' },
] as const;

const COMPANY_LINKS = [
  { Icon: Building2,   label: 'About Solvexo', desc: 'Why we built one connected commerce platform', path: '/about' },
  { Icon: ShieldCheck, label: 'Security', desc: 'How we protect your account, data and payments', path: '/security' },
];

type MenuKey = 'products' | 'company' | null;

// Every public route whose page opens on a full-bleed dark hero — audited
// directly against each page file: Homepage (`bg-carbon`), ForSellersPage
// (a dark `#141413→#2C2A28` gradient), and every `/solutions/:slug` detail
// page (SolutionPage — a full-bleed image with a `from-carbon` gradient
// overlay, shared by every solution regardless of slug). Every other public
// route (About, Pricing, FAQ, Contact, the legal pages, Products/Solutions
// overviews, individual product pages) starts on `bg-white`/`bg-cream`,
// where the header's default opaque state already reads fine.
//
// `/solutions/:slug` needs a prefix check rather than a literal entry since
// the slug varies — exported as a match function (not a plain array) so
// PublicLayout's top-padding compensation and this file's own `overHero`
// flag can never drift apart on how a route is classified.
const EXACT_DARK_HERO_ROUTES = ['/', '/sellers'];
export function isDarkHeroRoute(pathname: string) {
  return EXACT_DARK_HERO_ROUTES.includes(pathname) || pathname.startsWith('/solutions/');
}

// Hover state is a plain CSS underline that grows from the left (`group` +
// `group-hover:scale-x-100`) — the reference nav's link-hover language,
// replacing the old sliding "pill" background. `active` keeps its own
// shared-layoutId underline (a genuinely different signal: which menu is
// currently open, not just hovered) so the two never fight for the same pixel.
function DesktopMenuButton({ label, active, light, onClick }: {
  label: string; active: boolean; light: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'group relative flex items-center gap-1 text-[13px] font-medium px-3 py-[7px] bg-transparent border-none cursor-pointer transition-colors duration-300',
        active ? 'text-brand-orange' : light ? 'text-white/90 hover:text-white' : 'text-charcoal hover:text-brand-orange',
      )}
    >
      {label} <ChevronDown size={13} className={clsx('transition-transform duration-200', active && 'rotate-180')} />
      {!active && (
        <span
          aria-hidden
          className={clsx(
            'pointer-events-none absolute left-3 right-7 -bottom-[1px] h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-500 ease-out group-hover:scale-x-100',
            light ? 'bg-white' : 'bg-brand-orange',
          )}
        />
      )}
      {/* Shared layoutId — Motion animates this underline sliding between
         whichever top-level item is currently active instead of it just
         appearing/disappearing under a new item. */}
      {active && (
        <motion.span
          layoutId="nav-active-underline"
          className="absolute left-3 right-7 -bottom-[1px] h-[2px] rounded-full bg-brand-orange"
          transition={{ duration: 0.25, ease: NAV_EASE }}
        />
      )}
    </button>
  );
}

// Same underline-hover language as DesktopMenuButton, for the two plain
// links (Pricing, For Sellers) that have no dropdown/active-open concept.
function DesktopNavLink({ to, label, light }: {
  to: string; label: string; light: boolean;
}) {
  return (
    <Link
      to={to}
      className={clsx(
        'group relative text-[13px] font-medium transition-colors duration-300 px-3 py-[7px]',
        light ? 'text-white/90 hover:text-white' : 'text-charcoal hover:text-brand-orange',
      )}
    >
      {label}
      <span
        aria-hidden
        className={clsx(
          'pointer-events-none absolute left-3 right-3 -bottom-[1px] h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-500 ease-out group-hover:scale-x-100',
          light ? 'bg-white' : 'bg-brand-orange',
        )}
      />
    </Link>
  );
}

// Real hamburger→X bar morph (two bars rotating/translating to converge),
// not an icon swap — the touch target is a full 44px even though the
// visible glyph is small.
function MobileMenuButton({ open, light, onClick }: { open: boolean; light: boolean; onClick: () => void }) {
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0 : 0.32, ease: NAV_EASE };
  const barClass = clsx('absolute w-[19px] h-[1.5px] rounded-full transition-colors duration-300', light ? 'bg-white' : 'bg-carbon');
  return (
    <button
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls="mobile-nav-panel"
      className="lg:hidden relative flex items-center justify-center w-11 h-11 -mr-1 bg-transparent border-none cursor-pointer"
    >
      <motion.span
        className={barClass}
        animate={{ y: open ? 0 : -4, rotate: open ? 45 : 0 }}
        transition={transition}
      />
      <motion.span
        className={barClass}
        animate={{ y: open ? 0 : 4, rotate: open ? -45 : 0 }}
        transition={transition}
      />
    </button>
  );
}

// ── Mobile overlay motion choreography ──────────────────────────────────────
// Panel reveals via clip-path wipe (not a side drawer). Rows live behind an
// `overflow-hidden` mask each and slide up into place, staggered by the
// parent list container — matches the "slide upward from behind a mask"
// choreography rather than a simultaneous fade.
const navListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.14 } },
};
const navRowVariants: Variants = {
  hidden: { y: '100%' },
  show: { y: '0%', transition: { duration: 0.55, ease: NAV_EASE } },
};
const navFadeVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: NAV_EASE } },
};

// ── Desktop mega-menu panel choreography — clip-path + opacity on the
// container, then a staggered internal reveal for whichever dropdown is
// currently open, so content always enters with the same "expensive" feel
// regardless of which of the 4 very differently-laid-out panels is showing.
// No blur (tried, dropped — read as sluggish, not "materializing").
const panelVariants: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' },
  show: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.3, ease: NAV_EASE } },
  exit: { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.18, ease: NAV_EASE } },
};
const panelContentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
// Real spring physics (type:'spring'), not an eased duration — this is what
// actually reads as "modern app" motion (Linear/Raycast/Vercel all use
// spring-driven reveals, not eased tweens) rather than a fixed-duration fade.
const panelItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 26, mass: 0.7 } },
};

// Mask reveal for each panel's one big editorial headline — the exact same
// "text slides up from behind a clipped edge" move the mobile nav overlay's
// own rows already use (`navRowVariants` above), reused here instead of a
// second, unrelated animation vocabulary, so the desktop panels feel like
// they belong to the same app rather than a different template. Only ever
// wraps ONE prominent line per panel (never a whole list) — a mask reveal on
// several rapid-fire rows reads as busy, not premium.
const maskRevealVariants: Variants = {
  hidden: { y: '110%' },
  show: { y: '0%', transition: { duration: 0.5, ease: NAV_EASE } },
};

// A small, fixed-height abstract graphic for the Products panel's static
// right card — matching Shopify's own "Non-stop innovation" art, which is a
// smooth abstract collage, not a literal cluttered screenshot shrunk down.
// Reusing a real interactive mockup here (tried earlier) made the panel both
// too tall for a typical viewport AND visually busy at this small size — a
// purpose-built, fixed h-[96px] graphic solves both at once.
function ConnectedPlatformGlyph() {
  const items = [
    { Icon: Store, label: 'Storefront' },
    { Icon: MonitorSmartphone, label: 'POS' },
    { Icon: PackageCheck, label: 'Inventory' },
    { Icon: Users, label: 'Orders' },
  ];
  return (
    <div className="relative h-[96px] rounded-xl bg-gradient-to-br from-brand-orange/25 via-accent-violet/10 to-transparent border border-white/10 overflow-hidden flex items-center justify-center gap-3">
      {items.map(({ Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Icon size={16} className="text-white" />
          </span>
          <span className="text-[8px] font-semibold text-white/40 uppercase tracking-[0.04em]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function PublicMegaNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sellEntry = useSellEntry();
  const { scrolled } = useCompactOnScroll();
  const overHero = isDarkHeroRoute(pathname) && !scrolled;
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<'products' | 'company' | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState(PLATFORM_PRODUCTS[0].slug);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const openNow = useCallback((key: MenuKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  }, []);
  const closeSoon = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  }, []);
  const closeMenu = useCallback(() => setMobileOpen(false), []);

  // Desktop dropdowns close on Escape or a click outside the header — not
  // just on mouse-leave, so keyboard/touch users have a real way out too.
  useEffect(() => {
    if (!openMenu) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenu(null);
    }
    function onPointerDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [openMenu]);

  // Lock the page underneath while the overlay is open — the overlay itself
  // scrolls independently (`overscroll-contain`), the homepage must not.
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  // Accordions reset closed each time the panel is reopened, rather than
  // remembering whatever was expanded on a previous visit.
  useEffect(() => {
    if (!mobileOpen) setExpanded(null);
  }, [mobileOpen]);

  const loggedIn = TokenStorage.isLoggedIn();

  return (
    <>
      <header
        ref={navRef}
        className={clsx(
          // `fixed`, not `sticky` — a sticky header still occupies its own
          // slot in normal flow above whatever comes next, so making it
          // transparent there just exposes the *page's* white background,
          // not the hero (which only starts after that slot). `fixed` pulls
          // it out of flow entirely so it floats directly over the hero's
          // own full-bleed background, letting the transparent state
          // actually show hero through it. PublicLayout compensates with
          // top padding on every route except the homepage, whose hero
          // already reaches all the way up to y:0 on purpose.
          'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out border-b',
          // Flat/plain at the very top, then a solid white bar once scrolled
          // — kept fully opaque (no translucency/blur) so it reads as a
          // clean, definite bar rather than a glass panel. On the homepage's
          // dark hero specifically, the unscrolled state is fully
          // transparent instead of `bg-white` so the header reads as part
          // of the hero, not a white bar painted over it.
          overHero
            ? 'bg-transparent border-transparent'
            : scrolled
              ? 'bg-white border-bone/60 shadow-[0_1px_2px_rgba(20,15,10,0.04),0_12px_28px_-14px_rgba(20,15,10,0.16)]'
              : 'bg-white border-transparent',
        )}
        onMouseLeave={closeSoon}
      >
        <div className={clsx(
          'max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4',
          'transition-[height] duration-300 ease-out',
          // Grows slightly once scrolled instead of shrinking — the bar
          // reads as a deliberately roomier surface, not a compacted one.
          // Trimmed down from the original 76px/64px, but kept tall enough
          // to leave real breathing room above the logo/nav row rather than
          // feeling pinned to the very top edge.
          scrolled ? 'h-[72px]' : 'h-[64px]',
        )}>
          <Link to="/" className="shrink-0" aria-label="Solvexo home">
            <SolvexoLogo size={28} variant={overHero ? 'light' : 'dark'} />
          </Link>

          {/* Desktop nav — a shared sliding highlight (layoutId) follows
             whichever item the cursor is over, so switching between items
             reads as one indicator travelling rather than each hover state
             popping in fresh — the actual "modern nav" cue, independent of
             the navbar's own background color/theme. */}
          <nav className="hidden lg:flex items-center gap-1">
            <div onMouseEnter={() => openNow('products')}>
              <DesktopMenuButton
                label="Products" active={openMenu === 'products'} light={overHero}
                onClick={() => openNow(openMenu === 'products' ? null : 'products')}
              />
            </div>
            <div onMouseEnter={() => openNow('company')}>
              <DesktopMenuButton
                label="Company" active={openMenu === 'company'} light={overHero}
                onClick={() => openNow(openMenu === 'company' ? null : 'company')}
              />
            </div>
            <div onMouseEnter={() => openNow(null)}>
              <DesktopNavLink to="/pricing" label="Pricing" light={overHero} />
            </div>
            <div onMouseEnter={() => openNow(null)}>
              <DesktopNavLink to="/sellers" label="For Sellers" light={overHero} />
            </div>
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {loggedIn ? (
              <ProfileAvatar />
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className={clsx(
                    'text-[13px] font-medium transition-colors duration-300 bg-transparent border-none cursor-pointer',
                    overHero ? 'text-white/90 hover:text-white' : 'text-charcoal hover:text-brand-orange',
                  )}
                >
                  Log in
                </button>
                <MagneticButton>
                  <button
                    onClick={sellEntry.go}
                    disabled={sellEntry.loading}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-brand-orange hover:bg-brand-deep-orange transition-colors rounded-lg px-4 py-[9px] border-none cursor-pointer disabled:opacity-60"
                  >
                    Start Selling
                  </button>
                </MagneticButton>
              </>
            )}
          </div>

          {/* Mobile/tablet header controls — kept deliberately minimal: "Log
             in" (a returning seller's primary action, so it stays visible at
             every width, not buried inside the hamburger panel), an optional
             compact CTA (hidden on the smallest phones so the header never
             feels crowded at 320–414px), and the menu toggle. */}
          <div className="lg:hidden flex items-center gap-1.5 shrink-0">
            {!loggedIn && (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className={clsx(
                    'text-[12.5px] font-medium transition-colors duration-300 bg-transparent border-none cursor-pointer px-1.5',
                    overHero ? 'text-white/90 hover:text-white' : 'text-charcoal hover:text-brand-orange',
                  )}
                >
                  Log in
                </button>
                <button
                  onClick={sellEntry.go}
                  disabled={sellEntry.loading}
                  className="hidden sm:inline-flex items-center text-[12.5px] font-semibold text-white bg-brand-orange hover:bg-brand-deep-orange transition-colors rounded-lg px-3.5 py-[7px] border-none cursor-pointer disabled:opacity-60"
                >
                  Start Selling
                </button>
              </>
            )}
            <MobileMenuButton open={mobileOpen} light={overHero} onClick={() => setMobileOpen(o => !o)} />
          </div>
        </div>

        {/* ── Mega menu panels — Solutions and Learn & Support were removed
           from the navbar (both still exist as real, reachable pages —
           /solutions, /faq, /contact-us — just unlinked from here per
           request). Products = grouped columns + a static feature card.
           Company = a large brand statement beside a plain, minimal link
           list — no icon chips, reads as institutional rather than another
           product-shaped menu. ── */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              key={openMenu}
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onMouseEnter={() => openNow(openMenu)}
              // bg-carbon — the app's own near-black brand token (#141413,
              // already used a few lines down for the Solutions detail
              // panel), not a fresh "black" invented for this one spot.
              className="hidden lg:block absolute left-0 right-0 top-full bg-carbon border-b border-white/10 shadow-2xl overflow-hidden"
              role="menu"
              aria-label={`${openMenu} menu`}
            >
              <motion.div variants={panelContentVariants} initial="hidden" animate="show" className="relative max-w-[1280px] mx-auto px-8 py-7">
                {openMenu === 'products' && (() => {
                  return (
                    <div className="flex flex-col gap-5">
                      {/* No intro headline — confirmed against Shopify's
                         real, live menu that it has none either, starting
                         directly with the group columns (matches the
                         Solutions panel below too, which never had one). */}
                      {/* Primary navigation — Shopify's own dropdown format:
                         plain single-line icon + label rows, grouped under a
                         small caps label, several groups stacked per column
                         (Shopify stacks "RUN YOUR BUSINESS" under "BUILD YOUR
                         WEBSITE" rather than giving every group its own
                         column) instead of a 2-col icon+description card
                         grid. The left accent bar shares one `layoutId`
                         across every row (Motion animates its position/height
                         automatically) instead of each row popping its own
                         bar in/out — reads as one indicator gliding to
                         wherever the cursor is. */}
                      {/* Only this grid scrolls (capped + hidden scrollbar,
                         via the project's existing `scrollbar-hide` utility)
                         — the "Explore Solvexo" strip below it is a sibling,
                         not nested inside it, so it stays pinned/always
                         visible instead of scrolling away with the columns. */}
                      <div className="grid grid-cols-[1fr_1fr_1fr_260px] gap-8 max-h-[320px] min-h-0 overflow-y-auto scrollbar-hide">
                        {PRODUCT_NAV_COLUMNS.map((column, colIdx) => (
                          <motion.div key={colIdx} variants={panelItemVariants} className="flex flex-col gap-5">
                            {column.map(stage => (
                              <div key={stage.stage}>
                                <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.08em] mb-1.5 px-3">{stage.stage}</p>
                                <div className="flex flex-col gap-0.5">
                                  {stage.slugs.map(slug => {
                                    const p = ALL_PLATFORM_PRODUCTS.find(pp => pp.slug === slug);
                                    if (!p) return null;
                                    const Icon = PRODUCT_ICONS[slug] ?? Store;
                                    const active = hoveredProduct === slug;
                                    return (
                                      <Link
                                        key={slug}
                                        to={`/products/${slug}`}
                                        onClick={() => setOpenMenu(null)}
                                        onMouseEnter={() => setHoveredProduct(slug)}
                                        className={clsx(
                                          'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors',
                                          active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]',
                                        )}
                                      >
                                        {active && (
                                          <motion.span
                                            layoutId="products-accent-bar"
                                            transition={{ duration: 0.25, ease: NAV_EASE }}
                                            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-brand-orange"
                                          />
                                        )}
                                        <Icon size={15} className={clsx('shrink-0 transition-colors duration-200', active ? 'text-brand-orange' : 'text-white/40')} />
                                        <span className={clsx('text-[13px] font-medium transition-colors', active ? 'text-white' : 'text-white/70')}>{p.name}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        ))}

                        {/* Secondary — verified against Shopify's real,
                           live menu (fetched directly, not guessed from a
                           screenshot): their right panel is STATIC — the
                           "Non-stop innovation" image + "Latest updates"
                           list never change based on which nav link is
                           hovered. A per-hovered-item live preview (the
                           previous approach here) doesn't match that, and
                           hard-cropping a full interactive mockup down to a
                           fixed box sliced straight through its content —
                           reproduced as one fixed, non-reactive card instead:
                           one real screenshot shown at its natural size (no
                           crop), a fixed caption, then a short list of real,
                           honest platform claims standing in for Shopify's
                           "Latest updates" (Solvexo has no changelog feed to
                           pull a genuine updates list from). */}
                        <motion.div variants={panelItemVariants} className="flex flex-col gap-4 self-start">
                          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 overflow-hidden">
                            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.08em] mb-2">One connected platform</p>
                            <div className="mb-3">
                              <ConnectedPlatformGlyph />
                            </div>
                            <p className="text-[13.5px] font-bold text-white leading-snug">Every tool, one login</p>
                            <p className="text-[11.5px] text-white/50 leading-snug mt-1">
                              Storefront, POS, inventory and orders all share the same real data underneath.
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.08em] mb-1.5 px-1">Why sellers choose Solvexo</p>
                            <div className="flex flex-col gap-1.5">
                              {WHY_SOLVEXO.map(item => (
                                <div key={item} className="flex items-start gap-2 px-1">
                                  <span className="size-1 rounded-full bg-brand-orange mt-[6px] shrink-0" />
                                  <span className="text-[12px] text-white/60 leading-snug">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Bottom strip — same shape as Shopify's "CUSTOMIZE &
                         EXTEND SHOPIFY" row: an eyebrow label beside a few
                         real destinations, filling the panel's full width
                         instead of ending abruptly after the grid above. */}
                      <motion.div variants={panelItemVariants} className="flex flex-wrap items-center gap-x-10 gap-y-3 pt-5 mt-1 border-t border-white/10">
                        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-[0.08em] shrink-0">Explore Solvexo</p>
                        <Link to="/products" onClick={() => setOpenMenu(null)} className="group">
                          <span className="block text-[13px] font-semibold text-white group-hover:text-brand-orange transition-colors">All Products</span>
                          <span className="block text-[11px] text-white/45">{ALL_PLATFORM_PRODUCTS.length} products · one commerce system</span>
                        </Link>
                        {EXPLORE_LINKS.map(l => (
                          <Link key={l.path} to={l.path} onClick={() => setOpenMenu(null)} className="group">
                            <span className="block text-[13px] font-semibold text-white group-hover:text-brand-orange transition-colors">{l.label}</span>
                            <span className="block text-[11px] text-white/45">{l.desc}</span>
                          </Link>
                        ))}
                      </motion.div>
                    </div>
                  );
                })()}

                {openMenu === 'company' && (
                  // Same "don't stretch thin content across the full panel"
                  // fix as Learn & Support, but a genuinely different
                  // composition: two EQUAL-weight editorial columns (big
                  // statement / supporting text + links) instead of a
                  // narrow featured-card-plus-list.
                  <div className="max-w-[880px] mx-auto grid grid-cols-2 gap-16 items-center">
                    <motion.div variants={panelItemVariants} className="overflow-hidden">
                      <motion.p
                        variants={maskRevealVariants}
                        className="text-[26px] font-bold text-white leading-[1.25]"
                        style={{ fontFamily: "'Lora', Georgia, serif" }}
                      >
                        One connected platform, not five separate logins.
                      </motion.p>
                    </motion.div>

                    <motion.div variants={panelItemVariants}>
                      <p className="text-[13px] text-white/55 leading-[1.7] mb-5">
                        That's the whole reason Solvexo exists — see how we think about it.
                      </p>
                      {/* Plain minimal link list — no icon chips, the one
                         panel that deliberately doesn't look product-shaped.
                         Each row nudges right on hover (whileHover), the
                         one motion touch this deliberately-plain panel gets. */}
                      <div className="flex flex-col border-t border-white/10">
                        {COMPANY_LINKS.map(c => (
                          <motion.div key={c.path} whileHover={{ x: 4 }} transition={{ duration: 0.2, ease: NAV_EASE }}>
                            <Link
                              to={c.path}
                              onClick={() => setOpenMenu(null)}
                              className="group flex items-center justify-between gap-2 py-3 border-b border-white/10"
                            >
                              <span>
                                <span className="block text-[14px] font-semibold text-white group-hover:text-brand-orange transition-colors">{c.label}</span>
                                <span className="block text-[11px] text-white/40 mt-0.5">{c.desc}</span>
                              </span>
                              <ArrowRight size={14} className="text-white/25 shrink-0 transition-colors duration-200 group-hover:text-brand-orange" />
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile/tablet navigation overlay — a full-screen panel that wipes
         open via clip-path beneath the persistent header (not a dropdown,
         not a side drawer), with each row revealing from behind its own
         overflow-hidden mask in a staggered choreography. The header above
         stays put — only the menu button itself morphs — so the logo never
         moves. ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav-panel"
            role="navigation"
            aria-label="Mobile navigation"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.55, ease: NAV_EASE } }}
            // Exit runs at ~65% of the enter duration ("exit faster than
            // enter") so closing the menu reads as responsive rather than
            // taking the same unhurried beat as opening it.
            exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.36, ease: NAV_EASE } }}
            className={clsx(
              'lg:hidden fixed left-0 right-0 bottom-0 z-[55] bg-cream',
              // Must always match the header's own live height above
              // (`scrolled ? 'h-[72px]' : 'h-[64px]'`) — a mismatch here
              // gaps/overlaps the overlay against the actual header bar.
              scrolled ? 'top-[72px]' : 'top-[64px]',
            )}
          >
            <motion.div
              variants={navListVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="h-full overflow-y-auto overscroll-contain px-5 sm:px-8 pt-3 flex flex-col"
              style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex-1 flex flex-col">
                <MobileAccordionRow
                  index="01"
                  title="Products"
                  isOpen={expanded === 'products'}
                  onToggle={() => setExpanded(e => (e === 'products' ? null : 'products'))}
                >
                  {ALL_PLATFORM_PRODUCTS.map(p => {
                    const Icon = PRODUCT_ICONS[p.slug] ?? Store;
                    return (
                      <MobileNavRow
                        key={p.slug}
                        to={`/products/${p.slug}`}
                        title={p.name}
                        desc={p.tagline}
                        onNavigate={closeMenu}
                        icon={<Icon size={16} className="text-brand-orange" />}
                      />
                    );
                  })}
                  <Link to="/products" onClick={closeMenu} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-orange py-2.5 px-2">
                    View all products <ArrowRight size={12} />
                  </Link>
                </MobileAccordionRow>

                <MobileAccordionRow
                  index="02"
                  title="Company"
                  isOpen={expanded === 'company'}
                  onToggle={() => setExpanded(e => (e === 'company' ? null : 'company'))}
                >
                  {COMPANY_LINKS.map(c => (
                    <MobileNavRow
                      key={c.path}
                      to={c.path}
                      title={c.label}
                      desc={c.desc}
                      onNavigate={closeMenu}
                      icon={<c.Icon size={16} className="text-brand-orange" />}
                    />
                  ))}
                </MobileAccordionRow>

                <div className="overflow-hidden">
                  <motion.div variants={navRowVariants}>
                    <Link to="/pricing" onClick={closeMenu} className="group flex items-center justify-between py-[18px] border-b border-carbon/10">
                      <span className="text-[26px] sm:text-[30px] font-extrabold text-carbon tracking-tight">Pricing</span>
                      <ArrowRight size={20} className="text-slate transition-transform duration-200 group-active:translate-x-1 group-active:text-brand-orange" />
                    </Link>
                  </motion.div>
                </div>

                <div className="overflow-hidden">
                  <motion.div variants={navRowVariants} className="pt-4">
                    <Link
                      to="/sellers"
                      onClick={closeMenu}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-brand-orange/20 bg-brand-pale-orange px-4 py-4"
                    >
                      <span>
                        <span className="block text-[19px] font-extrabold text-carbon">For Sellers</span>
                        <span className="block text-[12px] text-slate mt-0.5">Grow your business with Solvexo.</span>
                      </span>
                      <ArrowRight size={18} className="text-brand-orange shrink-0 transition-transform duration-200 group-active:translate-x-1" />
                    </Link>
                  </motion.div>
                </div>
              </div>

              <motion.div variants={navFadeVariants} className="flex flex-col gap-2.5 pt-6 mt-6 pb-6 border-t border-carbon/10">
                {loggedIn ? (
                  <div className="flex items-center gap-3 py-1">
                    <ProfileAvatar />
                    <span className="text-[12px] text-slate">Signed in</span>
                  </div>
                ) : (
                  <>
                    <MagneticButton className="block">
                      <motion.div whileTap={{ scale: 0.97 }}>
                        <button
                          onClick={() => { closeMenu(); sellEntry.go(); }}
                          disabled={sellEntry.loading}
                          className="w-full text-[14.5px] font-semibold text-white bg-gradient-to-r from-brand-orange to-brand-deep-orange rounded-xl py-[14px] border-none cursor-pointer disabled:opacity-60"
                        >
                          Start Selling Free
                        </button>
                      </motion.div>
                    </MagneticButton>
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <button
                        onClick={() => { closeMenu(); navigate('/products'); }}
                        className="w-full text-[13.5px] font-medium text-charcoal bg-transparent border border-bone rounded-xl py-3 cursor-pointer"
                      >
                        Explore the Platform
                      </button>
                    </motion.div>
                    <button
                      onClick={() => { closeMenu(); navigate('/login'); }}
                      className="text-[12.5px] font-medium text-slate bg-transparent border-none cursor-pointer py-1.5"
                    >
                      Already selling? <span className="text-brand-orange font-semibold">Log in</span>
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// One accordion row of the mobile panel — a subtle "01/02/03/04" index label
// (app-like section numbering) beside the large editorial title, plus a
// plus indicator that rotates into a cross, expanding into real icon/
// thumbnail rows via a smooth height animation (not a boring instant
// show/hide). Wrapped in its own overflow-hidden mask so it participates in
// the panel's entrance stagger like every other row.
function MobileAccordionRow({ index, title, isOpen, onToggle, children }: {
  index: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden">
      <motion.div variants={navRowVariants} className="border-b border-carbon/10">
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          className="w-full flex items-center justify-between py-[18px] bg-transparent border-none cursor-pointer text-left"
        >
          <span className="flex items-baseline gap-3">
            <span className="text-[11px] font-bold text-brand-orange/60 tabular-nums">{index}</span>
            <span className="text-[26px] sm:text-[30px] font-extrabold text-carbon tracking-tight">{title}</span>
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3, ease: NAV_EASE }}
            className="text-brand-orange shrink-0"
          >
            <Plus size={22} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: NAV_EASE }}
              className="overflow-hidden"
            >
              <div className="pb-4 flex flex-col gap-0.5">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MobileNavRow({ to, title, desc, icon, thumbnail, onNavigate }: {
  to: string;
  title: string;
  desc?: string;
  icon?: ReactNode;
  thumbnail?: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-xl px-2 py-2 active:bg-white transition-colors"
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" loading="lazy" className="w-11 h-11 rounded-lg object-cover shrink-0" />
      ) : icon ? (
        <span className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-carbon">{title}</span>
        {desc && <span className="block text-[12px] text-slate leading-snug mt-0.5 truncate">{desc}</span>}
      </span>
      <ArrowRight size={13} className="text-bone shrink-0 transition-all duration-200 group-active:text-brand-orange group-active:translate-x-0.5" />
    </Link>
  );
}
