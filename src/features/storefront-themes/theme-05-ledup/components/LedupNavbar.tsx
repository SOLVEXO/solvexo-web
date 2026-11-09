import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, User, ShoppingBag, Menu, X, ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCartDrawer } from '../../cartDrawerContext';
import { NavAnchor } from '../../navigation/NavAnchor';
import { logoImageProps, readHeaderOptions } from '../../navigation/headerOptions';
import { LedupMegaMenu } from './LedupMegaMenu';
import { LedupSearchModal } from './LedupSearchModal';
import { LedupAuthPopover } from './LedupAuthPopover';
import { useLedupNav } from './useLedupNav';

export function LedupNavbar() {
  const { store, theme, resolveLink } = useStorefront();
  const navigate = useNavigate();
  const { cartCount } = useCartContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const { items } = useLedupNav();

  const [megaId, setMegaId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const header = theme?.header;
  const o = readHeaderOptions(header, ts('blog.label', 'Blog'));
  const logoUrl = header?.logoSource === 'custom' && header.customLogoUrl ? header.customLogoUrl : store.logo;
  const logo = logoImageProps(o);
  const openCart = () => (drawerMounted ? openDrawer() : navigate('/cart'));
  const closeAll = () => { setMegaId(null); setMobileOpen(false); };
  const circle = 'flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-200 hover:text-stone-900';
  const pill = 'rounded-full px-4 py-1.5 text-xs font-medium text-stone-700 no-underline transition-colors hover:text-stone-950';
  const cta = o.cta;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-100 bg-white/90 backdrop-blur-md transition-all" onMouseLeave={() => setMegaId(null)}>
      <div className="relative mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-4 md:px-10">
        <NavAnchor link={resolveLink(header?.logoLink ?? { linkType: 'home' })} className="flex shrink-0 items-center text-stone-900 no-underline">
          {logoUrl
            ? <img src={logoUrl} alt={store.name} className={logo.className} style={logo.style} />
            : <span className="whitespace-nowrap text-2xl font-bold tracking-tight text-stone-900">{store.name}</span>}
        </NavAnchor>

        <nav aria-label={ts('nav.main', 'Main')} className="hidden items-center gap-1 rounded-full bg-[#F4F2EE] px-6 py-2 shadow-inner lg:flex">
          {items.map(it => {
            const hasKids = it.children.length > 0;
            const open = megaId === it.id;
            if (!hasKids) {
              return <NavAnchor key={it.id} link={it.link} className={pill} onMouseEnter={() => setMegaId(null)}>{it.label}</NavAnchor>;
            }
            return (
              <button key={it.id} type="button" aria-expanded={open} aria-haspopup="true"
                onClick={() => setMegaId(open ? null : it.id)} onMouseEnter={() => setMegaId(it.id)}
                className={`flex cursor-pointer items-center gap-1 rounded-full border-0 px-4 py-1.5 text-xs font-medium transition-colors ${open ? 'bg-white text-stone-900 shadow-sm' : 'bg-transparent text-stone-700 hover:text-stone-950'}`}>
                {it.label}
                <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          {cta && (
            <Link to={cta.link} className="hidden items-center gap-1.5 rounded-full bg-[#8C7355] px-4 py-2 text-xs font-medium text-white no-underline transition hover:bg-[#786247] sm:inline-flex">
              {cta.label} <ArrowUpRight size={13} aria-hidden />
            </Link>
          )}
          <button type="button" onClick={() => setIsSearchOpen(true)} aria-label={ts('nav.search', 'Search')} className={circle}><Search size={17} aria-hidden /></button>
          <div className="relative">
            <button type="button" onClick={() => setIsAuthOpen(v => !v)} aria-expanded={isAuthOpen} aria-label={ts('nav.account', 'Account')} className={circle}><User size={17} aria-hidden /></button>
            <LedupAuthPopover isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          </div>
          <button type="button" onClick={openCart} aria-label={ts('nav.cartAria', 'Cart, {{count}} items', { count: cartCount })} className={`relative ${circle}`}>
            <ShoppingBag size={17} aria-hidden />
            {cartCount > 0 && (
              <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8C7355] px-1 text-[10px] font-bold text-white shadow-sm">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </button>
          <button type="button" onClick={() => setMobileOpen(v => !v)} aria-expanded={mobileOpen} aria-label={ts('nav.openMenu', 'Open menu')} className={`${circle} lg:hidden`}>
            {mobileOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      <div className="hidden lg:block"><LedupMegaMenu items={items} activeId={megaId} onClose={() => setMegaId(null)} /></div>
      <LedupSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {mobileOpen && (
        <div className="ld-pop max-h-[75vh] overflow-y-auto border-t border-stone-200 bg-white px-6 py-6 lg:hidden">
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {items.map(it => (
              <li key={it.id}>
                <NavAnchor link={it.link} onClick={closeAll} className="text-base font-medium text-stone-800 no-underline">{it.label}</NavAnchor>
                {it.children.length > 0 && (
                  <ul className="m-0 mt-2 flex list-none flex-col gap-2 border-s border-stone-200 p-0 ps-4">
                    {it.children.map(c => (
                      <li key={c.id}>
                        <NavAnchor link={c.link} onClick={closeAll} className="text-sm text-stone-600 no-underline">{c.label}</NavAnchor>
                        {c.children.length > 0 && (
                          <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0 ps-3">
                            {c.children.map(g => <li key={g.id}><NavAnchor link={g.link} onClick={closeAll} className="text-xs text-stone-500 no-underline">{g.label}</NavAnchor></li>)}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {cta && (
            <Link to={cta.link} onClick={closeAll} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#8C7355] py-3 text-sm font-medium text-white no-underline">
              {cta.label} <ArrowUpRight size={15} aria-hidden />
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
