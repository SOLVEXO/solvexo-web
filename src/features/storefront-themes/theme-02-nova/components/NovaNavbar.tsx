import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown } from 'lucide-react';
import { StorefrontPredictiveSearch } from '@/features/storefront/browse/StorefrontPredictiveSearch';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCartDrawer } from '../../cartDrawerContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { TokenStorage } from '@/api/services/auth';
import { CurrencySelector } from '@/components/comman/ui';
import { apiGetStoreCategoryTree, type CategoryNode } from '@/api/services/categories';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { novaTheme as t } from '../theme.config';

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

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);

  useEffect(() => {
    apiGetStoreCategoryTree(store.storeId).then(res => setCategories((res.data ?? []).flatMap(c => [c, ...c.children]))).catch(() => {});
    apiGetPublicCollections(store.storeId).then(res => setCollections(res.data ?? [])).catch(() => {});
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
  const navLinks = headerNavBlocks.length > 0
    ? headerNavBlocks.map(b => ({ id: b._id ?? b.settings.label, label: b.settings.label as string, link: resolveLink(b.settings as StorefrontLinkSettings), children: (b.settings.children ?? []).map((child: StorefrontLinkSettings & { id: string; label: string }) => ({ id: child.id, label: child.label, link: resolveLink(child) })) }))
    : [{ id: 'stories', label: 'Stories', link: { to: '/blog' }, children: [] }];


  return (
    <header style={{ borderBottom: `1.5px solid ${t.colors.border}`, background: t.colors.bg }}>
      <div
        className="mx-auto flex items-center justify-between gap-6"
        style={{ maxWidth: t.layout.maxWidth, padding: `16px ${t.layout.containerPadX}` }}
      >
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden bg-transparent border-0 cursor-pointer p-1"
            style={{ color: t.colors.ink }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="no-underline flex items-center gap-2">
            {store.logo
              ? <img src={store.logo} alt={store.name} className="max-h-10 max-w-[180px] object-contain" style={{ borderRadius: t.radius.sm }} />
              : <span style={{ fontFamily: t.fonts.display, fontSize: '21px', fontWeight: 700, color: t.colors.ink }}>{store.name}</span>}
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <div
              className="relative"
              onMouseEnter={() => { if (hasShopMenu) keepShopOpen(); }}
              onMouseLeave={scheduleShopClose}
            >
              <button
                type="button"
                onClick={() => navigate('/#shop')}
                aria-expanded={shopOpen}
                aria-haspopup={hasShopMenu ? 'true' : undefined}
                className="no-underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600, padding: 0 }}
              >
                Shop {hasShopMenu && <ChevronDown size={13} />}
              </button>
              {shopOpen && hasShopMenu && (
                <div
                  onMouseEnter={keepShopOpen}
                  className="absolute left-0 z-20 flex gap-10"
                  style={{ top: '100%', background: '#FFFFFF', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '22px 26px', minWidth: '360px', boxShadow: '0 12px 32px rgba(20,18,31,0.10)' }}
                >
                  {categories.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <p style={{ fontFamily: t.fonts.body, fontSize: '10.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted, fontWeight: 700 }}>Categories</p>
                      {categories.map(c => (
                        <Link key={c._id} to={`/category/${c.slug || c._id}`} onClick={() => setShopOpen(false)} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink }}>
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  {collections.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <p style={{ fontFamily: t.fonts.body, fontSize: '10.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted, fontWeight: 700 }}>Collections</p>
                      {collections.map(c => (
                        <Link key={c._id} to={`/collections/${c.slug}`} onClick={() => setShopOpen(false)} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink }}>
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {navLinks.map(item => (
              <div key={item.id} className="relative group">
                {item.link.to ? <Link to={item.link.to} className="no-underline" style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600 }}>{item.label}</Link> : <a href={item.link.href} className="no-underline" style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600 }}>{item.label}</a>}
                {item.children.length > 0 && <div className="absolute left-0 top-full z-30 hidden min-w-[190px] flex-col gap-3 border p-4 group-hover:flex group-focus-within:flex" style={{ background: t.colors.bg, borderColor: t.colors.border }}>
                  {item.children.map((child: { id: string; label: string; link: { to?: string; href?: string }; children?: { id: string; label: string; link: { to?: string; href?: string } }[] }) => (
                    <div key={child.id} className="relative group/sub">
                      {child.link.to ? <Link to={child.link.to} className="no-underline" style={{ color: t.colors.ink, fontSize: '13px', fontFamily: t.fonts.body }}>{child.label}</Link> : <a href={child.link.href} className="no-underline" style={{ color: t.colors.ink, fontSize: '13px', fontFamily: t.fonts.body }}>{child.label}</a>}
                      {!!child.children?.length && <div className="absolute left-full top-0 z-40 hidden min-w-[180px] flex-col gap-3 border p-4 group-hover/sub:flex group-focus-within/sub:flex" style={{ background: t.colors.bg, borderColor: t.colors.border, borderRadius: t.radius.sm }}>
                        {child.children.map(grandchild => grandchild.link.to ? <Link key={grandchild.id} to={grandchild.link.to} className="no-underline" style={{ color: t.colors.ink, fontSize: '13px', fontFamily: t.fonts.body }}>{grandchild.label}</Link> : <a key={grandchild.id} href={grandchild.link.href} className="no-underline" style={{ color: t.colors.ink, fontSize: '13px', fontFamily: t.fonts.body }}>{grandchild.label}</a>)}
                      </div>}
                    </div>
                  ))}
                </div>}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CurrencySelector allowed={store.enabledCurrencies ?? undefined} />
          <button
            type="button"
            onClick={() => setSearchOpen(o => !o)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="bg-transparent border-0 cursor-pointer flex items-center justify-center"
            style={{ color: t.colors.ink, width: '38px', height: '38px', borderRadius: '9999px', background: t.colors.bgAlt }}
          >
            <Search size={17} />
          </button>
          <Link
            to={isLoggedIn ? '/account' : '/login'}
            aria-label="Account"
            className="flex items-center justify-center"
            style={{ color: t.colors.ink, width: '38px', height: '38px', borderRadius: '9999px', background: t.colors.bgAlt }}
          >
            <User size={17} />
          </Link>
          {isLoggedIn && (
            <Link
              to="/wishlist"
              aria-label={`Wishlist, ${wishlistCount} item${wishlistCount !== 1 ? 's' : ''}`}
              className="relative flex items-center justify-center"
              style={{ color: t.colors.ink, width: '38px', height: '38px', borderRadius: '9999px', background: t.colors.bgAlt }}
            >
              <Heart size={17} />
              {wishlistCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                  style={{ background: t.colors.ink, color: '#FFFFFF', fontSize: '10px', width: '17px', height: '17px' }}
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
                style={{ background: t.colors.ink, color: '#FFFFFF', fontSize: '10px', width: '17px', height: '17px' }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t" style={{ borderColor: t.colors.border, padding: `12px ${t.layout.containerPadX}` }}>
          <StorefrontPredictiveSearch
            tokens={{ fonts: t.fonts, colors: t.colors, radius: t.radius.sm, borderWidth: '1.5px', headingWeight: 700, skeletonAspect: '1/1' }}
            inputId="nova-search" maxWidth={t.layout.maxWidth} onDone={() => setSearchOpen(false)}
          />
        </div>
      )}

      {mobileOpen && (
        <nav className="lg:hidden flex flex-col border-t" style={{ borderColor: t.colors.border }}>
          <Link
            to="/#shop"
            onClick={() => setMobileOpen(false)}
            className="no-underline"
            style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
          >
            Shop
          </Link>
          {categories.map(c => (
            <Link
              key={c._id}
              to={`/category/${c.slug || c._id}`}
              onClick={() => setMobileOpen(false)}
              className="no-underline"
              style={{ color: t.colors.inkMuted, fontSize: '13.5px', fontFamily: t.fonts.body, padding: `10px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
            >
              {c.name}
            </Link>
          ))}
          {collections.map(c => (
            <Link
              key={c._id}
              to={`/collections/${c.slug}`}
              onClick={() => setMobileOpen(false)}
              className="no-underline"
              style={{ color: t.colors.inkMuted, fontSize: '13.5px', fontFamily: t.fonts.body, padding: `10px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
            >
              {c.name}
            </Link>
          ))}
          {navLinks.map(item => <div key={item.id}>
            {item.link.to ? <Link to={item.link.to} onClick={() => setMobileOpen(false)} className="no-underline block" style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}>{item.label}</Link> : <a href={item.link.href} onClick={() => setMobileOpen(false)} className="no-underline block" style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}>{item.label}</a>}
            {item.children.map((child: { id: string; label: string; link: { to?: string; href?: string }; children?: { id: string; label: string; link: { to?: string; href?: string } }[] }) => <div key={child.id}>
              {child.link.to ? <Link to={child.link.to} onClick={() => setMobileOpen(false)} className="no-underline block" style={{ color: t.colors.inkMuted, fontSize: '13px', fontFamily: t.fonts.body, padding: `10px calc(${t.layout.containerPadX} + 18px)`, borderBottom: `1px solid ${t.colors.border}` }}>{child.label}</Link> : <a href={child.link.href} onClick={() => setMobileOpen(false)} className="no-underline block" style={{ color: t.colors.inkMuted, fontSize: '13px', fontFamily: t.fonts.body, padding: `10px calc(${t.layout.containerPadX} + 18px)`, borderBottom: `1px solid ${t.colors.border}` }}>{child.label}</a>}
              {child.children?.map(grandchild => grandchild.link.to ? <Link key={grandchild.id} to={grandchild.link.to} onClick={() => setMobileOpen(false)} className="no-underline block" style={{ color: t.colors.inkMuted, fontSize: '12px', fontFamily: t.fonts.body, padding: `9px calc(${t.layout.containerPadX} + 36px)`, borderBottom: `1px solid ${t.colors.border}` }}>{grandchild.label}</Link> : <a key={grandchild.id} href={grandchild.link.href} onClick={() => setMobileOpen(false)} className="no-underline block" style={{ color: t.colors.inkMuted, fontSize: '12px', fontFamily: t.fonts.body, padding: `9px calc(${t.layout.containerPadX} + 36px)`, borderBottom: `1px solid ${t.colors.border}` }}>{grandchild.label}</a>)}
            </div>)}
          </div>)}
        </nav>
      )}
    </header>
  );
}
