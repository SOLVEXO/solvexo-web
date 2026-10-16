import type { MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, Star } from 'lucide-react';
import { PRODUCT_CARD_RATIO } from '../../imageFit';
import { fashionTheme as t } from '../theme.config';
import { buttonLook } from './buttonLook';

export interface ProductCardViewProps {
  to: string;
  name: string;
  image?: string;
  secondImage?: string;
  tag?: string;
  rating?: number;
  price?: string;
  comparePrice?: string;
  percentOff?: number;
  soldOut?: boolean;
  /** `null` hides the heart; otherwise filled when true. */
  wished?: boolean | null;
  onWish?: MouseEventHandler<HTMLButtonElement>;
  /** Shows "Add to cart" when set; otherwise a link to the product. */
  onAdd?: MouseEventHandler<HTMLButtonElement>;
  adding?: boolean;
  /** Shows a "Quick view" pill over the image on hover when set. */
  onQuickView?: MouseEventHandler<HTMLButtonElement>;
  /** Colour options of the product; hovering one calls `onSwatch` with that colour's photo (undefined on leave). */
  swatches?: { value: string; image?: string }[];
  onSwatch?: (image?: string) => void;
}

const BORDER: Record<string, string> = { theme: '1px solid var(--fx-b)', flat: 'none', outlined: '1px solid var(--fx-b)', elevated: 'none' };

/** Presentational product card shared by the live storefront and the Theme Library demo (no store/cart context needed). */
export function FashionProductCardView({ to, name, image, secondImage, tag, rating = 0, price, comparePrice, percentOff = 0, soldOut, wished = null, onWish, onAdd, adding, onQuickView, swatches, onSwatch }: ProductCardViewProps) {
  const onSale = t.saleBadge && !!comparePrice && percentOff > 0;
  const stars = Math.round(rating);
  const ratio = PRODUCT_CARD_RATIO[t.productImageRatio] ?? '1 / 1';

  return (
    <article className="group flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,.15)]"
      style={{ ['--fx-b' as string]: t.colors.border, border: BORDER[t.cardStyle ?? 'theme'], boxShadow: t.cardStyle === 'elevated' ? '0 4px 24px -8px rgba(0,0,0,.14)' : undefined, borderRadius: t.productCardRadiusPx, background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>
      <Link to={to} className="relative block overflow-hidden" style={{ aspectRatio: ratio === 'auto' ? undefined : ratio, background: t.colors.bgAlt }} aria-label={name}>
        {image ? <img src={image} alt={name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" /> : <div className="absolute inset-0" />}
        {secondImage && <img src={secondImage} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
        <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
          {soldOut && t.soldOutBadge && <Chip tone="dark">Sold out</Chip>}
          {!soldOut && onSale && <Chip tone="sale">-{percentOff}%</Chip>}
        </div>
        {onQuickView && !soldOut && (
          <button type="button" onClick={onQuickView} className="fx-pill absolute inset-x-4 bottom-4 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100" style={{ ...buttonLook('outline'), background: t.colors.bg, height: 40 }}>Quick view</button>
        )}
        {wished !== null && (
          <button type="button" onClick={onWish} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wished}
            className="absolute right-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-full border-0 transition-transform hover:scale-110" style={{ background: t.colors.bg, color: t.colors.ink }}>
            <Heart size={16} fill={wished ? t.colors.danger : 'none'} stroke={wished ? t.colors.danger : 'currentColor'} />
          </button>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-col gap-1.5">
          {tag && <span className="text-xs capitalize" style={{ color: t.colors.inkMuted }}>{tag}</span>}
          <Link to={to} className="no-underline" style={{ color: t.colors.ink }}><h3 className="m-0 line-clamp-1 text-base font-medium md:text-lg">{name}</h3></Link>
          {stars > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${stars} out of 5`}>
              <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill={i < stars ? '#FB923C' : 'none'} stroke="#FB923C" />)}</span>
              <small className="text-xs">{rating.toFixed(1)}</small>
            </div>
          )}
          {swatches && swatches.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0" aria-label="Available colours">
              {swatches.slice(0, 5).map(sw => (
                <li key={sw.value} title={sw.value} onMouseEnter={() => onSwatch?.(sw.image)} onMouseLeave={() => onSwatch?.(undefined)}>
                  {isCssColor(sw.value)
                    ? <span role="img" aria-label={sw.value} className="block size-4 rounded-full" style={{ background: sw.value, border: `1px solid ${t.colors.border}` }} />
                    : <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.inkMuted }}>{sw.value}</span>}
                </li>
              ))}
              {swatches.length > 5 && <li className="text-xs" style={{ color: t.colors.inkMuted }}>+{swatches.length - 5}</li>}
            </ul>
          )}
          {price && (
            <p className="m-0 flex items-baseline gap-2">
              <span className="text-base font-semibold md:text-lg" style={{ color: onSale ? t.colors.danger : t.colors.ink }}>{price}</span>
              {onSale && <span className="text-sm line-through" style={{ color: t.colors.inkMuted }}>{comparePrice}</span>}
            </p>
          )}
        </div>
        <div className="mt-auto flex gap-2">
          {onAdd ? (
            <button type="button" onClick={onAdd} disabled={adding} className="fx-pill min-w-0 flex-1 whitespace-nowrap" style={{ ...buttonLook('primary'), height: 42, padding: '0 12px' }}>{adding ? 'Adding…' : 'Add to cart'}</button>
          ) : (
            <Link to={to} className="fx-pill min-w-0 flex-1 whitespace-nowrap" style={{ ...buttonLook('outline'), height: 42, padding: '0 12px' }}>{soldOut ? 'View product' : 'Choose options'}</Link>
          )}
          <span className="hidden sm:block"><Link to={to} aria-label={`View ${name}`} className="fx-pill" style={{ ...buttonLook('outline'), width: 42, height: 42, padding: 0 }}><ArrowUpRight size={16} /></Link></span>
        </div>
      </div>
    </article>
  );
}

/** True for values the browser can paint as a colour ("Red", "#c2410c"); other option values render as a text chip. */
function isCssColor(value: string): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', value);
}

function Chip({ tone, children }: { tone: 'sale' | 'dark'; children: React.ReactNode }) {
  return <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={tone === 'sale' ? { background: t.colors.danger, color: '#fff' } : { background: t.colors.ink, color: t.colors.bg }}>{children}</span>;
}
