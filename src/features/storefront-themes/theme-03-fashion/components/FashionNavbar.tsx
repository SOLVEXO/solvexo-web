import { useEffect, useMemo, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStorefront, type StorefrontNavItemSettings, type ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
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
import { headerNavCss, logoImageProps, readHeaderOptions } from '../../navigation/headerOptions';
import { fashionTheme as t } from '../theme.config';
import { FashionPredictiveSearch } from './browse/FashionPredictiveSearch';
import { FashionLocaleControls } from './FashionLocaleControls';
import { FashionMobileNav } from './nav/MobileNavPanel';
import { FashionSectionRenderer } from '../sections';
import { EditableText } from '../../inlineEdit';
import { HeaderCta, HeaderTopBar } from './nav/HeaderExtras';

/** Fashion header: centered wordmark between the menu (left) and the icons (right), thin rule, calm hover states. */
export function FashionNavbar() {
  const { store, theme, resolveLink } = useStorefront();
  const locale = useContentLocale();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { cartCount } = useCartContext();
  const { wishlistCount } = useWishlistContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);
  const [pages, setPages] = useState<PublicPageSummary[]>([]);

  const header = theme?.header;
  const o = readHeaderOptions(header, 'Journal');
  const transparent = o.transparentOnHome && pathname === '/';
  const scroll = useHeaderScroll(o.stickyMode, transparent);

  useEffect(() => {
    let off = false;
    apiGetPublicCollections(store.storeId).then(r => { if (!off) setCollections(r.data ?? []); }).catch(() => {});
    apiListPublicStorePages(store.storeId).then(r => { if (!off) setPages(r.data ?? []); }).catch(() => {});
    return () => { off = true; };
  }, [store.storeId]);

  const items: ResolvedStorefrontNavItem[] = useMemo(() => {
    const lookup = buildNavImageLookup([], collections);
    const authored = (header?.blocks ?? []).filter(b => b.type === 'nav_link' && b.enabled !== false);
    if (authored.length > 0) {
      return normalizeNavItems(authored.map(b => b.settings as StorefrontNavItemSettings), resolveLink, lookup, 'nav', locale);
    }
    const auto: StorefrontNavItemSettings[] = [];
    if (o.showShopMenu) {
      auto.push({
        label: o.shopLabel, linkType: 'search',
        children: collections.slice(0, 8).map(c => ({ label: c.name, linkType: 'collection', collectionId: c.slug || c._id })),
      });
    }
    if (o.includePagesInNav) pages.filter(p => p.showInNav).forEach(p => auto.push({ label: p.title, linkType: 'page', pageSlug: p.slug }));
    if (o.showDefaultBlogLink) auto.push({ label: o.blogLabel, linkType: 'blog' });
    return normalizeNavItems(auto, resolveLink, lookup, 'auto', locale);
  }, [header?.blocks, resolveLink, locale, o.showShopMenu, o.shopLabel, o.includePagesInNav, o.showDefaultBlogLink, o.blogLabel, collections, pages]);

  const bg = o.bgColor ?? t.colors.bg;
  const fg = transparent && scroll.clear ? o.transparentTextColor : o.textColor ?? t.colors.ink;
  const headerBg = transparent && scroll.clear ? 'transparent' : bg;
  const logoUrl = header?.logoSource === 'custom' && header.customLogoUrl ? header.customLogoUrl : store.logo;
  const logo = logoImageProps(o);
  const accountTo = TokenStorage.isLoggedIn() ? '/account' : '/login';
  const scope = 'fx-header';
  const padY = 18 + o.paddingDelta;

  // Seller's header layout (Customize > Header > Layout): logo position, menu position and menu alignment are independent.
  const below = o.menuPosition === 'below';
  const navJustify = o.navAlignment === 'right' ? 'justify-end' : o.navAlignment === 'center' ? 'justify-center' : 'justify-start';
  // Search box (seller option): next to the icons, or centered on its own row between the logo row and the menu row.
  const searchBar = o.showSearch && o.searchStyle === 'bar';
  const centerBar = searchBar && o.searchPosition === 'center';
  const layout = {
    grid: o.logoPosition === 'left' ? 'lg:grid-cols-[auto_1fr_auto]' : o.logoPosition === 'center' ? 'lg:grid-cols-[1fr_auto_1fr]' : 'lg:grid-cols-[1fr_auto_auto]',
    logo: o.logoPosition === 'left' ? '' : 'lg:col-start-2 lg:justify-center',
    nav: `${navJustify} ${below
      ? `lg:col-span-3 lg:col-start-1 lg:pt-2 ${centerBar ? 'lg:row-start-3' : 'lg:row-start-2'}`
      : o.logoPosition === 'left' ? 'lg:col-start-2 lg:row-start-1 lg:px-6' : 'lg:col-start-1 lg:row-start-1'}`,
    rows: below || centerBar ? 'lg:gap-y-1.5' : '',
  };

  const openCart = () => (drawerMounted ? openDrawer() : navigate('/cart'));

  const iconBtn = 'relative flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]';
  const badge = (n: number) => n > 0 && (
    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center px-1 text-[10px] font-semibold" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: 9999 }}>{n > 99 ? '99+' : n}</span>
  );

  const wordmark = logoUrl
    ? <img src={logoUrl} alt={store.name} className={logo.className} style={logo.style} />
    : <span className="whitespace-nowrap text-xl font-semibold leading-none tracking-tight md:text-2xl" style={{ fontFamily: t.fonts.display, color: fg }}>{store.name}</span>;

  return (
    <>
      {o.topBar && <HeaderTopBar bar={o.topBar} fallbackBg={t.colors.ink} fallbackColor={t.colors.bg} fontFamily={t.fonts.body} maxWidth={t.layout.maxWidth} padX={t.layout.containerPadX} />}
      <header ref={el => scroll.attach(el)} data-sx-header={scope} style={{ ...scroll.style, background: headerBg, color: fg, borderBottom: o.showDivider && !(transparent && scroll.clear) ? `1px solid ${t.colors.border}` : '1px solid transparent', fontFamily: t.fonts.body, backdropFilter: o.stickyMode !== 'off' ? 'saturate(1.4) blur(10px)' : undefined }}>
        <style>{headerNavCss(scope, o)}</style>
        <div className={`mx-auto grid grid-cols-[1fr_auto_1fr] items-center ${layout.grid} ${layout.rows}`} style={{ maxWidth: t.layout.maxWidth, padding: `${padY}px ${t.layout.containerPadX}`, columnGap: 16 }}>
          <div className={`col-start-1 row-start-1 flex min-w-0 items-center gap-2 ${layout.logo}`}>
            <button type="button" className={`${iconBtn} lg:hidden`} aria-label={ts('nav.openMenu', 'Open menu')} onClick={() => setMobileOpen(true)} style={{ color: fg }}><Menu size={22} /></button>
            <Link to="/" className="flex items-center no-underline" aria-label={store.name}>{wordmark}</Link>
          </div>

          <div className={`hidden min-w-0 lg:flex ${layout.nav}`}>
            <nav className="hidden flex-wrap items-center justify-center gap-1 lg:flex" aria-label={ts('pg.main', 'Main')}>
              {items.map(item => (
                <div key={item.id} className="group relative">
                  <NavAnchor link={item.link} className="inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium no-underline transition-colors hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]" style={{ color: fg }}>{/^nav-\d+$/.test(item.id) && !header?.menuId ? <EditableText value={item.label} settingKey="label" blockId={item.id} /> : item.label}</NavAnchor>
                  {isMegaItem(item) && (
                    <div className="invisible absolute left-1/2 top-full z-50 w-[min(880px,92vw)] -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <div className="grid gap-x-8 gap-y-6 p-7" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', background: t.colors.bg, border: `1px solid ${t.colors.border}`, borderRadius: 20, boxShadow: '0 18px 40px rgba(0,0,0,.10)' }}>
                        {item.children.map(c => (
                          <div key={c.id}>
                            {c.imageUrl && (
                              <NavAnchor link={c.link} className="mb-3 block overflow-hidden" style={{ borderRadius: 14, aspectRatio: '4 / 3', background: t.colors.bgAlt }}>
                                <img src={c.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                              </NavAnchor>
                            )}
                            <NavAnchor link={c.link} className="mb-2 block text-sm font-semibold no-underline" style={{ color: t.colors.ink }}>{c.label}</NavAnchor>
                            {c.children.map(g => (
                              <NavAnchor key={g.id} link={g.link} className="block py-1 text-[13px] no-underline hover:underline" style={{ color: t.colors.inkMuted }}>{g.label}</NavAnchor>
                            ))}
                          </div>
                        ))}
                        {item.imageUrl && (
                          <NavAnchor link={item.link} className="relative block overflow-hidden" style={{ borderRadius: 14, minHeight: 160, background: t.colors.bgAlt }}>
                            <img src={item.imageUrl} alt={item.label} loading="lazy" className="absolute inset-0 size-full object-cover" />
                          </NavAnchor>
                        )}
                      </div>
                    </div>
                  )}
                  {item.children.length > 0 && !isMegaItem(item) && (
                    <div className="invisible absolute left-0 top-full z-50 min-w-[220px] pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <ul className="m-0 list-none p-2" style={{ background: t.colors.bg, border: `1px solid ${t.colors.border}`, borderRadius: 16, boxShadow: '0 18px 40px rgba(0,0,0,.10)' }}>
                        {item.children.map(c => (
                          <li key={c.id}>
                            <NavAnchor link={c.link} className="block rounded-xl px-4 py-2.5 text-sm no-underline hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]" style={{ color: t.colors.ink }}>{c.label}</NavAnchor>
                            {c.children.map(g => (
                              <NavAnchor key={g.id} link={g.link} className="block rounded-xl px-4 py-1.5 pl-7 text-[13px] no-underline hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]" style={{ color: t.colors.inkMuted }}>{g.label}</NavAnchor>
                            ))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {centerBar && (
            <div className="hidden lg:col-span-3 lg:col-start-1 lg:row-start-2 lg:block" style={{ color: t.colors.ink }}>
              <div className="mx-auto w-full max-w-[560px]">
                <FashionPredictiveSearch inputId="fx-search-bar" placeholder={ts('pg.search_the_collection', 'Search the collection')} maxWidth="100%" />
              </div>
            </div>
          )}

          <div className="col-start-3 row-start-1 flex items-center justify-end gap-0.5" style={{ color: fg }}>
            {o.cta && <HeaderCta cta={o.cta} bg={t.colors.accent} color={t.colors.accentInk} radius={t.buttonRadiusPx} fontFamily={t.fonts.body} />}
            <span className="hidden md:block"><FashionLocaleControls /></span>
            {searchBar && !centerBar && (
              <div className="mr-1 hidden w-[240px] lg:block" style={{ color: t.colors.ink }}>
                <FashionPredictiveSearch inputId="fx-search-bar" placeholder={ts('pg.search_the_collection', 'Search the collection')} maxWidth="100%" />
              </div>
            )}
            {o.showSearch && <button type="button" className={`${iconBtn}${searchBar ? ' lg:hidden' : ''}`} aria-label={ts('nav.search', 'Search')} onClick={() => setSearchOpen(s => !s)} style={{ color: fg }}>{searchOpen ? <X size={20} /> : <Search size={20} />}</button>}
            {o.showAccount && <Link to={accountTo} className={`${iconBtn} hidden sm:flex`} aria-label={ts('nav.account', 'Account')} style={{ color: fg }}><User size={20} /></Link>}
            {o.showWishlist && <Link to="/wishlist" className={`${iconBtn} hidden sm:flex`} aria-label={ts('nav.wishlist', 'Wishlist')} style={{ color: fg }}><Heart size={20} />{badge(wishlistCount)}</Link>}
            <button type="button" className={iconBtn} aria-label={`Cart, ${cartCount} items`} onClick={openCart} style={{ color: fg }}><ShoppingBag size={20} />{badge(cartCount)}</button>
          </div>
        </div>

        {searchOpen && o.showSearch && (
          <div style={{ background: t.colors.bg, borderTop: `1px solid ${t.colors.border}`, borderBottom: `1px solid ${t.colors.border}`, color: t.colors.ink }}>
            <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `20px ${t.layout.containerPadX}` }}>
              <FashionPredictiveSearch inputId="fx-search" placeholder={ts('pg.search_the_collection', 'Search the collection')} maxWidth="720px" onDone={() => setSearchOpen(false)} />
            </div>
          </div>
        )}
      </header>
      {(header?.sections?.length ?? 0) > 0 && <FashionSectionRenderer sections={header?.sections ?? []} />}

      <FashionMobileNav
        open={mobileOpen} onClose={() => setMobileOpen(false)} storeName={store.name} brand={wordmark}
        items={items} shop={null} showSearch={o.showSearch} onSearch={() => setSearchOpen(true)}
        showAccount={o.showAccount} accountTo={accountTo} showWishlist={o.showWishlist} wishlistCount={wishlistCount}
        footer={<FashionLocaleControls />}
      />
    </>
  );
}
