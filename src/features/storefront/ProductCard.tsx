import { clsx } from 'clsx';
import { useStorefront } from './StorefrontContext';

// Two small shared primitives (not one monolithic card) — `ProductCatalogSection`
// (full grid card: wishlist, add-to-cart, badges) and `FeaturedProductsSection`
// (compact horizontal-scroll strip) have genuinely different action content
// around the product, but both now wrap that content in these same two
// pieces, so `productCardStyle`/`productCardRadius`/`productImageRatio`/
// `productImageHover` apply identically to both. These read ONLY the
// Product Cards scope — never the independent testimonial-card or button
// tokens, even though they share the same 3 style names.

export function ProductCardShell({ children, onClick, className }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; className?: string;
}) {
  const { cfg } = useStorefront();
  const chrome =
    cfg.productCardStyle === 'flat'     ? '' :
    cfg.productCardStyle === 'elevated' ? 'shadow-[0_2px_10px_rgba(20,15,10,0.08)] hover:shadow-[0_8px_24px_rgba(20,15,10,0.14)]' :
    /* outlined */                         'border border-bone';
  return (
    <div
      onClick={onClick}
      className={clsx('group relative bg-white overflow-hidden transition-shadow duration-200', chrome, onClick && 'cursor-pointer', className)}
      style={{ borderRadius: cfg.productCardRadiusPx }}
    >
      {children}
    </div>
  );
}

export function ProductCardImage({ children }: { children: React.ReactNode }) {
  const { cfg } = useStorefront();
  const ratio = cfg.productImageRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square';
  const hover = cfg.productImageHover === 'zoom' ? 'group-hover:scale-[1.06]' : '';
  return (
    <div className={clsx('relative w-full overflow-hidden bg-brand-pale-orange', ratio)}>
      <div className={clsx('w-full h-full flex items-center justify-center transition-transform duration-500 ease-out', hover)}>
        {children}
      </div>
    </div>
  );
}
