import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Menu, X, ShoppingCart, User, Store as StoreIcon, Search, ChevronDown } from 'lucide-react';
import { useStorefront } from './StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { TokenStorage } from '@/api/services/auth';
import { ThemedButton } from './ThemedButton';
import { CurrencySelector } from '@/components/comman/ui/BuyerNavbar';

type ResolveLink = ReturnType<typeof useStorefront>['resolveLink'];
type NavLinkData = { _id?: string; settings: Record<string, any> };

function plainLinkProps(link: NavLinkData, resolveLink: ResolveLink) {
  const { to, href } = resolveLink(link.settings as { linkType: string; pageSlug?: string; url?: string; categoryId?: string; collectionId?: string });
  return { to, href, label: link.settings.label as string };
}

// One nav link, shared by the desktop and mobile menus — renders as a
// themed button when the seller toggled "Highlight as button" on it in the
// Store Builder, otherwise the same plain text link as before. Used only for
// links with NO dropdown children — see `DesktopNavLinkItem`/`MobileNavLinkItem`
// below for the dropdown-aware variants.
function NavLinkItem({ link, resolveLink, className, onNavigate }: {
  link: NavLinkData;
  resolveLink: ResolveLink;
  className: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { to, href, label } = plainLinkProps(link, resolveLink);

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

// Desktop nav item — renders a real dropdown (hover on pointer devices,
// click-toggle for keyboard/touch) when the block has `settings.children`.
function DesktopNavLinkItem({ link, resolveLink, className, dark }: {
  link: NavLinkData;
  resolveLink: ResolveLink;
  className: string;
  dark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const children: Array<{ _id?: string; label: string; linkType: string; pageSlug?: string; url?: string; categoryId?: string; collectionId?: string }> = link.settings.children ?? [];
  if (children.length === 0) return <NavLinkItem link={link} resolveLink={resolveLink} className={className} />;

  const { label } = plainLinkProps(link, resolveLink);
  return (
    <div
      key={link._id ?? label}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(className, 'bg-transparent border-none cursor-pointer flex items-center gap-1 p-0')}
      >
        {label}
        <ChevronDown size={13} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute left-0 top-full mt-1 min-w-[180px] rounded-lg border shadow-lg py-1.5 z-50',
            dark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-bone',
          )}
        >
          {children.map((child, i) => {
            const { to, href } = resolveLink(child);
            const itemCls = clsx(
              'block px-3.5 py-2 text-[13px] font-medium no-underline transition-colors',
              dark ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-graphite hover:text-charcoal hover:bg-cream',
            );
            return to
              ? <Link key={child._id ?? i} to={to} role="menuitem" className={itemCls} onClick={() => setOpen(false)}>{child.label}</Link>
              : <a key={child._id ?? i} href={href} target="_blank" rel="noopener noreferrer" role="menuitem" className={itemCls}>{child.label}</a>;
          })}
        </div>
      )}
    </div>
  );
}

// Mobile nav item — an accordion: a parent with children expands/collapses
// in place instead of navigating, matching the standard mobile-menu pattern.
function MobileNavLinkItem({ link, resolveLink, className, onNavigate }: {
  link: NavLinkData;
  resolveLink: ResolveLink;
  className: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const children: Array<{ _id?: string; label: string; linkType: string; pageSlug?: string; url?: string; categoryId?: string; collectionId?: string }> = link.settings.children ?? [];
  if (children.length === 0) return <NavLinkItem link={link} resolveLink={resolveLink} className={className} onNavigate={onNavigate} />;

  const { label } = plainLinkProps(link, resolveLink);
  return (
    <div key={link._id ?? label} className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={clsx(className, 'bg-transparent border-none cursor-pointer flex items-center justify-between w-full p-0')}
      >
        {label}
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="flex flex-col pl-3 gap-1.5 pb-1">
          {children.map((child, i) => {
            const { to, href } = resolveLink(child);
            const itemCls = clsx(className, 'text-[12.5px] opacity-80');
            return to
              ? <Link key={child._id ?? i} to={to} onClick={onNavigate} className={itemCls}>{child.label}</Link>
              : <a key={child._id ?? i} href={href} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={itemCls}>{child.label}</a>;
          })}
        </div>
      )}
    </div>
  );
}

// The seller's own storefront chrome — deliberately has ZERO Solvexo branding
// (no Solvexo logo, no platform nav links). Used only on a store's own
// subdomain via `StorefrontLayout`; the rest of the app keeps the shared
// `BuyerNavbar`. Cart, sign-in/register, and the logged-in Account button
// all stay on this same subdomain now (`StorefrontCartPage`/
// `StorefrontLoginPage`/`StorefrontRegisterPage`/`StorefrontAccountPage`) —
// a buyer's session here is genuinely store-scoped (see `User.storeId`) and
// isn't even visible on the apex origin any more, so a cross-origin nav to
// the apex Account Workspace would show a false logged-out state.
export function StorefrontNavbar() {
  const navigate = useNavigate();
  const { store, theme, cfg, resolveLink } = useStorefront();
  const { cartCount } = useCartContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isLoggedIn = TokenStorage.isLoggedIn();

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
  };

  const logoUrl = theme?.header?.logoSource === 'custom' ? theme.header.customLogoUrl : store.logo;
  const navLinks = theme?.header?.blocks?.filter(b => b.type === 'nav_link') ?? [];
  const navAlignment = theme?.header?.navAlignment ?? 'left';
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
        <DesktopNavLinkItem
          key={link._id ?? link.settings.label}
          link={link}
          resolveLink={resolveLink}
          dark={dark}
          className={clsx('text-[13px] font-medium no-underline transition-colors', dark ? 'text-white/70 hover:text-white' : 'text-graphite hover:text-charcoal')}
        />
      ))}
    </nav>
  );

  const icons = (
    <div className="flex items-center gap-1 shrink-0">
      <CurrencySelector allowed={store.enabledCurrencies ?? undefined} />
      <button
        onClick={() => setSearchOpen(o => !o)}
        aria-label="Search"
        className={clsx('w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors', dark ? 'hover:bg-white/10' : 'hover:bg-cream')}
      >
        <Search size={18} className={dark ? 'text-white' : 'text-charcoal'} />
      </button>

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
        onClick={() => navigate(isLoggedIn ? '/account' : '/login')}
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
        <MobileNavLinkItem
          key={link._id ?? link.settings.label}
          link={link}
          resolveLink={resolveLink}
          className={clsx('py-2.5 text-[13px] font-medium no-underline', dark ? 'text-white/80' : 'text-graphite')}
          onNavigate={() => setMobileOpen(false)}
        />
      ))}
    </nav>
  );

  const searchBar = searchOpen && (
    <form onSubmit={submitSearch} className={clsx('px-4 sm:px-6 lg:px-10 py-2.5 border-t flex items-center gap-2', dark ? 'border-white/10' : 'border-bone')}>
      <Search size={15} className={dark ? 'text-white/50' : 'text-slate'} />
      <input
        autoFocus
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder={`Search ${store.name}…`}
        className={clsx(
          'flex-1 min-w-0 bg-transparent border-none outline-none text-[13.5px]',
          dark ? 'text-white placeholder:text-white/40' : 'text-charcoal placeholder:text-slate',
        )}
      />
      <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className={clsx('bg-transparent border-none cursor-pointer p-1', dark ? 'text-white/60' : 'text-slate')}>
        <X size={15} />
      </button>
    </form>
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
        {searchBar}
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

      {searchBar}
      {mobileMenu}
    </header>
  );
}
