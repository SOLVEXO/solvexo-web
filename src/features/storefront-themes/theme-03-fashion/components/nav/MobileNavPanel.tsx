import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart, Minus, Plus, Search, User, X } from 'lucide-react';
import type { ResolvedStorefrontNavItem } from '@/features/storefront/StorefrontContext';
import { fashionTheme as t } from '../../theme.config';
import { useDialogFocus } from '../../../core/hooks/useDialogFocus';
import { MobileNavItem } from './MobileNavItem';
import { ts } from '@/utils/tStatic';

interface ShopLink { id: string; label: string; to: string }
interface ShopGroupData { label: string; categories: ShopLink[]; collections: ShopLink[] }

interface Props {
  open: boolean;
  onClose: () => void;
  storeName: string;
  /** Logo / wordmark shown at the top of the panel. */
  brand: ReactNode;
  items: ResolvedStorefrontNavItem[];
  /** The auto "Shop" group (categories + collections); null when the seller turned it off or the store has none. */
  shop: ShopGroupData | null;
  showSearch: boolean;
  onSearch: () => void;
  showAccount: boolean;
  accountTo: string;
  showWishlist: boolean;
  wishlistCount: number;
  /** e.g. the language / currency selectors. */
  footer?: ReactNode;
}

/** Slide-in mobile navigation. Locks page scroll, closes on Esc / backdrop / link, traps Tab inside the panel and
 *  returns focus to its opener. Rendered in a portal so a sticky header can't clip it. */
export function FashionMobileNav(props: Props) {
  if (!props.open) return null;
  return createPortal(<Panel {...props} />, document.body);
}

function Panel({ onClose, storeName, brand, items, shop, showSearch, onSearch, showAccount, accountTo, showWishlist, wishlistCount, footer }: Props) {
  const { t: tr } = useTranslation('storefront');
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);

  const quick: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'start', border: 'none', cursor: 'pointer', textDecoration: 'none',
    padding: '13px 18px', borderRadius: 9999, background: t.colors.bgAlt, color: t.colors.ink, fontFamily: t.fonts.body, fontSize: 15, fontWeight: 500,
  };

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label={ts('pg.store_menu', '{{store}} menu', { store: storeName })}>
      <button type="button" aria-label={tr('nav.closeMenu', 'Close menu')} onClick={onClose} className="fx-backdrop absolute inset-0 cursor-default border-0" style={{ background: 'rgba(9,9,11,0.45)' }} />
      <div ref={ref} tabIndex={-1} className="fx-drawer-left absolute bottom-0 start-0 top-0 flex w-[min(90vw,400px)] flex-col overflow-y-auto outline-none"
        style={{ background: t.colors.bg, color: t.colors.ink, borderStartEndRadius: 28, borderEndEndRadius: 28, boxShadow: '0 0 48px rgba(0,0,0,.25)' }}>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">{brand}</div>
          <button type="button" onClick={onClose} aria-label={tr('nav.closeMenu', 'Close menu')} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 p-0" style={{ background: t.colors.bgAlt, color: t.colors.ink }}>
            <X size={18} />
          </button>
        </div>

        {showSearch && (
          <div className="px-5 pb-3">
            <button type="button" onClick={() => { onClose(); onSearch(); }} style={{ ...quick, color: t.colors.inkMuted }}>
              <Search size={17} /> {tr('nav.searchProducts', 'Search products…')}
            </button>
          </div>
        )}

        <nav className="flex flex-col px-5" aria-label={tr('nav.mobile', 'Mobile')}>
          {shop && <ShopGroup shop={shop} onNavigate={onClose} />}
          {items.map(item => <MobileNavItem key={item.id} item={item} onNavigate={onClose} />)}
        </nav>

        {(showAccount || showWishlist) && (
          <div className="mt-5 flex flex-col gap-2.5 px-5">
            {showAccount && <Link to={accountTo} onClick={onClose} style={quick}><User size={17} /> {tr('nav.account', 'Account')}<ChevronRight size={16} className="fx-flip-rtl ms-auto opacity-50" /></Link>}
            {showWishlist && (
              <Link to="/wishlist" onClick={onClose} style={quick}>
                <Heart size={17} /> {tr('nav.wishlist', 'Wishlist')}{wishlistCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold" style={{ background: t.colors.accent, color: t.colors.accentInk }}>{wishlistCount}</span>}
                <ChevronRight size={16} className="fx-flip-rtl ms-auto opacity-50" />
              </Link>
            )}
          </div>
        )}

        {footer && <div className="mt-auto flex flex-wrap items-center gap-2 px-5 pb-6 pt-6">{footer}</div>}
      </div>
    </div>
  );
}

function ShopGroup({ shop, onNavigate }: { shop: ShopGroupData; onNavigate: () => void }) {
  const { t: tr } = useTranslation('storefront');
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();
  const link = { fontFamily: t.fonts.body, fontSize: 15, color: t.colors.ink } as const;
  const sub = (heading: string, links: ShopLink[]) => links.length > 0 && (
    <div className="flex flex-col pb-1">
      <p className="m-0 px-[18px] pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.colors.inkMuted }}>{heading}</p>
      {links.map(l => <Link key={l.id} to={l.to} onClick={onNavigate} className="px-[18px] py-2.5 no-underline" style={{ ...link, color: t.colors.inkMuted }}>{l.label}</Link>)}
    </div>
  );
  return (
    <div style={{ borderBottom: `1px solid ${t.colors.border}` }}>
      <button type="button" onClick={() => setExpanded(e => !e)} aria-expanded={expanded} aria-controls={regionId}
        className="flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent py-4 ps-1 text-start" style={{ color: t.colors.ink, fontFamily: t.fonts.body, fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>
        <span>{shop.label}</span>
        <span className="grid size-10 place-items-center rounded-full" style={{ background: expanded ? t.colors.selected : t.colors.bgAlt, color: expanded ? t.colors.selectedInk : t.colors.ink }}>{expanded ? <Minus size={15} /> : <Plus size={15} />}</span>
      </button>
      {expanded && (
        <div id={regionId} className="mb-3 overflow-hidden pb-2" style={{ background: t.colors.bgAlt, borderRadius: 20 }}>
          <Link to="/#shop" onClick={onNavigate} className="block px-[18px] py-3 font-semibold no-underline" style={link}>{tr('nav.allProducts', 'All products')}</Link>
          {sub(tr('nav.categories', 'Categories'), shop.categories)}
          {sub(tr('nav.collections', 'Collections'), shop.collections)}
        </div>
      )}
    </div>
  );
}
