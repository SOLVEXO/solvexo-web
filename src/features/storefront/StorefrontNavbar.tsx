import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Menu, X, ShoppingCart, User, Store as StoreIcon } from 'lucide-react';
import { useStorefront } from './StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { TokenStorage } from '@/api/services/auth';
import { getMainAppUrl } from '@/utils/storefrontUrl';
import { ThemedButton } from './ThemedButton';

type ResolveLink = ReturnType<typeof useStorefront>['resolveLink'];

// One nav link, shared by the desktop and mobile menus — renders as a
// themed button when the seller toggled "Highlight as button" on it in the
// Store Builder, otherwise the same plain text link as before.
function NavLinkItem({ link, resolveLink, className, onNavigate }: {
  link: { _id?: string; settings: Record<string, any> };
  resolveLink: ResolveLink;
  className: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { to, href } = resolveLink(link.settings as { linkType: string; pageSlug?: string; url?: string });
  const label = link.settings.label as string;

  if (link.settings.highlight) {
    return (
      <ThemedButton
        key={link._id ?? label}
        size="sm"
        onClick={() => { onNavigate?.(); if (to) navigate(to); else if (href) window.open(href, '_blank', 'noopener,noreferrer'); }}
      >
        {label}
      </ThemedButton>
    );
  }
  return to
    ? <Link key={link._id ?? label} to={to} onClick={onNavigate} className={className}>{label}</Link>
    : <a key={link._id ?? label} href={href} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={className}>{label}</a>;
}

// The seller's own storefront chrome — deliberately has ZERO Solvexo branding
// (no Solvexo logo, no platform nav links). Used only on a store's own
// subdomain via `StorefrontLayout`; the rest of the app keeps the shared
// `BuyerNavbar`. Cart and (logged-out) sign-in now stay on this same
// subdomain (`StorefrontCartPage`/`StorefrontLoginPage`, both store-scoped)
// — only the logged-in Account button still hard-navigates cross-origin to
// the apex app's Account Workspace, since there's no storefront-local
// account view yet (a later phase).
export function StorefrontNavbar() {
  const navigate = useNavigate();
  const { store, theme, cfg, resolveLink } = useStorefront();
  const { cartCount } = useCartContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = TokenStorage.isLoggedIn();

  const logoUrl = theme?.header.logoSource === 'custom' ? theme.header.customLogoUrl : store.logo;
  const navLinks = theme?.header.blocks.filter(b => b.type === 'nav_link') ?? [];
  const navAlignment = theme?.header.navAlignment ?? 'left';
  const isCentered = cfg.headerStyle === 'centered';
  const dark = cfg.isDarkTheme;

  const logo = (
    <Link to="" className="flex items-center gap-2 shrink-0 no-underline">
      {logoUrl
        ? <img src={logoUrl} alt={store.name} className="w-9 h-9 rounded-lg object-cover" />
        : <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${cfg.primaryColor}18` }}>
            <StoreIcon size={18} style={{ color: cfg.primaryColor }} />
          </div>
      }
      <span className={clsx('font-bold text-[15px] truncate max-w-[160px]', dark ? 'text-white' : 'text-charcoal')}>{store.name}</span>
    </Link>
  );

  const desktopNav = (
    <nav className="hidden md:flex items-center gap-5">
      {navLinks.map(link => (
        <NavLinkItem
          key={link._id ?? link.settings.label}
          link={link}
          resolveLink={resolveLink}
          className={clsx('text-[13px] font-medium no-underline transition-colors', dark ? 'text-white/70 hover:text-white' : 'text-graphite hover:text-charcoal')}
        />
      ))}
    </nav>
  );

  const icons = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => navigate('/cart')}
        aria-label="Cart"
        className={clsx('relative w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors', dark ? 'hover:bg-white/10' : 'hover:bg-cream')}
      >
        <ShoppingCart size={18} className={dark ? 'text-white' : 'text-charcoal'} />
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
        onClick={() => { isLoggedIn ? window.location.href = getMainAppUrl('/account') : navigate('/login'); }}
        aria-label="Account"
        className={clsx('w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors', dark ? 'hover:bg-white/10' : 'hover:bg-cream')}
      >
        <User size={18} className={dark ? 'text-white' : 'text-charcoal'} />
      </button>

      {navLinks.length > 0 && (
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Menu"
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer"
        >
          {mobileOpen ? <X size={18} className={dark ? 'text-white' : undefined} /> : <Menu size={18} className={dark ? 'text-white' : undefined} />}
        </button>
      )}
    </div>
  );

  const mobileMenu = mobileOpen && navLinks.length > 0 && (
    <nav className={clsx('md:hidden flex flex-col gap-2 border-t px-4 py-2', dark ? 'border-white/10' : 'border-bone')}>
      {navLinks.map(link => (
        <NavLinkItem
          key={link._id ?? link.settings.label}
          link={link}
          resolveLink={resolveLink}
          className={clsx('py-2.5 text-[13px] font-medium no-underline', dark ? 'text-white/80' : 'text-graphite')}
          onNavigate={() => setMobileOpen(false)}
        />
      ))}
    </nav>
  );

  const headerCls = clsx('sticky top-0 z-40 border-b', dark ? 'bg-[#111]/95 backdrop-blur-sm border-white/10' : 'bg-white border-bone');

  // 'centered' — logo on its own centered row, nav links centered on a
  // second row below it (desktop only); icons stay pinned top-right. A
  // genuinely different composition from 'standard', not just re-aligned.
  if (isCentered) {
    return (
      <header className={headerCls} style={{ fontFamily: `${cfg.font}, sans-serif` }}>
        <div className="px-4 sm:px-6 lg:px-10 grid grid-cols-[1fr_auto_1fr] items-center h-[64px]">
          <div />
          <div className="flex justify-center">{logo}</div>
          <div className="flex justify-end">{icons}</div>
        </div>
        {navLinks.length > 0 && (
          <div className={clsx('hidden md:flex justify-center border-t py-2', dark ? 'border-white/10' : 'border-bone')}>{desktopNav}</div>
        )}
        {mobileMenu}
      </header>
    );
  }

  return (
    <header className={headerCls} style={{ fontFamily: `${cfg.font}, sans-serif` }}>
      <div className="px-4 sm:px-6 lg:px-10 h-[64px] flex items-center gap-4">
        {logo}

        {navAlignment !== 'left' && <div className="flex-1" />}
        <div className={clsx(navAlignment === 'left' && 'ml-4')}>{desktopNav}</div>
        {navAlignment !== 'right' && <div className="flex-1" />}

        {icons}
      </div>

      {mobileMenu}
    </header>
  );
}
