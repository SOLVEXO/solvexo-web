import type { ReactNode } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { FashionCartDrawerProvider } from '../components/cart/FashionCartDrawer';
import { FashionAnnouncementBar } from '../components/FashionAnnouncementBar';
import { FashionNavbar } from '../components/FashionNavbar';
import { FashionFooter } from '../components/FashionFooter';
import { FashionToaster } from '../components/FashionToaster';
import { fashionTheme as t, applyMerchantThemeOverrides, fashionTypographyCss } from '../theme.config';
import '../fashion.css';

/** Root chrome for stores running the Fashion theme: announcement bar, header, page, footer, cart drawer, toasts. */
export function FashionLayout({ children }: { children: ReactNode }) {
  const { store, theme } = useStorefront();
  // Published merchant customization (never the unsaved draft) goes into the theme singleton before children read it.
  applyMerchantThemeOverrides(theme?.theme ?? null);
  const bar = store.announcementBar;
  const above = bar?.placement === 'above';
  const announcement = bar?.message ? <FashionAnnouncementBar {...bar} storeId={store.storeId} /> : null;
  return (
    <FashionCartDrawerProvider>
      <div className="flex min-h-screen flex-col" style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>
        <style>{fashionTypographyCss('main')}</style>
        {above && announcement}
        <FashionNavbar />
        {!above && announcement}
        <main className="flex-1">{children}</main>
        <FashionFooter />
      </div>
      <FashionToaster />
    </FashionCartDrawerProvider>
  );
}
