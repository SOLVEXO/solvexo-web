import type { ReactNode } from 'react';
import { StoreAnnouncementBar } from '@/components/comman/ui';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierNavbar } from '../components/AtelierNavbar';
import { AtelierFooter } from '../components/AtelierFooter';
import { atelierTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import '../atelier.css';

/** Theme 01's own root chrome — the sole storefront chrome now that the
 *  legacy 12-theme shared engine has been removed. Mounted unconditionally
 *  by `StorefrontLayout` for every store, regardless of `themeDefinitionId`.
 *  Renders the store's real seller-configured announcement bar
 *  (`StoreAnnouncementBar`, real shared platform UI — not theme chrome) so
 *  that real feature isn't silently lost for a store that had one set. */
export function AtelierLayout({ children }: { children: ReactNode }) {
  const { store, theme } = useStorefront();
  // Real, PUBLISHED merchant customization (colors/font/buttons/spacing) —
  // never the unsaved draft on the live storefront. Mutates the shared
  // `atelierTheme` singleton synchronously, before any descendant below
  // reads `t.colors.x`/`t.fonts.x` — see the doc comment on `atelierTheme`.
  applyMerchantThemeOverrides(theme?.theme ?? null);
  return (
    <div style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, minHeight: '100vh' }}>
      {theme?.customCss && <style>{theme.customCss}</style>}
      <AtelierNavbar />
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
      <AtelierFooter />
    </div>
  );
}
