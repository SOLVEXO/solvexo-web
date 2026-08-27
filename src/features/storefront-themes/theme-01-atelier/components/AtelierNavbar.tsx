import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { TokenStorage } from '@/api/services/auth';
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
  const { store } = useStorefront();
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

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setQ('');
  };

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
          <Link
            to="/blog"
            className="no-underline uppercase"
            style={{ color: t.colors.ink, fontSize: '12px', letterSpacing: '0.12em', fontFamily: t.fonts.body, fontWeight: 500 }}
          >
            Journal
          </Link>
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
          <Link to="/cart" aria-label={`Cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`} className="relative" style={{ color: t.colors.ink }}>
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
        <form onSubmit={submitSearch} className="border-t" style={{ borderColor: t.colors.border, padding: `12px ${t.layout.containerPadX}` }}>
          <label htmlFor="atelier-search" className="sr-only">Search products</label>
          <input
            id="atelier-search"
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
          <Link
            to="/blog"
            onClick={() => setMobileOpen(false)}
            className="no-underline uppercase"
            style={{ color: t.colors.ink, fontSize: '13px', letterSpacing: '0.1em', fontFamily: t.fonts.body, padding: `14px ${t.layout.containerPadX}`, borderBottom: `1px solid ${t.colors.border}` }}
          >
            Journal
          </Link>
        </nav>
      )}
    </header>
  );
}
