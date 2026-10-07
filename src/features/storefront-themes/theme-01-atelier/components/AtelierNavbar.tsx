import { useEffect, useState } from 'react';
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
import { atelierTheme as t } from '../theme.config';

/** Theme 01's own navbar — centered logo, spread nav links either side,
 *  minimal icon cluster. Independently implemented: no import from the
 *  legacy `StorefrontNavbar`, no `cfg`/`resolveStorefrontCfg` token reads —
 *  every color/spacing value here is `atelierTheme`'s own.
 *
 *  "Shop" is a real dropdown (not a dead link) — fetches the store's actual
 *  subcategories and collections once and lists them, since Category/
 *  Collection pages otherwise have no entry point anywhere in Theme 01
 *  (this theme doesn't consume the legacy seller-configured Header nav-link
 *  blocks, so without this a buyer could never reach either page type). */
export function AtelierNavbar() {
  const { store, theme, resolveLink } = useStorefront();
  const { cartCount } = useCartContext();
  const cartDrawer = useCartDrawer();
  const { pathname } = useLocation();
  const { wishlistCount } = useWishlistContext();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isLoggedIn = TokenStorage.isLoggedIn();

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);

  useEffect(() => {
    apiGetStoreCategoryTree(store.storeId).then(res => setCategories((res.data ?? []).flatMap(c => [c, ...c.children]))).catch(() => {});
    apiGetPublicCollections(store.storeId).then(res => setCollections(res.data ?? [])).catch(() => {});
  }, [store.storeId]);

  const hasShopMenu = categories.length > 0 || collections.length > 0;

  // Real, merchant-authored nav links (Customize → Header) — the same
  // `nav_link` block vocabulary every theme's header content uses. Falls
  // back to a single "Journal" link only when the seller hasn't configured
  // any yet, so a brand-new store's nav isn't empty.
  const headerNavBlocks = (theme?.header?.blocks ?? []).filter(b => b.type === 'nav_link' && b.enabled !== false);
  const navLinks = headerNavBlocks.length > 0
    ? headerNavBlocks.map(b => ({ id: b._id ?? b.settings.label, label: b.settings.label as string, link: resolveLink(b.settings as StorefrontLinkSettings), children: (b.settings.children ?? []).map((child: StorefrontLinkSettings & { id: string; label: string }) => ({ id: child.id, label: child.label, link: resolveLink(child) })) }))
    : [{ id: 'journal', label: 'Journal', link: { to: '/blog' }, children: [] }];


  return (
    <header style={{ borderBottom: `1px solid ${t.colors.border}`, background: t.colors.bg }}>
      <div
        className="relative mx-auto flex items-center justify-between"
        style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}` }}
      >
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="lg:hidden bg-transparent border-0 cursor-pointer p-1"
          style={{ color: t.colors.ink }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Left nav (desktop) */}
        <nav className="hidden lg:flex items-center gap-8">
          <div
            className="relative"
            onMouseEnter={() => hasShopMenu && setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <button
              type="button"
              onClick={() => navigate('/#shop')}
              aria-expanded={shopOpen}
              aria-haspopup={hasShopMenu ? 'true' : undefined}
              className="no-underline uppercase flex items-center gap-1 bg-transparent border-0 cursor-pointer"
              style={{ color: t.colors.ink, fontSize: '12px', letterSpacing: '0.12em', fontFamily: t.fonts.body, fontWeight: 500, padding: 0 }}
            >
              Shop {hasShopMenu && <ChevronDown size={12} />}
            </button>
            {shopOpen && hasShopMenu && (
              <div
                className="absolute left-0 z-20 flex gap-10"
                style={{ top: 'calc(100% + 14px)', background: '#FFFFFF', border: `1px solid ${t.colors.border}`, padding: '22px 26px', minWidth: '360px' }}
              >
                {categories.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <p style={{ fontFamily: t.fonts.body, fontSize: '10.5px', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.colors.inkMuted }}>Categories</p>
                    {categories.map(c => (
                      <Link key={c._id} to={`/category/${c.slug || c._id}`} onClick={() => setShopOpen(false)} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink }}>
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
                {collections.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <p style={{ fontFamily: t.fonts.body, fontSize: '10.5px', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.colors.inkMuted }}>Collections</p>
                    {collections.map(c => (
                      <Link key={c._id} to={`/collections/${c.slug}`} onClick={() => setShopOpen(false)} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink }}>
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
              {item.link.to ? <Link to={item.link.to} className="no-underline uppercase" style={{ color: t.colors.ink, fontSize: '12px', letterSpacing: '0.12em', fontFamily: t.fonts.body, fontWeight: 500 }}>{item.label}</Link> : <a href={item.link.href} className="no-underline uppercase" style={{ color: t.colors.ink, fontSize: '12px', letterSpacing: '0.12em', fontFamily: t.fonts.body, fontWeight: 500 }}>{item.label}</a>}
              {item.children.length > 0 && <div className="absolute left-0 top-full z-30 hidden min-w-[190px] flex-col gap-3 border p-4 group-hover:flex group-focus-within:flex" style={{ background: t.colors.bg, borderColor: t.colors.border }}>
                {item.children.map(child => child.link.to ? <Link key={child.id} to={child.link.to} className="no-underline" style={{ color: t.colors.ink, fontSize: '12px', letterSpacing: '0.04em', fontFamily: t.fonts.body }}>{child.label}</Link> : <a key={child.id} href={child.link.href} className="no-underline" style={{ color: t.colors.ink, fontSize: '12px', letterSpacing: '0.04em', fontFamily: t.fonts.body }}>{child.label}</a>)}
              </div>}
            </div>
          ))}
        </nav>

        {/* Center wordmark */}
        <Link
          to="/"
          className="no-underline flex items-center gap-2 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
        >
          {store.logo && <img src={store.logo} alt="" className="w-7 h-7 object-contain" />}
          <span style={{ fontFamily: t.fonts.display, fontSize: '22px', fontWeight: 600, color: t.colors.ink, letterSpacing: '0.02em' }}>
            {store.name}
          </span>
        </Link>

        {/* Right icon cluster */}
        <div className="flex items-center gap-4">
          <CurrencySelector allowed={store.enabledCurrencies ?? undefined} />
          <button
            type="button"
            onClick={() => setSearchOpen(o => !o)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="bg-transparent border-0 cursor-pointer p-1"
            style={{ color: t.colors.ink }}
          >
            <Search size={18} />
          </button>
          <Link to={isLoggedIn ? '/account' : '/login'} aria-label="Account" style={{ color: t.colors.ink }}>
            <User size={18} />
          </Link>
          {isLoggedIn && (
            <Link to="/wishlist" aria-label={`Wishlist, ${wishlistCount} item${wishlistCount !== 1 ? 's' : ''}`} className="relative" style={{ color: t.colors.ink }}>
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-white"
                  style={{ background: t.colors.ink, fontSize: '10px', width: '16px', height: '16px' }}
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>
          )}
          <Link to="/cart" onClick={e => { if (cartDrawer.mounted && pathname !== '/cart') { e.preventDefault(); cartDrawer.openDrawer(); } }} aria-label={`Cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`} className="relative" style={{ color: t.colors.ink }}>
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-white"
                style={{ background: t.colors.ink, fontSize: '10px', width: '16px', height: '16px' }}
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
            tokens={{ fonts: t.fonts, colors: t.colors, radius: t.radius.sm, borderWidth: '1px', headingWeight: 600, skeletonAspect: '3/4' }}
            inputId="atelier-search" maxWidth={t.layout.maxWidth} onDone={() => setSearchOpen(false)}
          />
        </div>
      )}

      {mobileOpen && (
        <nav className="lg:hidden flex flex-col border-t" style={{ borderColor: t.colors.border }}>
          <Link
            to="/#shop"
            onClick={() => setMobileOpen(false)}
            className="no-underline uppercase"
            style={{ color: t.colors.ink, fontSize: '13px', letterSpacing: '0.1em', fontFamily: t.fonts.body, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
          >
            Shop
          </Link>
          {categories.map(c => (
            <Link
              key={c._id}
              to={`/category/${c.slug || c._id}`}
              onClick={() => setMobileOpen(false)}
              className="no-underline"
              style={{ color: t.colors.inkMuted, fontSize: '12.5px', fontFamily: t.fonts.body, padding: `10px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
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
              style={{ color: t.colors.inkMuted, fontSize: '12.5px', fontFamily: t.fonts.body, padding: `10px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
            >
              {c.name}
            </Link>
          ))}
          {navLinks.map(item => <div key={item.id}>
            {item.link.to ? <Link to={item.link.to} onClick={() => setMobileOpen(false)} className="no-underline uppercase block" style={{ color: t.colors.ink, fontSize: '13px', letterSpacing: '0.1em', fontFamily: t.fonts.body, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}>{item.label}</Link> : <a href={item.link.href} onClick={() => setMobileOpen(false)} className="no-underline uppercase block" style={{ color: t.colors.ink, fontSize: '13px', letterSpacing: '0.1em', fontFamily: t.fonts.body, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}>{item.label}</a>}
            {item.children.map(child => child.link.to ? <Link key={child.id} to={child.link.to} onClick={() => setMobileOpen(false)} className="no-underline block" style={{ color: t.colors.inkMuted, fontSize: '12px', letterSpacing: '0.04em', fontFamily: t.fonts.body, padding: `10px calc(${t.layout.containerPadX} + 18px)`, borderBottom: `1px solid ${t.colors.border}` }}>{child.label}</Link> : <a key={child.id} href={child.link.href} onClick={() => setMobileOpen(false)} className="no-underline block" style={{ color: t.colors.inkMuted, fontSize: '12px', letterSpacing: '0.04em', fontFamily: t.fonts.body, padding: `10px calc(${t.layout.containerPadX} + 18px)`, borderBottom: `1px solid ${t.colors.border}` }}>{child.label}</a>)}
          </div>)}
        </nav>
      )}
    </header>
  );
}
