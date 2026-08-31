import { useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import {
  Store, ChevronDown, ArrowRight, Plus, HelpCircle, Mail, Building2, ShieldCheck, Search,
} from 'lucide-react';
import { SolvexoLogo } from './SolvexoLogo';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { TokenStorage } from '@/api/services/auth';
import { ProfileAvatar } from './ProfileAvatar';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { useCompactOnScroll } from './BuyerNavbar';
import { PLATFORM_PRODUCTS } from '@/features/buyer/data/platformProducts';
import { SOLUTIONS } from '@/features/buyer/data/solutions';
import { unsplashUrl } from '@/assets/stockPhotos';
import { mockupForProductSlug, PRODUCT_ICONS } from '@/components/comman/mockups/ProductMockups';

const NAV_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Real products, organized as the actual commerce journey a seller moves
// through — not a technical/database-shaped grouping. Every slug exists in
// PLATFORM_PRODUCTS; there's no "Marketplace" or "Payments" stage since
// neither has a real dedicated public product page (Marketplace stays
// unlinked from public nav by deliberate decision; Payments is a feature
// bullet, not its own product slug — fabricating a page for either would
// violate this project's real-content-only rule).
const PRODUCT_JOURNEY = [
  { stage: 'Build',              slugs: ['store-builder', 'pos'] },
  { stage: 'Operate',            slugs: ['inventory', 'orders-customers'] },
  { stage: 'Grow & Understand',  slugs: ['ai-commerce', 'analytics', 'loyalty'] },
] as const;

// A tiny supporting detail next to each product name — never the primary
// label. Numbering follows journey order, not PLATFORM_PRODUCTS array order.
const PRODUCT_NUMBER: Record<string, string> = {
  'store-builder': '01', pos: '02', inventory: '03', 'orders-customers': '04',
  'ai-commerce': '05', analytics: '06', loyalty: '07',
};

// Tighter, benefit-led one-liners for the nav row specifically — the full
// page (`PlatformProductPage`) keeps its own `tagline`/`heroSubtext` copy;
// this is a nav-only rewording, not a change to the real product data.
const PRODUCT_NAV_BLURB: Record<string, string> = {
  'store-builder':    'Launch a storefront built around your brand.',
  pos:                'Sell in person with every order synced.',
  inventory:          'Know what\'s in stock before it becomes a problem.',
  'orders-customers': 'Every order and customer in one place.',
  'ai-commerce':      'Turn commerce data into useful decisions.',
  analytics:          'See what\'s actually driving your business.',
  loyalty:            'Turn first-time buyers into returning customers.',
};

// "Resources" → "Learn & Support": the label now says what's actually behind
// it (answers, help, contact) instead of a vague catch-all noun that read
// almost identically to "Company" in the old navbar.
const LEARN_LINKS = [
  { Icon: HelpCircle, label: 'FAQ', desc: 'Answers to common questions', path: '/faq' },
  { Icon: Mail,        label: 'Contact Us', desc: 'Reach sales, support or partnerships', path: '/contact-us' },
];

const COMPANY_LINKS = [
  { Icon: Building2,   label: 'About Solvexo', desc: 'Why we built one connected commerce platform', path: '/about' },
  { Icon: ShieldCheck, label: 'Security', desc: 'How we protect your account, data and payments', path: '/security' },
];

type MenuKey = 'products' | 'solutions' | 'learn' | 'company' | null;

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
const panelVariants: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' },
  show: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.28, ease: NAV_EASE } },
  exit: { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.18, ease: NAV_EASE } },
};
const panelContentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};
const panelItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: NAV_EASE } },
};

// A small, original "Help Center" UI composition for the Learn & Support
// panel's featured slot — deliberately not one of the 7 product mockups
// (which already appear in the Products panel) and not a fabricated blog
// image. A search bar + 3 real question rows pulled straight from this
// panel's own FAQ link, just visualized instead of just linked.
function SupportPreviewMock() {
  const rows = ['Do I need an online store to use POS?', 'Can I change themes after launching?', 'How is AI usage billed?'];
  return (
    <div className="w-full rounded-2xl bg-white overflow-hidden shadow-raised border border-bone">
      <div className="flex items-center gap-2 px-3 py-2 bg-cream border-b border-bone">
        <span className="size-[7px] rounded-full bg-[#e5675b]" />
        <span className="size-[7px] rounded-full bg-[#e8b74e]" />
        <span className="size-[7px] rounded-full bg-[#59c26a]" />
        <span className="ml-2 text-[10px] text-slate truncate">solvexo.com — help center</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 rounded-lg bg-cream border border-bone px-3 py-2 mb-3">
          <Search size={13} className="text-slate shrink-0" />
          <span className="text-[11px] text-slate">Search the Help Center…</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map(r => (
            <div key={r} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-cream transition-colors">
              <span className="text-[11px] text-charcoal leading-snug">{r}</span>
              <ArrowRight size={11} className="text-brand-orange shrink-0" />
            </div>
          ))}
        </div>
      </div>
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
  const [expanded, setExpanded] = useState<'products' | 'solutions' | 'learn' | 'company' | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState(PLATFORM_PRODUCTS[0].slug);
  const [hoveredSolution, setHoveredSolution] = useState(SOLUTIONS[0].slug);
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
  const hoveredSolutionData = SOLUTIONS.find(s => s.slug === hoveredSolution) ?? SOLUTIONS[0];

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
            <div onMouseEnter={() => openNow('solutions')}>
              <DesktopMenuButton
                label="Solutions" active={openMenu === 'solutions'} light={overHero}
                onClick={() => openNow(openMenu === 'solutions' ? null : 'solutions')}
              />
            </div>
            <div onMouseEnter={() => openNow('learn')}>
              <DesktopMenuButton
                label="Learn & Support" active={openMenu === 'learn'} light={overHero}
                onClick={() => openNow(openMenu === 'learn' ? null : 'learn')}
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

        {/* ── Mega menu panels — each one a genuinely different layout, not
           the same card grid re-skinned. Products = category groups + a
           live crossfading/blurring product preview. Solutions = an
           editorial master/detail list, the hovered industry taking over
           the whole right half. Learn & Support = one featured "Help
           Center" visual beside a short utility list. Company = a large
           brand statement beside a plain, minimal link list — the one
           panel with no icon chips at all, so it reads as institutional
           rather than another product-shaped menu. ── */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              key={openMenu}
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onMouseEnter={() => openNow(openMenu)}
              className="hidden lg:block absolute left-0 right-0 top-full bg-white border-b border-bone shadow-xl overflow-hidden"
              role="menu"
              aria-label={`${openMenu} menu`}
            >
              <motion.div variants={panelContentVariants} initial="hidden" animate="show" className="max-w-[1280px] mx-auto px-8 py-7">
                {openMenu === 'products' && (() => {
                  const activeProduct = PLATFORM_PRODUCTS.find(p => p.slug === hoveredProduct);
                  return (
                    <div className="flex flex-col gap-5">
                      {/* Compact editorial header — statement + CTA share one
                         row instead of stacking and eating vertical space. */}
                      <motion.div variants={panelItemVariants} className="flex items-end justify-between gap-6">
                        <div>
                          <p className="text-[10px] font-bold text-brand-orange uppercase tracking-[0.1em] mb-1.5">Products</p>
                          <p className="text-[17px] font-bold text-carbon leading-snug">Everything your commerce business needs.</p>
                        </div>
                        <Link
                          to="/products"
                          onClick={() => setOpenMenu(null)}
                          className="group flex items-center gap-2 shrink-0 text-[12.5px] font-semibold text-carbon hover:text-brand-orange transition-colors whitespace-nowrap pb-0.5"
                        >
                          <span>
                            Explore all products
                            <span className="block text-[10.5px] font-normal text-slate">{PLATFORM_PRODUCTS.length} products · one commerce system</span>
                          </span>
                          <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                      </motion.div>

                      {/* Primary navigation — every product name and
                         description is always visible and always
                         clickable; nothing is hidden behind a number.
                         Grouped by BUILD / OPERATE / GROW & UNDERSTAND so
                         the list still reads as a journey, not a flat
                         dump of seven links. */}
                      <div className="grid grid-cols-[1fr_360px] gap-8">
                        <motion.div variants={panelItemVariants} className="flex flex-col gap-4">
                          {PRODUCT_JOURNEY.map(stage => (
                            <div key={stage.stage}>
                              <p className="text-[10px] font-bold text-slate uppercase tracking-[0.08em] mb-1 px-3">{stage.stage}</p>
                              <div className="grid grid-cols-2 gap-1">
                                {stage.slugs.map(slug => {
                                  const p = PLATFORM_PRODUCTS.find(pp => pp.slug === slug);
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
                                        'group relative flex items-start gap-2.5 rounded-lg pl-4 pr-3 py-2.5 transition-colors',
                                        active ? 'bg-cream' : 'hover:bg-cream/60',
                                      )}
                                    >
                                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-orange" />}
                                      <Icon size={16} className={clsx('shrink-0 mt-0.5 transition-all duration-200', active ? 'text-brand-orange scale-110' : 'text-slate')} />
                                      <span className="min-w-0 flex-1">
                                        <span className="flex items-center justify-between gap-1">
                                          <span className={clsx('block text-[13.5px] font-semibold transition-colors', active ? 'text-carbon' : 'text-charcoal')}>{p.name}</span>
                                          <span className="shrink-0 text-[10px] font-bold text-bone tabular-nums">{PRODUCT_NUMBER[slug]}</span>
                                        </span>
                                        <span className={clsx('block text-[11.5px] leading-snug mt-0.5 transition-opacity', active ? 'text-slate opacity-100' : 'text-slate opacity-80')}>
                                          {PRODUCT_NAV_BLURB[slug] ?? p.tagline}
                                        </span>
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </motion.div>

                        {/* Secondary — the live preview supports the
                           navigation, it isn't the navigation. */}
                        <motion.div variants={panelItemVariants} className="rounded-2xl bg-cream p-5 flex flex-col justify-center self-start overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={hoveredProduct}
                              initial={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                              exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                              transition={{ duration: 0.26, ease: NAV_EASE }}
                            >
                              <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.08em] mb-3">{activeProduct?.name}</p>
                              <div className="w-full [&>div]:shadow-none [&>div]:border-bone/60">
                                {mockupForProductSlug(hoveredProduct)}
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    </div>
                  );
                })()}

                {openMenu === 'solutions' && (
                  <div className="grid grid-cols-[280px_1fr] gap-8">
                    {/* Editorial master list — the hovered industry gets a
                       filled row + accent bar; unhovered ones recede to
                       quieter text, unlike Products' equal-weight grid. */}
                    <div
                      className="flex flex-col gap-0.5"
                      onMouseLeave={() => setHoveredSolution(SOLUTIONS[0].slug)}
                    >
                      {SOLUTIONS.map(s => {
                        const active = s.slug === hoveredSolution;
                        return (
                          <motion.div key={s.slug} variants={panelItemVariants}>
                            <Link
                              to={`/solutions/${s.slug}`}
                              onClick={() => setOpenMenu(null)}
                              onMouseEnter={() => setHoveredSolution(s.slug)}
                              className={clsx(
                                'relative flex items-center justify-between gap-2 rounded-lg pl-4 pr-3 py-3 transition-colors',
                                active ? 'bg-cream' : 'hover:bg-cream/60',
                              )}
                            >
                              {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand-orange" />}
                              <span className={clsx('text-[13.5px] font-semibold transition-colors', active ? 'text-carbon' : 'text-slate')}>{s.name}</span>
                              <ArrowRight size={13} className={clsx('shrink-0 transition-all duration-200', active ? 'text-brand-orange translate-x-0 opacity-100' : '-translate-x-1 opacity-0')} />
                            </Link>
                          </motion.div>
                        );
                      })}
                      <motion.div variants={panelItemVariants}>
                        <Link
                          to="/solutions"
                          onClick={() => setOpenMenu(null)}
                          className="mt-1 flex items-center gap-1.5 rounded-lg pl-4 pr-3 py-2.5 text-[12.5px] font-semibold text-brand-orange hover:bg-cream/60 transition-colors"
                        >
                          All solutions <ArrowRight size={12} />
                        </Link>
                      </motion.div>
                    </div>

                    {/* Large detail panel — real image, real headline,
                       real highlights, changes with the hovered industry. */}
                    <motion.div variants={panelItemVariants} className="relative rounded-2xl overflow-hidden bg-carbon min-h-[280px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={hoveredSolutionData.slug}
                          initial={{ opacity: 0, scale: 1.04 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, ease: NAV_EASE }}
                          className="absolute inset-0"
                        >
                          <img src={unsplashUrl(hoveredSolutionData.image, 640)} alt="" className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/50 to-transparent" />
                        </motion.div>
                      </AnimatePresence>
                      <div className="relative z-[1] h-full flex flex-col justify-end p-6">
                        <p className="text-[10.5px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-2">Built for {hoveredSolutionData.name}</p>
                        <p className="text-[17px] font-bold text-white leading-[1.3] mb-3 max-w-[420px]">{hoveredSolutionData.headline}</p>
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-4">
                          {hoveredSolutionData.highlights.slice(0, 2).map(h => (
                            <span key={h} className="text-[11.5px] text-white/70">{h}</span>
                          ))}
                        </div>
                        <Link
                          to={`/solutions/${hoveredSolutionData.slug}`}
                          onClick={() => setOpenMenu(null)}
                          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white hover:text-brand-orange transition-colors w-fit"
                        >
                          Explore solution <ArrowRight size={13} />
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                )}

                {openMenu === 'learn' && (
                  // Centered and width-capped — this menu only has 3 real
                  // destinations (1 featured + 2 links), so it deliberately
                  // does NOT stretch to fill the full 1280px panel the way
                  // Products/Solutions do. A centered, proportioned block
                  // reads as intentional; left-anchoring the same content
                  // inside the full-width panel read as a stray sidebar
                  // with dead space beside it.
                  <div className="max-w-[760px] mx-auto grid grid-cols-[340px_1fr] gap-10 items-center">
                    {/* Featured slot — one real visual, not a list item. */}
                    <motion.div variants={panelItemVariants}>
                      <Link to="/faq" onClick={() => setOpenMenu(null)} className="group block">
                        <SupportPreviewMock />
                        <p className="text-[13px] font-semibold text-carbon mt-3 group-hover:text-brand-orange transition-colors">Browse the Help Center</p>
                        <p className="text-[11.5px] text-slate mt-0.5">Search real answers before reaching out to support.</p>
                      </Link>
                    </motion.div>

                    {/* Smaller utility links — rendered as two real cards
                       filling their half of the block, not thin rows
                       floating in leftover space beside the featured card. */}
                    <div className="flex flex-col gap-3">
                      {LEARN_LINKS.map(r => (
                        <motion.div key={r.path} variants={panelItemVariants}>
                          <Link
                            to={r.path}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-start gap-3 rounded-xl border border-bone p-4 hover:border-brand-orange/30 hover:bg-cream/60 transition-colors"
                          >
                            <span className="w-10 h-10 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
                              <r.Icon size={17} className="text-brand-orange" />
                            </span>
                            <span>
                              <span className="block text-[13.5px] font-semibold text-carbon">{r.label}</span>
                              <span className="block text-[11.5px] text-slate leading-snug mt-0.5">{r.desc}</span>
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {openMenu === 'company' && (
                  // Same "don't stretch thin content across the full panel"
                  // fix as Learn & Support, but a genuinely different
                  // composition: two EQUAL-weight editorial columns (big
                  // statement / supporting text + links) instead of a
                  // narrow featured-card-plus-list.
                  <div className="max-w-[880px] mx-auto grid grid-cols-2 gap-16 items-center">
                    <motion.div variants={panelItemVariants}>
                      <p className="text-[26px] font-bold text-carbon leading-[1.25]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                        One connected platform, not five separate logins.
                      </p>
                    </motion.div>

                    <motion.div variants={panelItemVariants}>
                      <p className="text-[13px] text-slate leading-[1.7] mb-5">
                        That's the whole reason Solvexo exists — see how we think about it.
                      </p>
                      {/* Plain minimal link list — no icon chips, the one
                         panel that deliberately doesn't look product-shaped. */}
                      <div className="flex flex-col border-t border-bone">
                        {COMPANY_LINKS.map(c => (
                          <Link
                            key={c.path}
                            to={c.path}
                            onClick={() => setOpenMenu(null)}
                            className="group flex items-center justify-between gap-2 py-3 border-b border-bone"
                          >
                            <span>
                              <span className="block text-[14px] font-semibold text-carbon group-hover:text-brand-orange transition-colors">{c.label}</span>
                              <span className="block text-[11px] text-slate mt-0.5">{c.desc}</span>
                            </span>
                            <ArrowRight size={14} className="text-bone shrink-0 transition-all duration-200 group-hover:text-brand-orange group-hover:translate-x-0.5" />
                          </Link>
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
            className="lg:hidden fixed left-0 right-0 top-[64px] bottom-0 z-[55] bg-cream"
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
                  {PLATFORM_PRODUCTS.map(p => {
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
                  title="Solutions"
                  isOpen={expanded === 'solutions'}
                  onToggle={() => setExpanded(e => (e === 'solutions' ? null : 'solutions'))}
                >
                  {SOLUTIONS.map(s => (
                    <MobileNavRow
                      key={s.slug}
                      to={`/solutions/${s.slug}`}
                      title={s.name}
                      desc={s.headline}
                      onNavigate={closeMenu}
                      thumbnail={unsplashUrl(s.image, 80)}
                    />
                  ))}
                  <Link to="/solutions" onClick={closeMenu} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-orange py-2.5 px-2">
                    View all solutions <ArrowRight size={12} />
                  </Link>
                </MobileAccordionRow>

                <MobileAccordionRow
                  index="03"
                  title="Learn & Support"
                  isOpen={expanded === 'learn'}
                  onToggle={() => setExpanded(e => (e === 'learn' ? null : 'learn'))}
                >
                  {LEARN_LINKS.map(r => (
                    <MobileNavRow
                      key={r.path}
                      to={r.path}
                      title={r.label}
                      desc={r.desc}
                      onNavigate={closeMenu}
                      icon={<r.Icon size={16} className="text-brand-orange" />}
                    />
                  ))}
                </MobileAccordionRow>

                <MobileAccordionRow
                  index="04"
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
