import { useStorefront } from '@/features/storefront/StorefrontContext';

export interface CheckoutBrandingData { logoUrl: string | null; accentColor: string | null; footerLinks: { label: string; url: string }[] }

/** The seller's checkout branding (Settings -> Checkout rules -> Checkout branding). Null when none is set, then every theme looks exactly as before. */
export function useCheckoutBranding(): CheckoutBrandingData | null {
  const { store } = useStorefront();
  const b = (store as { checkoutBranding?: CheckoutBrandingData | null }).checkoutBranding;
  return b && (b.logoUrl || b.accentColor || (b.footerLinks?.length ?? 0) > 0) ? b : null;
}
