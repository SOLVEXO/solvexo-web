import type { ReactNode } from 'react';
import { StoreAnnouncementBar } from '@/components/comman/ui';
import { useStorefront } from '@/features/storefront/StorefrontContext';
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
  return (
    <div style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, minHeight: '100vh' }}>
      {theme?.customCss && <style>{theme.customCss}</style>}
      <NovaNavbar />
      {store.announcementBar?.message && (
        <StoreAnnouncementBar
          storeId={store.storeId}
          message={store.announcementBar.message}
          type={store.announcementBar.type}
          ctaLabel={store.announcementBar.ctaLabel}
          ctaLink={store.announcementBar.ctaLink}
        />
      )}
      {children}
      <NovaFooter />
    </div>
  );
}
