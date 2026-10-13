import type { ReactNode } from 'react';
import { StoreAnnouncementBar } from '@/components/comman/ui';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { CartDrawerProvider } from '../../CartDrawer';
import { NovaButton } from '../components/NovaButton';
import { NovaNavbar } from '../components/NovaNavbar';
import { NovaFooter } from '../components/NovaFooter';
import { novaTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import '../nova.css';

/** Theme 02's own root chrome — dispatched generically by `StorefrontLayout`
 *  for any store whose active theme is Nova (see `StorefrontLayout.tsx`'s
 *  real dispatch: `NEW_THEME_REGISTRY[themeId]?.Layout`, already
 *  theme-agnostic before this theme existed). Renders the store's real
 *  seller-configured announcement bar (`StoreAnnouncementBar`, real shared
 *  platform UI — not theme chrome), same as `AtelierLayout`. */
export function NovaLayout({ children }: { children: ReactNode }) {
  const { store, theme } = useStorefront();
  // Real, PUBLISHED merchant customization (colors/font/buttons/spacing) —
  // never the unsaved draft on the live storefront. Mutates the shared
  // `novaTheme` singleton synchronously, before any descendant below reads
  // `t.colors.x`/`t.fonts.x` — see the doc comment on `novaTheme`.
  applyMerchantThemeOverrides(theme?.theme ?? null);
  const bar = store.announcementBar;
  const announcementAbove = bar?.placement === 'above';
  const announcement = bar?.message ? (
    <StoreAnnouncementBar
      storeId={store.storeId}
      message={bar.message}
      type={bar.type}
      ctaLabel={bar.ctaLabel}
      ctaLink={bar.ctaLink}
      moreMessages={bar.moreMessages}
      rotateSeconds={bar.rotateSeconds}
      closable={bar.closable}
      bgColor={bar.bgColor}
      textColor={bar.textColor}
      align={bar.align}
      themeColors={{ bg: t.colors.bgAlt, text: t.colors.ink, border: t.colors.border }}
    />
  ) : null;
  return (
    <CartDrawerProvider theme={t} Button={NovaButton}>
    <div style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, minHeight: '100vh' }}>
      {theme?.customCss && <style>{theme.customCss}</style>}
      {announcementAbove && announcement}
      <NovaNavbar />
      {!announcementAbove && announcement}
      {children}
      <NovaFooter />
    </div>
    </CartDrawerProvider>
  );
}
