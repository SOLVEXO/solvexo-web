import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, User, ShoppingBag, Menu, X, ArrowUpRight, Phone } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { TokenStorage } from '@/api/services/auth';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCartDrawer } from '../../cartDrawerContext';
import { NavAnchor } from '../../navigation/NavAnchor';
import { logoImageProps, readHeaderOptions } from '../../navigation/headerOptions';
import { LedupMegaMenu } from './LedupMegaMenu';
import { LedupSearchPanel } from './LedupSearchPanel';
import { LedupAuthPopover } from './LedupAuthPopover';
import { useLedupNav } from './useLedupNav';

/** Floating header like ledup.pt: logo, a frosted-glass menu pill, then search / account / cart circles. Opening the mega menu or the search turns the header into a panel over a dimmed, blurred page. */
export function LedupNavbar() {
  const { store, theme, resolveLink } = useStorefront();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { cartCount } = useCartContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const { items } = useLedupNav();

  const [megaId, setMegaId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const header = theme?.header;
  const o = readHeaderOptions(header, ts('blog.label', 'Blog'));
  const logoUrl = header?.logoSource === 'custom' && header.customLogoUrl ? header.customLogoUrl : store.logo;
  const logo = logoImageProps(o);
  const cta = o.cta;
  const panelOpen = megaId !== null || searchOpen;

  // A page change or Esc closes every panel.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the open panels when the route changes
    setMegaId(null); setSearchOpen(false); setMobileOpen(false); setAuthOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMegaId(null); setSearchOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const openCart = () => (drawerMounted ? openDrawer() : navigate('/cart'));
  const closeAll = () => { setMegaId(null); setSearchOpen(false); setMobileOpen(false); };

  return (
    <>
      {panelOpen && <div className="ld-backdrop" aria-hidden onClick={closeAll} />}
      <header className={`ld-header ${megaId ? 'ld-header--menu' : ''} ${searchOpen ? 'ld-header--glass' : ''}`} onMouseLeave={() => setMegaId(null)}>
        <div className="ld-header-row">
          <NavAnchor link={resolveLink(header?.logoLink ?? { linkType: 'home' })} className="flex shrink-0 items-center text-stone-900 no-underline">
            {logoUrl
              ? <img src={logoUrl} alt={store.name} className={logo.className} style={logo.style} />
              : <span className="whitespace-nowrap text-2xl font-bold tracking-tight" style={{ color: 'var(--ld-accent)' }}>{store.name}</span>}
          </NavAnchor>

          <nav aria-label={ts('nav.main', 'Main')} className="ld-glass-pill hidden lg:flex">
            {items.map(it => {
              const hasKids = it.children.length > 0;
              if (!hasKids) {
                return <NavAnchor key={it.id} link={it.link} className="ld-navlink" onMouseEnter={() => setMegaId(null)}>{it.label}</NavAnchor>;
              }
              const open = megaId === it.id;
              return (
                <button key={it.id} type="button" className="ld-navlink inline-flex items-center gap-1" aria-expanded={open} aria-haspopup="true"
                  onClick={() => { setSearchOpen(false); setMegaId(open ? null : it.id); }} onMouseEnter={() => { setSearchOpen(false); setMegaId(it.id); }}>
                  {it.label}
                  <ChevronDown size={13} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {cta && (
              <Link to={cta.link} className="ld-ctabtn hidden sm:inline-flex">{cta.label} <ArrowUpRight size={13} aria-hidden /></Link>
            )}
            <button type="button" className="ld-iconbtn" aria-expanded={searchOpen} aria-label={ts('nav.search', 'Search')} onClick={() => { setMegaId(null); setSearchOpen(v => !v); }}>
              {searchOpen ? <X size={16} aria-hidden /> : <Search size={16} aria-hidden />}
            </button>
            <div className="relative">
              <button type="button" className="ld-iconbtn" aria-expanded={authOpen} aria-label={ts('nav.account', 'Account')} onClick={() => setAuthOpen(v => !v)}><User size={16} aria-hidden /></button>
              <LedupAuthPopover isOpen={authOpen} onClose={() => setAuthOpen(false)} />
            </div>
            <button type="button" className="ld-iconbtn" aria-label={ts('nav.cartAria', 'Cart, {{count}} items', { count: cartCount })} onClick={openCart}>
              <ShoppingBag size={16} aria-hidden />
              {cartCount > 0 && <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold shadow-sm" style={{ color: 'var(--ld-accent)' }}>{cartCount > 99 ? '99+' : cartCount}</span>}
            </button>
            <button type="button" className="ld-iconbtn lg:hidden" aria-expanded={mobileOpen} aria-label={ts('nav.openMenu', 'Open menu')} onClick={() => { setSearchOpen(false); setMobileOpen(v => !v); }}>
              {mobileOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
            </button>
          </div>
        </div>

        <div className="hidden lg:block"><LedupMegaMenu items={items} activeId={megaId} onClose={closeAll} /></div>
        <LedupSearchPanel visible={searchOpen} onClose={closeAll} suggestions={items.filter(i => i.link.to || i.link.href)} />

        {mobileOpen && (
          <div className="ld-mobile-panel lg:hidden" role="dialog" aria-modal="true" aria-label={ts('nav.openMenu', 'Open menu')}>
            <div className="flex justify-end">
              <button type="button" onClick={closeAll} aria-label={ts('common.close', 'Close')} className="cursor-pointer border-0 bg-transparent p-1" style={{ color: 'var(--ld-banner)' }}><X size={30} strokeWidth={1.25} aria-hidden /></button>
            </div>
            <ul className="m-0 mt-4 flex list-none flex-col gap-1 p-0">
              {items.map(it => (
                <li key={it.id}>
                  <NavAnchor link={it.link} onClick={closeAll} className="ld-mobile-item">{it.label}</NavAnchor>
                  {it.children.length > 0 && (
                    <div className="mb-2 ps-3">
                      {it.children.map(c => <NavAnchor key={c.id} link={c.link} onClick={closeAll} className="ld-mobile-sub">{c.label}</NavAnchor>)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-3 border-t border-[#efeded] pt-5">
              {store.contactPhone && <a href={`tel:${store.contactPhone}`} className="ld-iconbtn" style={{ width: '2.9rem', height: '2.9rem' }} aria-label={ts('ld.callUs', 'Call us')}><Phone size={18} aria-hidden /></a>}
              <button type="button" className="ld-iconbtn" style={{ width: '2.9rem', height: '2.9rem' }} aria-label={ts('nav.search', 'Search')} onClick={() => { setMobileOpen(false); setSearchOpen(true); }}><Search size={18} aria-hidden /></button>
              <Link to={TokenStorage.isLoggedIn() ? '/account' : '/login'} onClick={closeAll} className="flex h-[2.9rem] flex-1 items-center justify-between rounded-full px-6 text-base text-white no-underline" style={{ background: 'var(--ld-accent)' }}>
                {TokenStorage.isLoggedIn() ? ts('nav.account', 'Account') : ts('auth.signInBtn', 'Sign In')}<User size={18} aria-hidden />
              </Link>
            </div>
            {cta && <Link to={cta.link} onClick={closeAll} className="ld-ctabtn mt-4 w-full justify-center">{cta.label} <ArrowUpRight size={14} aria-hidden /></Link>}
          </div>
        )}
      </header>
    </>
  );
}
