import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Clock, Heart, Mail, Menu, Phone, Search, ShoppingCart, User, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useStorefront, type ResolvedStorefrontNavItem, type StorefrontNavItemSettings } from '@/features/storefront/StorefrontContext';
import { useContentLocale } from '@/features/storefront/storefrontMarket';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { TokenStorage } from '@/api/services/auth';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { useCartDrawer } from '../../cartDrawerContext';
import { buildNavImageLookup, isMegaItem, normalizeNavItems } from '../../navigation/megaNav';
import { NavAnchor } from '../../navigation/NavAnchor';
import { useHeaderScroll } from '../../navigation/useHeaderScroll';
import { logoImageProps, readHeaderOptions } from '../../navigation/headerOptions';
import { techTheme as t } from '../theme.config';
import { TechSectionRenderer } from '../sections/TechSectionRenderer';
import { techButtonStyle } from '../ui/techStyle';
import { TechPredictiveSearch } from './TechPredictiveSearch';

type TopBarData = NonNullable<ReturnType<typeof readHeaderOptions>['topBar']>;

/** Slim strip above the header. Everything in it is typed by the seller: hours and showroom line (Theme settings), text, phone and email (Header settings). */
function TopBar({ bar }: { bar: TopBarData }) {
  const color = bar.color ?? t.colors.darkInk;
  const middle = [bar.text, t.topBarShowroom].filter(Boolean).join('   ·   ');
  return (
    <div style={{ background: bar.bg ?? t.colors.dark, color, fontFamily: t.fonts.body }}>
      <div className="mx-auto flex items-center justify-between gap-4 text-xs font-medium" style={{ maxWidth: t.layout.maxWidth, padding: `8px ${t.layout.containerPadX}` }}>
        {t.topBarHours ? <span className="hidden shrink-0 items-center gap-1.5 md:flex"><Clock size={12} aria-hidden /><bdi>{t.topBarHours}</bdi></span> : null}
        <span className="min-w-0 flex-1 truncate sm:text-center">{middle}</span>
        <span className="hidden shrink-0 items-center gap-5 sm:flex">
          {bar.phone && <a href={`tel:${bar.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-1.5 no-underline hover:underline" style={{ color }}><Phone size={12} aria-hidden /><bdi>{bar.phone}</bdi></a>}
          {bar.email && <a href={`mailto:${bar.email}`} className="flex items-center gap-1.5 no-underline hover:underline" style={{ color }}><Mail size={12} aria-hidden /><bdi>{bar.email}</bdi></a>}
        </span>
      </div>
    </div>
  );
}

/** Two-level mega panel: first-level links on the left, the hovered link's own children on the right. The menu allows 3 levels in total. */
function MegaPanel({ item }: { item: ResolvedStorefrontNavItem }) {
  const [active, setActive] = useState(() => item.children.find(c => c.children.length > 0)?.id ?? item.children[0]?.id);
  const current = item.children.find(c => c.id === active) ?? item.children[0];
  return (
    <div className="tx-pop" style={{ background: t.colors.bg, border: `1px solid ${t.colors.border}`, color: t.colors.ink, boxShadow: '0 12px 32px -12px rgba(2,2,3,.25)' }}>
      <div className="grid" style={{ gridTemplateColumns: t.megaFeatured && item.imageUrl ? '280px 1fr 280px' : '280px 1fr', minHeight: 220 }}>
        <ul className="m-0 list-none p-0" style={{ borderRight: `1px solid ${t.colors.border}` }}>
          {item.children.map(c => (
            <li key={c.id} onMouseEnter={() => setActive(c.id)}>
              <NavAnchor link={c.link} onFocus={() => setActive(c.id)} className="flex items-center justify-between px-6 py-3 text-sm font-semibold no-underline"
                style={{ color: t.colors.ink, background: c.id === current?.id ? t.colors.bgAlt : 'transparent' }}>
                {c.label}{c.children.length > 0 && <ChevronRight size={14} aria-hidden className="tx-flip-rtl" />}
              </NavAnchor>
            </li>
          ))}
        </ul>
        <ul className="m-0 grid list-none content-start gap-x-6 p-6 sm:grid-cols-2">
          {current?.children.map(g => (
            <li key={g.id}>
              <NavAnchor link={g.link} className="block py-2 text-sm no-underline hover:underline" style={{ color: t.colors.ink }}>{g.label}</NavAnchor>
            </li>
          ))}
          {current && current.children.length === 0 && (
            <li><NavAnchor link={current.link} className="block py-2 text-sm font-semibold no-underline hover:underline" style={{ color: t.colors.accent }}>{ts('pg.shop_now', 'Shop now')}</NavAnchor></li>
          )}
        </ul>
        {t.megaFeatured && item.imageUrl && (
          <NavAnchor link={item.link} className="relative hidden overflow-hidden no-underline lg:block" style={{ background: t.colors.bgAlt }}>
            <img src={item.imageUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold" style={{ background: 'linear-gradient(transparent, rgba(2,2,3,.65))', color: '#fff' }}>{item.label}</span>
          </NavAnchor>
        )}
      </div>
    </div>
  );
}

function MobileNav({ open, onClose, items, logo, accountTo, wishlistCount }: { open: boolean; onClose: () => void; items: ResolvedStorefrontNavItem[]; logo: React.ReactNode; accountTo: string; wishlistCount: number }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { pathname } = useLocation();
  const first = useRef(pathname);
  useEffect(() => { if (first.current !== pathname) { first.current = pathname; onClose(); } }, [pathname, onClose]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={ts('nav.menu', 'Menu')}>
      <button type="button" aria-label={ts('nav.closeMenu', 'Close menu')} onClick={onClose} className="absolute inset-0 border-0" style={{ background: 'rgba(2,2,3,.5)' }} />
      <div className="absolute inset-y-0 start-0 flex w-[min(88vw,360px)] flex-col overflow-y-auto" style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>
        <div className="flex items-center justify-between p-4" style={{ background: t.colors.accent, color: t.colors.accentInk }}>
          {logo}
          <button type="button" onClick={onClose} aria-label={ts('nav.closeMenu', 'Close menu')} className="grid size-10 cursor-pointer place-items-center border-0 bg-transparent" style={{ color: 'inherit' }}><X size={22} /></button>
        </div>
        <ul className="m-0 list-none p-0">
          {items.map(it => (
            <li key={it.id} style={{ borderBottom: `1px solid ${t.colors.border}` }}>
              <div className="flex items-center">
                <NavAnchor link={it.link} onClick={it.children.length === 0 ? onClose : undefined} className="block flex-1 px-5 py-3.5 text-[15px] font-medium no-underline" style={{ color: t.colors.ink }}>{it.label}</NavAnchor>
                {it.children.length > 0 && (
                  <button type="button" aria-expanded={expanded === it.id} aria-label={ts('pg.open_label_menu', 'Open {{label}} menu', { label: it.label })} onClick={() => setExpanded(e => (e === it.id ? null : it.id))} className="grid size-12 cursor-pointer place-items-center border-0 bg-transparent" style={{ color: t.colors.ink }}>
                    <ChevronDown size={18} aria-hidden className={expanded === it.id ? 'rotate-180' : ''} />
                  </button>
                )}
              </div>
              {expanded === it.id && (
                <ul className="m-0 list-none p-0 pb-2" style={{ background: t.colors.bgAlt }}>
                  {it.children.map(c => (
                    <li key={c.id}>
                      <NavAnchor link={c.link} onClick={onClose} className="block px-8 py-2.5 text-sm font-medium no-underline" style={{ color: t.colors.ink }}>{c.label}</NavAnchor>
                      {c.children.map(g => <NavAnchor key={g.id} link={g.link} onClick={onClose} className="block px-12 py-2 text-[13px] no-underline" style={{ color: t.colors.inkMuted }}>{g.label}</NavAnchor>)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-2 p-5">
          <Link to={accountTo} onClick={onClose} className="no-underline" style={{ color: t.colors.ink }}><User size={16} className="me-2 inline" aria-hidden />{ts('nav.account', 'Account')}</Link>
          <Link to="/wishlist" onClick={onClose} className="no-underline" style={{ color: t.colors.ink }}><Heart size={16} className="me-2 inline" aria-hidden />{ts('nav.wishlist', 'Wishlist')}{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</Link>
        </div>
      </div>
    </div>
  );
}

export function TechNavbar() {
  const { store, theme, resolveLink } = useStorefront();
  const locale = useContentLocale();
  const navigate = useNavigate();
  const { cartCount } = useCartContext();
  const { wishlistCount } = useWishlistContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);
  const [pages, setPages] = useState<PublicPageSummary[]>([]);
  const header = theme?.header;
  const o = readHeaderOptions(header, ts('blog.label', 'Blog'));
  const scroll = useHeaderScroll(t.stickyHeader ? 'always' : 'off', false);
  const variant = t.header;
  const centered = variant === 'centered';
  const searchFirst = variant === 'search-first';
  const padY = variant === 'compact' ? 6 : 12;

  useEffect(() => {
    let off = false;
    apiGetPublicCollections(store.storeId).then(r => { if (!off) setCollections(r.data ?? []); }).catch(() => {});
    apiListPublicStorePages(store.storeId).then(r => { if (!off) setPages(r.data ?? []); }).catch(() => {});
    return () => { off = true; };
  }, [store.storeId]);

  const items: ResolvedStorefrontNavItem[] = useMemo(() => {
    const lookup = buildNavImageLookup([], collections);
    const authored = (header?.blocks ?? []).filter(b => b.type === 'nav_link' && b.enabled !== false);
    if (authored.length > 0) return normalizeNavItems(authored.map(b => b.settings as StorefrontNavItemSettings), resolveLink, lookup, 'nav', locale);
    const auto: StorefrontNavItemSettings[] = [];
    if (o.showShopMenu) auto.push({ label: o.shopLabel, linkType: 'search', menuStyle: 'mega', children: collections.slice(0, 8).map(c => ({ label: c.name, linkType: 'collection', collectionId: c.slug || c._id })) });
    if (o.includePagesInNav) pages.filter(p => p.showInNav).forEach(p => auto.push({ label: p.title, linkType: 'page', pageSlug: p.slug }));
    if (o.showDefaultBlogLink) auto.push({ label: o.blogLabel, linkType: 'blog' });
    return normalizeNavItems(auto, resolveLink, lookup, 'auto', locale);
  }, [header?.blocks, resolveLink, locale, o.showShopMenu, o.shopLabel, o.includePagesInNav, o.showDefaultBlogLink, o.blogLabel, collections, pages]);

  const logoUrl = header?.logoSource === 'custom' && header.customLogoUrl ? header.customLogoUrl : store.logo;
  const logo = logoImageProps(o);
  const accountTo = TokenStorage.isLoggedIn() ? '/account' : '/login';
  const openCart = () => (drawerMounted ? openDrawer() : navigate('/cart'));
  const wordmark = logoUrl
    ? <img src={logoUrl} alt={store.name} className={logo.className} style={logo.style} />
    : <span className="whitespace-nowrap text-xl font-bold leading-none" style={{ fontFamily: t.fonts.display }}>{store.name}</span>;
  const iconBtn = 'relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0';
  const badge = (n: number) => n > 0 && <span className="absolute end-0 top-0 grid h-4 min-w-4 place-items-center px-1 text-[10px] font-semibold" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: 9999 }}>{n > 99 ? '99+' : n}</span>;
  const cta = o.cta;
  // A top bar shows when the seller set any of its content: header text/phone/email, hours or a showroom line.
  const bar: TopBarData | null = o.topBar ?? (t.topBarHours || t.topBarShowroom ? { text: null, phone: null, email: null, bg: null, color: null } : null);

  const logoLink = <NavAnchor link={resolveLink(header?.logoLink ?? { linkType: 'home' })} className="flex shrink-0 items-center no-underline" style={{ color: t.colors.ink }}>{wordmark}</NavAnchor>;
  const menuButton = <button type="button" className={`${iconBtn} lg:hidden`} aria-label={ts('nav.openMenu', 'Open menu')} onClick={() => setMobileOpen(true)} style={{ color: t.colors.ink }}><Menu size={22} /></button>;

  const navList = (className: string): ReactNode => (
    <nav className={`hidden min-w-0 items-center gap-7 lg:flex ${className}`} aria-label={ts('pg.main', 'Main')}>
      {items.map(item => (
        <div key={item.id} className="group relative" data-nav-group={item.id}>
          <NavAnchor link={item.link} className="tx-navlink inline-flex items-center gap-1 whitespace-nowrap py-3 text-sm font-medium no-underline" style={{ color: t.colors.ink }}>
            {item.label}{item.children.length > 0 && <ChevronDown size={13} aria-hidden />}
          </NavAnchor>
          {item.children.length > 0 && (
            <div className={`invisible absolute start-0 top-full z-50 pt-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${isMegaItem(item) ? 'w-[min(920px,92vw)]' : 'min-w-[220px]'}`}>
              {isMegaItem(item) ? <MegaPanel item={item} /> : (
                <ul className="tx-pop m-0 list-none p-2" style={{ background: t.colors.bg, border: `1px solid ${t.colors.border}`, boxShadow: '0 12px 32px -12px rgba(2,2,3,.25)' }}>
                  {item.children.map(c => (
                    <li key={c.id}>
                      <NavAnchor link={c.link} className="block px-4 py-2.5 text-sm no-underline hover:underline" style={{ color: t.colors.ink }}>{c.label}</NavAnchor>
                      {c.children.map(g => <NavAnchor key={g.id} link={g.link} className="block px-4 py-1.5 ps-7 text-[13px] no-underline hover:underline" style={{ color: t.colors.inkMuted }}>{g.label}</NavAnchor>)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
      {cta && (
        <NavAnchor link={cta.link.startsWith('/') ? { to: cta.link } : { href: cta.link }} className="tx-btn tx-btn-sm no-underline" style={{ ...techButtonStyle('outline'), borderRadius: t.buttonRadiusPx }}>{cta.label}</NavAnchor>
      )}
    </nav>
  );

  /** The search icon: opens the search bar (always visible from the large breakpoint in the search-first and centered layouts). */
  const searchToggle = o.showSearch && (
    <button type="button" className={`${iconBtn}${searchFirst || centered ? ' lg:hidden' : ''}`} aria-label={searchOpen ? ts('nav.closeSearch', 'Close search') : ts('nav.search', 'Search')} aria-expanded={searchOpen} onClick={() => setSearchOpen(s => !s)} style={{ color: searchOpen ? t.colors.accent : t.colors.ink }}>
      {searchOpen ? <X size={20} /> : <Search size={20} />}
    </button>
  );
  const icons = (
    <div className="ms-auto flex items-center gap-0.5">
      {searchToggle}
      {o.showWishlist && <Link to="/wishlist" className={`${iconBtn} hidden sm:grid`} aria-label={ts('nav.wishlist', 'Wishlist')} style={{ color: t.colors.ink }}><Heart size={20} />{badge(wishlistCount)}</Link>}
      <button type="button" className={iconBtn} aria-label={ts('nav.cartAria', 'Cart, {{count}} items', { count: cartCount })} onClick={openCart} style={{ color: t.colors.ink }}><ShoppingCart size={20} />{badge(cartCount)}</button>
      {o.showAccount && <Link to={accountTo} className={`${iconBtn} hidden sm:grid`} aria-label={ts('nav.account', 'Account')} style={{ color: t.colors.ink }}><User size={20} /></Link>}
    </div>
  );
  const box = { maxWidth: t.layout.maxWidth, padding: `${padY}px ${t.layout.containerPadX}` };
  const mobileSearch = searchOpen && o.showSearch && (
    <div className="px-4 pb-3 lg:hidden"><div className="mx-auto flex" style={{ maxWidth: t.layout.maxWidth }}><TechPredictiveSearch inputId="tx-search-m" focusOnMount onDone={() => setSearchOpen(false)} /></div></div>
  );

  let rows: ReactNode;
  if (centered) {
    rows = (
      <>
        <div className="mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4" style={box}>
          <div className="flex items-center gap-2">{menuButton}{o.showSearch && <div className="hidden w-[300px] lg:flex"><TechPredictiveSearch inputId="tx-search-c" /></div>}</div>
          {logoLink}
          {icons}
        </div>
        <div className="hidden border-0 border-t lg:block" style={{ borderTopWidth: 1, borderStyle: 'solid', borderColor: t.colors.border }}><div className="mx-auto flex justify-center" style={{ maxWidth: t.layout.maxWidth, padding: `0 ${t.layout.containerPadX}` }}>{navList('')}</div></div>
        {mobileSearch}
      </>
    );
  } else if (searchFirst) {
    rows = (
      <>
        <div className="mx-auto flex items-center gap-4" style={box}>
          {menuButton}{logoLink}
          {o.showSearch ? <div className="hidden max-w-[640px] flex-1 lg:flex"><TechPredictiveSearch inputId="tx-search-f" /></div> : <span className="flex-1" />}
          {icons}
        </div>
        <div className="hidden border-0 border-t lg:block" style={{ borderTopWidth: 1, borderStyle: 'solid', borderColor: t.colors.border }}><div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `0 ${t.layout.containerPadX}` }}>{navList('')}</div></div>
        {mobileSearch}
      </>
    );
  } else {
    rows = (
      <div className="mx-auto flex items-center gap-4" style={box}>
        {menuButton}{logoLink}
        {searchOpen && o.showSearch ? <TechPredictiveSearch inputId="tx-search" focusOnMount onDone={() => setSearchOpen(false)} /> : navList('flex-1 ps-4')}
        {icons}
      </div>
    );
  }

  return (
    <>
      {t.topBar && bar && <TopBar bar={bar} />}
      <header ref={el => scroll.attach(el)} className="relative" style={{ ...scroll.style, background: t.colors.bg, color: t.colors.ink, borderBottom: `1px solid ${t.colors.border}`, fontFamily: t.fonts.body }}>
        {rows}
      </header>
      {(header?.sections?.length ?? 0) > 0 && <TechSectionRenderer sections={header?.sections ?? []} />}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} items={items} logo={wordmark} accountTo={accountTo} wishlistCount={wishlistCount} />
    </>
  );
}
