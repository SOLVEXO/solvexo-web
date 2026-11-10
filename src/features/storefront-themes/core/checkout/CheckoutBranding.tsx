import { Link } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCheckoutBranding } from './useCheckoutBranding';

export interface BrandTokens { ink: string; inkMuted: string; border: string }

/** Top of every theme's checkout: the checkout logo (links back to the store). Also sets the brand accent for links and form controls below it. */
export function CheckoutBrandBar({ tokens }: { tokens: BrandTokens }) {
  const b = useCheckoutBranding();
  const { store } = useStorefront();
  if (!b) return null;
  return (
    <>
      {b.accentColor && (
        // Accent applies to links, checkboxes, radios and focus rings inside the checkout (theme buttons keep the theme's own colour).
        <style>{`.sx-checkout-brand a:not([class*="btn"]){color:${b.accentColor}} .sx-checkout-brand input[type=checkbox],.sx-checkout-brand input[type=radio]{accent-color:${b.accentColor}} .sx-checkout-brand :focus-visible{outline-color:${b.accentColor}}`}</style>
      )}
      {b.logoUrl && (
        <div className="mb-4 flex justify-center border-b pb-4" style={{ borderColor: tokens.border }}>
          <Link to="/" aria-label={store.name}><img src={b.logoUrl} alt={store.name} className="max-h-12 w-auto max-w-[220px] object-contain" loading="eager" /></Link>
        </div>
      )}
    </>
  );
}

/** Bottom of every theme's checkout: the seller's footer links (policies, contact...). */
export function CheckoutBrandFooter({ tokens }: { tokens: BrandTokens }) {
  const b = useCheckoutBranding();
  if (!b || b.footerLinks.length === 0) return null;
  return (
    <nav aria-label="Checkout footer" className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t pt-4 text-xs" style={{ borderColor: tokens.border, color: tokens.inkMuted }}>
      {b.footerLinks.map((l, i) => (l.url.startsWith('/')
        ? <Link key={i} to={l.url} className="underline">{l.label}</Link>
        : <a key={i} href={l.url} target="_blank" rel="noreferrer noopener" className="underline">{l.label}</a>))}
    </nav>
  );
}
