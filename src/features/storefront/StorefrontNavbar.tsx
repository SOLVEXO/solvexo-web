import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Store as StoreIcon } from 'lucide-react';
import { useStorefront } from './StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { TokenStorage } from '@/api/services/auth';
import { getMainAppUrl } from '@/utils/storefrontUrl';

// The seller's own storefront chrome — deliberately has ZERO Solvexo branding
// (no Solvexo logo, no platform nav links). Used only on a store's own
// subdomain via `StorefrontLayout`; the rest of the app keeps the shared
// `BuyerNavbar`. Cart/account live on the main app (a different origin from
// this subdomain), so those buttons are hard navigations, not client-side
// `navigate()` — see `getMainAppUrl`.
export function StorefrontNavbar() {
  const { store, theme, cfg, resolveLink } = useStorefront();
  const { cartCount } = useCartContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = TokenStorage.isLoggedIn();

  const logoUrl = theme?.header.logoSource === 'custom' ? theme.header.customLogoUrl : store.logo;
  const navLinks = theme?.header.blocks.filter(b => b.type === 'nav_link') ?? [];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-bone" style={{ fontFamily: `${cfg.font}, sans-serif` }}>
      <div className="px-4 sm:px-6 lg:px-10 h-[64px] flex items-center gap-4">
        <Link to="" className="flex items-center gap-2 shrink-0 no-underline">
          {logoUrl
            ? <img src={logoUrl} alt={store.name} className="w-9 h-9 rounded-lg object-cover" />
            : <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${cfg.primaryColor}18` }}>
                <StoreIcon size={18} style={{ color: cfg.primaryColor }} />
              </div>
          }
          <span className="font-bold text-[15px] text-charcoal truncate max-w-[160px]">{store.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 ml-4">
          {navLinks.map(link => {
            const { to, href } = resolveLink(link.settings as { linkType: string; pageSlug?: string; url?: string });
            const label = link.settings.label as string;
            return to
              ? <Link key={link._id ?? label} to={to} className="text-[13px] font-medium text-graphite hover:text-charcoal no-underline transition-colors">{label}</Link>
              : <a key={link._id ?? label} href={href} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-graphite hover:text-charcoal no-underline transition-colors">{label}</a>;
          })}
        </nav>

        <div className="flex-1" />

        <button
          onClick={() => { window.location.href = getMainAppUrl('/cart'); }}
          aria-label="Cart"
          className="relative w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer hover:bg-cream transition-colors"
        >
          <ShoppingCart size={18} className="text-charcoal" />
          {cartCount > 0 && (
            <span
              className="absolute -top-[2px] -right-[2px] min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              style={{ background: cfg.primaryColor }}
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { window.location.href = getMainAppUrl(isLoggedIn ? '/account' : '/login'); }}
          aria-label="Account"
          className="w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer hover:bg-cream transition-colors"
        >
          <User size={18} className="text-charcoal" />
        </button>

        {navLinks.length > 0 && (
          <button
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </div>

      {mobileOpen && navLinks.length > 0 && (
        <nav className="md:hidden flex flex-col border-t border-bone px-4 py-2">
          {navLinks.map(link => {
            const { to, href } = resolveLink(link.settings as { linkType: string; pageSlug?: string; url?: string });
            const label = link.settings.label as string;
            return to
              ? <Link key={link._id ?? label} to={to} onClick={() => setMobileOpen(false)} className="py-2.5 text-[13px] font-medium text-graphite no-underline">{label}</Link>
              : <a key={link._id ?? label} href={href} target="_blank" rel="noopener noreferrer" className="py-2.5 text-[13px] font-medium text-graphite no-underline">{label}</a>;
          })}
        </nav>
      )}
    </header>
  );
}
