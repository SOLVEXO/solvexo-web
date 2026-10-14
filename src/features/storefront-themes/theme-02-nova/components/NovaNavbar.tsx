import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, ChevronDown } from 'lucide-react';
import { StorefrontPredictiveSearch } from '@/features/storefront/browse/StorefrontPredictiveSearch';
import { useStorefront, type StorefrontNavItemSettings, type ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCartDrawer } from '../../cartDrawerContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { TokenStorage } from '@/api/services/auth';
import { CurrencySelector } from '@/components/comman/ui';
import { apiGetStoreCategoryTree, type CategoryNode } from '@/api/services/categories';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { novaTheme as t } from '../theme.config';
import { buildNavImageLookup, isMegaItem, normalizeNavItems, useMegaNav } from '../../navigation/megaNav';
import type { MobileNavTokens } from '../../navigation/MobileNavItem';
import { MobileNavPanel } from '../../navigation/MobileNavPanel';
import { mutedOf, readHeaderOptions, logoImageProps } from '../../navigation/headerOptions';
import { NavAnchor } from '../../navigation/NavAnchor';
import { NovaMegaPanel } from './NovaMegaPanel';

/** Theme 02's own navbar — logo left, links left-aligned beside it, bold
 *  pill icon cluster right. Independently implemented: no import from the
 *  legacy `StorefrontNavbar` or `AtelierNavbar` — every color/spacing value
 *  here is `novaTheme`'s own.
 *
 *  "Shop" is a real dropdown (not a dead link) — same reasoning as
 *  `AtelierNavbar`'s own doc comment: fetches the store's actual
 *  subcategories/collections once, since Category/Collection pages
 *  otherwise have no entry point anywhere in this theme. */
export function NovaNavbar() {
  const { store, theme, resolveLink } = useStorefront();
  const { cartCount } = useCartContext();
  const cartDrawer = useCartDrawer();
  const { pathname } = useLocation();
  const { wishlistCount } = useWishlistContext();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const shopCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const isLoggedIn = TokenStorage.isLoggedIn();
  const opts = readHeaderOptions(theme?.header, 'Stories');
  const hc = { ink: opts.textColor ?? t.colors.ink, inkMuted: opts.textColor ? mutedOf(opts.textColor) : t.colors.inkMuted, bg: opts.bgColor ?? t.colors.bg };
  const centered = opts.headerStyle === 'centered';
  // A custom logo with nothing uploaded falls back to the store logo instead of showing only the name.
  const logoSrc = (theme?.header?.logoSource === 'custom' ? theme.header.customLogoUrl : null) || store.logo;

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);
  const [navigationPages, setNavigationPages] = useState<PublicPageSummary[]>([]);

  useEffect(() => {
    apiGetStoreCategoryTree(store.storeId).then(res => setCategories((res.data ?? []).flatMap(c => [c, ...c.children]))).catch(() => {});
    apiGetPublicCollections(store.storeId).then(res => setCollections(res.data ?? [])).catch(() => {});
    apiListPublicStorePages(store.storeId).then(res => setNavigationPages(res.data.filter(page => page.showInNav))).catch(() => setNavigationPages([]));
  }, [store.storeId]);

  const hasShopMenu = categories.length > 0 || collections.length > 0;
  const keepShopOpen = () => {
    if (shopCloseTimer.current) clearTimeout(shopCloseTimer.current);
    shopCloseTimer.current = null;
    setShopOpen(true);
  };
  const scheduleShopClose = () => {
    if (shopCloseTimer.current) clearTimeout(shopCloseTimer.current);
    shopCloseTimer.current = setTimeout(() => {
      setShopOpen(false);
      shopCloseTimer.current = null;
    }, 180);
  };

  // Real, merchant-authored nav links (Customize → Header) — the same
  // `nav_link` block vocabulary every theme's header content uses.
  const headerNavBlocks = (theme?.header?.blocks ?? []).filter(b => b.type === 'nav_link' && b.enabled !== false);
  const navLinks: ResolvedStorefrontNavItem[] = headerNavBlocks.length > 0
    ? normalizeNavItems(headerNavBlocks.map(b => b.settings as unknown as StorefrontNavItemSettings), resolveLink, buildNavImageLookup(categories, collections))
    : opts.showDefaultBlogLink ? [{ id: 'stories', label: opts.blogLabel, link: { to: '/blog' }, children: [] }] : [];
  const visibleNavLinks: ResolvedStorefrontNavItem[] = [...navLinks];
  (opts.includePagesInNav ? navigationPages : []).forEach(page => {
    const to = `/${page.slug}`;
    if (!visibleNavLinks.some(item => item.link.to === to)) visibleNavLinks.push({ id: page._id, label: page.title, link: { to }, children: [] });
  });

  // Mega menu (items the seller set to "Mega menu"): one shared panel under
  // the header, driven by hover / the chevron button / keyboard.
  const megaNav = useMegaNav();
  const openMegaItem = visibleNavLinks.find(item => item.id === megaNav.openId && isMegaItem(item));
  const mobileNavTokens: MobileNavTokens = {
    colors: { ink: hc.ink, inkMuted: hc.inkMuted, border: t.colors.border, bgAlt: t.colors.bgAlt, accent: t.colors.accent },
    fonts: { body: t.fonts.body },
    padX: t.layout.containerPadX,
    tileRadius: t.imageRadiusPx,
    topUppercase: false, topSize: '14px', topWeight: 600, topTracking: '0', childSize: '13.5px',
  };

  const desktopNav = (
            <nav className="hidden lg:flex items-center gap-6">
              {opts.showShopMenu && (
              <div
                className="relative"
                onMouseEnter={() => { if (hasShopMenu) keepShopOpen(); }}
                onMouseLeave={scheduleShopClose}
              >
                <button
                  type="button"
                  onClick={() => hasShopMenu ? setShopOpen(open => !open) : navigate('/#shop')}
                  aria-expanded={shopOpen}
                  aria-haspopup={hasShopMenu ? 'true' : undefined}
                  aria-controls={hasShopMenu && shopOpen ? 'nova-shop-menu' : undefined}
                  className="no-underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                  style={{ color: hc.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600, padding: 0 }}
                >
                  {opts.shopLabel} {hasShopMenu && <ChevronDown size={13} />}
                </button>
                {shopOpen && hasShopMenu && (
                  <div
                    onMouseEnter={keepShopOpen}
                    id="nova-shop-menu"
                    role="region"
                    aria-label="Shop categories and collections"
                    className="absolute left-0 z-20 flex gap-10"
                    style={{ top: '100%', background: '#FFFFFF', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '22px 26px', minWidth: '360px', boxShadow: '0 12px 32px rgba(20,18,31,0.10)' }}
                  >
                    <div className="flex flex-col gap-2.5">
                      <p style={{ fontFamily: t.fonts.body, fontSize: '10.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: hc.inkMuted, fontWeight: 700 }}>Explore</p>
                      <Link to="/#shop" onClick={() => setShopOpen(false)} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: hc.ink }}>All products</Link>
                    </div>
                    {categories.length > 0 && (
                      <div className="flex flex-col gap-2.5">
                        <p style={{ fontFamily: t.fonts.body, fontSize: '10.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: hc.inkMuted, fontWeight: 700 }}>Categories</p>
                        {categories.map(c => (
                          <Link key={c._id} to={`/category/${c.slug || c._id}`} onClick={() => setShopOpen(false)} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: hc.ink }}>
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {collections.length > 0 && (
                      <div className="flex flex-col gap-2.5">
                        <p style={{ fontFamily: t.fonts.body, fontSize: '10.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: hc.inkMuted, fontWeight: 700 }}>Collections</p>
                        {collections.map(c => (
                          <Link key={c._id} to={`/collections/${c.slug}`} onClick={() => setShopOpen(false)} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: hc.ink }}>
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>)}
              {visibleNavLinks.map(item => isMegaItem(item) ? (
                <div
                  key={item.id}
                  className="flex items-center gap-1"
                  onMouseEnter={() => megaNav.open(item.id)}
                  onMouseLeave={megaNav.scheduleClose}
                >
                  <NavAnchor link={item.link} onClick={megaNav.closeNow} className="no-underline" style={{ color: hc.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600 }}>{item.label}</NavAnchor>
                  <button
                    type="button"
                    onClick={() => megaNav.toggle(item.id)}
                    aria-label={`${item.label} menu`}
                    aria-expanded={megaNav.openId === item.id}
                    aria-controls={megaNav.openId === item.id ? `nova-mega-${item.id}` : undefined}
                    className="nova-focus-ring bg-transparent border-0 cursor-pointer p-0 flex items-center"
                    style={{ color: hc.ink }}
                  >
                    <ChevronDown size={13} style={{ transform: megaNav.openId === item.id ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }} />
                  </button>
                </div>
              ) : (
                <div key={item.id} className="relative group">
                  <NavAnchor link={item.link} className="no-underline" style={{ color: hc.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600 }}>{item.label}</NavAnchor>
                  {item.children.length > 0 && <div className="absolute left-0 top-full z-30 hidden min-w-[190px] flex-col gap-3 border p-4 group-hover:flex group-focus-within:flex" style={{ background: hc.bg, borderColor: t.colors.border }}>
                    {item.children.map((child: { id: string; label: string; link: { to?: string; href?: string; newTab?: boolean }; children?: { id: string; label: string; link: { to?: string; href?: string; newTab?: boolean } }[] }) => (
                      <div key={child.id} className="relative group/sub">
                        <NavAnchor link={child.link} className="no-underline" style={{ color: hc.ink, fontSize: '13px', fontFamily: t.fonts.body }}>{child.label}</NavAnchor>
                        {!!child.children?.length && <div className="absolute left-full top-0 z-40 hidden min-w-[180px] flex-col gap-3 border p-4 group-hover/sub:flex group-focus-within/sub:flex" style={{ background: hc.bg, borderColor: t.colors.border, borderRadius: t.radius.sm }}>
                          {child.children.map(grandchild => <NavAnchor key={grandchild.id} link={grandchild.link} className="no-underline" style={{ color: hc.ink, fontSize: '13px', fontFamily: t.fonts.body }}>{grandchild.label}</NavAnchor>)}
                        </div>}
                      </div>
                    ))}
                  </div>}
                </div>
              ))}
            </nav>
  );
  const logoLink = (
            <Link to="/" className="no-underline flex items-center gap-2">
              {logoSrc
                ? <img src={logoSrc} alt={store.name} {...logoImageProps(opts)} />
                : <span style={{ fontFamily: t.fonts.display, fontSize: '21px', fontWeight: 700, color: hc.ink }}>{store.name}</span>}
            </Link>
  );

  return (
    <header {...megaNav.headerProps} style={{ borderBottom: opts.showDivider ? `1.5px solid ${t.colors.border}` : 'none', background: hc.bg, color: hc.ink, ...(opts.sticky ? { position: 'sticky' as const, top: 0, zIndex: 40 } : {}) }}>
      <div className="relative">
      <div
        className={`mx-auto items-center ${centered ? 'grid grid-cols-[1fr_auto_1fr] gap-6' : 'flex justify-between gap-6'}`}
        style={{ maxWidth: t.layout.maxWidth, padding: `${16 + opts.paddingDelta}px ${t.layout.containerPadX}` }}
      >
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-haspopup="dialog"
            className="lg:hidden bg-transparent border-0 cursor-pointer p-1"
            style={{ color: hc.ink }}
          >
            <Menu size={20} />
          </button>

          {!centered && logoLink}

          {!centered && desktopNav}
        </div>
        {centered && <div className="flex justify-center">{logoLink}</div>}

        <div className={`flex items-center gap-3 ${centered ? 'justify-self-end' : ''}`}>
          <CurrencySelector allowed={store.enabledCurrencies ?? undefined} />
          {opts.showSearch && (
          <button
            type="button"
            onClick={() => setSearchOpen(o => !o)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="bg-transparent border-0 cursor-pointer flex items-center justify-center"
            style={{ color: hc.ink, width: '38px', height: '38px', borderRadius: '9999px', background: t.colors.bgAlt }}
          >
            <Search size={17} />
          </button>
          )}
{opts.showAccount && (
          <Link
            to={isLoggedIn ? '/account' : '/login'}
            aria-label="Account"
            className="flex items-center justify-center"
            style={{ color: hc.ink, width: '38px', height: '38px', borderRadius: '9999px', background: t.colors.bgAlt }}
          >
            <User size={17} />
          </Link>
)}
          {isLoggedIn && opts.showWishlist && (
            <Link
              to="/wishlist"
              aria-label={`Wishlist, ${wishlistCount} item${wishlistCount !== 1 ? 's' : ''}`}
              className="relative flex items-center justify-center"
              style={{ color: hc.ink, width: '38px', height: '38px', borderRadius: '9999px', background: t.colors.bgAlt }}
            >
              <Heart size={17} />
              {wishlistCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                  style={{ background: hc.ink, color: '#FFFFFF', fontSize: '10px', width: '17px', height: '17px' }}
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>
          )}
          <Link
            to="/cart"
            onClick={e => { if (cartDrawer.mounted && pathname !== '/cart') { e.preventDefault(); cartDrawer.openDrawer(); } }}
            aria-label={`Cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
            className="relative flex items-center justify-center"
            style={{ color: t.colors.accentInk, width: '38px', height: '38px', borderRadius: '9999px', background: t.colors.accent }}
          >
            <ShoppingBag size={17} />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                style={{ background: hc.ink, color: '#FFFFFF', fontSize: '10px', width: '17px', height: '17px' }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      {centered && (
        <div className="hidden lg:flex mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `0 ${t.layout.containerPadX} 14px`, justifyContent: opts.navAlignment === 'center' ? 'center' : opts.navAlignment === 'right' ? 'flex-end' : 'flex-start' }}>
          {desktopNav}
        </div>
      )}
      {openMegaItem && (
        <NovaMegaPanel
          item={openMegaItem}
          id={`nova-mega-${openMegaItem.id}`}
          onNavigate={megaNav.closeNow}
          onMouseEnter={megaNav.keepOpen}
          onMouseLeave={megaNav.scheduleClose}
        />
      )}
      </div>

      {searchOpen && (
        <div className="border-t" style={{ borderColor: t.colors.border, padding: `12px ${t.layout.containerPadX}` }}>
          <StorefrontPredictiveSearch
            tokens={{ fonts: t.fonts, colors: t.colors, radius: t.radius.sm, borderWidth: '1.5px', headingWeight: 700, skeletonAspect: '1/1' }}
            inputId="nova-search" maxWidth={t.layout.maxWidth} onDone={() => setSearchOpen(false)}
          />
        </div>
      )}

      <MobileNavPanel
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        tokens={{ ...mobileNavTokens, bg: hc.bg, displayFont: t.fonts.display }}
        storeName={store.name}
        brand={logoSrc
          ? <img src={logoSrc} alt={store.name} style={{ maxHeight: 36, maxWidth: 160, objectFit: 'contain' }} />
          : <span style={{ fontFamily: t.fonts.display, fontSize: '19px', fontWeight: 700, color: hc.ink }}>{store.name}</span>}
        items={visibleNavLinks}
        shop={opts.showShopMenu ? {
          label: opts.shopLabel,
          categories: categories.map(c => ({ id: c._id, label: c.name, to: `/category/${c.slug || c._id}` })),
          collections: collections.map(c => ({ id: c._id, label: c.name, to: `/collections/${c.slug}` })),
        } : null}
        showSearch={opts.showSearch}
        onSearch={() => setSearchOpen(true)}
        showAccount={opts.showAccount}
        accountTo={isLoggedIn ? '/account' : '/login'}
        showWishlist={isLoggedIn && opts.showWishlist}
        wishlistCount={wishlistCount}
        footer={<CurrencySelector allowed={store.enabledCurrencies ?? undefined} />}
      />
    </header>
  );
}
