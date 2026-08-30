import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { TokenStorage } from '@/api/services/auth';
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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const isLoggedIn = TokenStorage.isLoggedIn();

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);

  useEffect(() => {
    apiGetStoreCategoryTree(store.storeId).then(res => setCategories((res.data ?? []).flatMap(c => [c, ...c.children]))).catch(() => {});
    apiGetPublicCollections(store.storeId).then(res => setCollections(res.data ?? [])).catch(() => {});
  }, [store.storeId]);

  const hasShopMenu = categories.length > 0 || collections.length > 0;

  // Real, merchant-authored nav links (Customize → Header) — the same
  // `nav_link` block vocabulary every theme's header content uses.
  const headerNavBlocks = (theme?.header?.blocks ?? []).filter(b => b.type === 'nav_link' && b.enabled !== false);
  const navLinks = headerNavBlocks.length > 0
    ? headerNavBlocks.map(b => ({ id: b._id ?? b.settings.label, label: b.settings.label as string, link: resolveLink(b.settings as StorefrontLinkSettings) }))
    : [{ id: 'stories', label: 'Stories', link: { to: '/blog' } }];

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setQ('');
  };

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
            {store.logo && <img src={store.logo} alt="" className="w-8 h-8 object-contain" style={{ borderRadius: t.radius.sm }} />}
            <span style={{ fontFamily: t.fonts.display, fontSize: '21px', fontWeight: 700, color: t.colors.ink }}>
              {store.name}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
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
                className="no-underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600, padding: 0 }}
              >
                Shop {hasShopMenu && <ChevronDown size={13} />}
              </button>
              {shopOpen && hasShopMenu && (
                <div
                  className="absolute left-0 z-20 flex gap-10"
                  style={{ top: 'calc(100% + 14px)', background: '#FFFFFF', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '22px 26px', minWidth: '360px', boxShadow: '0 12px 32px rgba(20,18,31,0.10)' }}
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
              item.link.to ? (
                <Link
                  key={item.id}
                  to={item.link.to}
                  className="no-underline"
                  style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600 }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={item.link.href}
                  className="no-underline"
                  style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600 }}
                >
                  {item.label}
                </a>
              )
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
          <Link
            to="/cart"
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
        <form onSubmit={submitSearch} className="border-t" style={{ borderColor: t.colors.border, padding: `12px ${t.layout.containerPadX}` }}>
          <label htmlFor="nova-search" className="sr-only">Search products</label>
          <input
            id="nova-search"
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-transparent outline-none"
            style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.ink, maxWidth: t.layout.maxWidth, margin: '0 auto', display: 'block' }}
          />
        </form>
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
          {navLinks.map(item => (
            item.link.to ? (
              <Link
                key={item.id}
                to={item.link.to}
                onClick={() => setMobileOpen(false)}
                className="no-underline"
                style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.id}
                href={item.link.href}
                onClick={() => setMobileOpen(false)}
                className="no-underline"
                style={{ color: t.colors.ink, fontSize: '14px', fontFamily: t.fonts.body, fontWeight: 600, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
              >
                {item.label}
              </a>
            )
          ))}
        </nav>
      )}
    </header>
  );
}
