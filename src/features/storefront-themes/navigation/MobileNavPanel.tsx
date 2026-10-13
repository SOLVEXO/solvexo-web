import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Heart, Minus, Plus, Search, User, X } from 'lucide-react';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { MobileNavItem, type MobileNavTokens } from './MobileNavItem';

export interface MobileNavPanelTokens extends MobileNavTokens {
  bg: string;
  displayFont: string;
}

interface ShopLink { id: string; label: string; to: string }

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Slide-in mobile navigation (both themes). Locks page scroll, closes on Esc / backdrop / link, traps Tab inside
 *  the panel and hands focus back to whatever opened it. Rendered in a portal so a sticky header can't clip it. */
export function MobileNavPanel({
  open, onClose, tokens, storeName, brand, items, shop, showSearch, onSearch, showAccount, accountTo, showWishlist, wishlistCount, footer,
}: {
  open: boolean;
  onClose: () => void;
  tokens: MobileNavPanelTokens;
  storeName: string;
  /** The logo / wordmark shown at the top of the panel. */
  brand: ReactNode;
  items: ResolvedStorefrontNavItem[];
  /** The auto "Shop" group (categories + collections); null when the seller turned it off or the store has none. */
  shop: { label: string; categories: ShopLink[]; collections: ShopLink[] } | null;
  showSearch: boolean;
  onSearch: () => void;
  showAccount: boolean;
  accountTo: string;
  showWishlist: boolean;
  wishlistCount: number;
  /** e.g. the currency selector. */
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      returnFocusTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const rowStyle = {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left' as const,
    background: 'transparent', border: 'none', borderBottom: `1px solid ${tokens.colors.border}`, cursor: 'pointer',
    padding: `14px ${tokens.padX}`, color: tokens.colors.ink, fontFamily: tokens.fonts.body, fontSize: tokens.topSize,
    fontWeight: tokens.topWeight, letterSpacing: tokens.topTracking, textTransform: tokens.topUppercase ? ('uppercase' as const) : undefined,
    textDecoration: 'none',
  };

  return createPortal(
    <div className="lg:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`${storeName} menu`}>
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 border-0 cursor-default" style={{ background: 'rgba(0,0,0,0.45)' }} />
      <div
        ref={panelRef}
        className="absolute left-0 top-0 bottom-0 flex flex-col overflow-y-auto"
        style={{ width: 'min(88vw, 380px)', background: tokens.bg, boxShadow: '0 0 40px rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-center justify-between" style={{ padding: `16px ${tokens.padX}`, borderBottom: `1px solid ${tokens.colors.border}` }}>
          <div className="min-w-0">{brand}</div>
          <button type="button" onClick={onClose} aria-label="Close menu" className="bg-transparent border-0 cursor-pointer p-1" style={{ color: tokens.colors.ink }}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col" aria-label="Mobile">
          {showSearch && (
            <button type="button" onClick={() => { onClose(); onSearch(); }} style={rowStyle}>
              <Search size={16} /> Search
            </button>
          )}
          {shop && <ShopGroup shop={shop} tokens={tokens} rowStyle={rowStyle} onNavigate={onClose} />}
          {items.map(item => <MobileNavItem key={item.id} item={item} tokens={tokens} onNavigate={onClose} />)}
          {showAccount && (
            <Link to={accountTo} onClick={onClose} style={rowStyle}><User size={16} /> Account</Link>
          )}
          {showWishlist && (
            <Link to="/wishlist" onClick={onClose} style={rowStyle}>
              <Heart size={16} /> Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
            </Link>
          )}
        </nav>

        {footer && <div style={{ padding: `16px ${tokens.padX}` }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

function ShopGroup({ shop, tokens, rowStyle, onNavigate }: {
  shop: { label: string; categories: ShopLink[]; collections: ShopLink[] };
  tokens: MobileNavPanelTokens;
  rowStyle: React.CSSProperties;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();
  const sub = (heading: string, links: ShopLink[]) => links.length > 0 && (
    <div className="flex flex-col">
      <p style={{ margin: 0, padding: `10px ${tokens.padX} 4px`, fontFamily: tokens.fonts.body, fontSize: '10.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.colors.inkMuted }}>{heading}</p>
      {links.map(l => (
        <Link key={l.id} to={l.to} onClick={onNavigate} className="no-underline"
          style={{ padding: `9px ${tokens.padX}`, color: tokens.colors.inkMuted, fontFamily: tokens.fonts.body, fontSize: tokens.childSize }}>
          {l.label}
        </Link>
      ))}
    </div>
  );
  return (
    <div>
      <button type="button" onClick={() => setExpanded(e => !e)} aria-expanded={expanded} aria-controls={regionId} style={{ ...rowStyle, justifyContent: 'space-between' }}>
        <span>{shop.label}</span>
        {expanded ? <Minus size={15} /> : <Plus size={15} />}
      </button>
      {expanded && (
        <div id={regionId} style={{ background: tokens.colors.bgAlt, borderBottom: `1px solid ${tokens.colors.border}`, paddingBottom: '6px' }}>
          <Link to="/#shop" onClick={onNavigate} className="no-underline"
            style={{ display: 'block', padding: `9px ${tokens.padX}`, color: tokens.colors.ink, fontFamily: tokens.fonts.body, fontSize: tokens.childSize }}>
            All products
          </Link>
          {sub('Categories', shop.categories)}
          {sub('Collections', shop.collections)}
        </div>
      )}
    </div>
  );
}
