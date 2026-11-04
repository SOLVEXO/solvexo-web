import type { ReactNode } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { fashionTypographyCss } from '../../theme-03-fashion/theme.config';
import { FashionToaster } from '../../theme-03-fashion/components/FashionToaster';
import { FashionAnnouncementBar } from '../../theme-03-fashion/components/FashionAnnouncementBar';
import { TechCartProvider } from '../components/TechCart';
import { TechNavbar } from '../components/TechNavbar';
import { TechFooter } from '../components/TechFooter';
import { techTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import { techCssVars } from '../ui/techStyle';
// fashion.css carries the shared `.fx-*` helpers the reused (token-bridged) pages rely on; tech.css is Tech's own.
import '../../theme-03-fashion/fashion.css';
import '../tech.css';

/** Root chrome for stores on the Tech Store theme: top bar, header, page, footer, mini cart, toasts. */
export function TechLayout({ children }: { children: ReactNode }) {
  const { store, theme } = useStorefront();
  // Published merchant customization (never the unsaved draft) goes into the theme singleton before children read it.
  applyMerchantThemeOverrides(theme?.theme ?? null);
  const bar = store.announcementBar;
  const above = bar?.placement === 'above';
  const announcement = bar?.message ? <FashionAnnouncementBar {...bar} storeId={store.storeId} /> : null;
  return (
    <TechCartProvider>
      <div className="tx-root fx-root flex min-h-screen flex-col" style={{ ...techCssVars(), background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>
        <style>{fashionTypographyCss('main')}</style>
        {above && announcement}
        <TechNavbar />
        {!above && announcement}
        <main className="flex-1">{children}</main>
        <TechFooter />
      </div>
      <FashionToaster />
    </TechCartProvider>
  );
}
