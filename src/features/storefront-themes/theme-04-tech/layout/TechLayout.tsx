import type { ReactNode } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { baseTypographyCss } from '../theme.base';
import { TechToaster } from '../components/TechToaster';
import { TechAnnouncementBar } from '../components/TechAnnouncementBar';
import { TechCartProvider } from '../components/TechCart';
import { TechNavbar } from '../components/TechNavbar';
import { TechFooter } from '../components/TechFooter';
import { techTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import { techCssVars } from '../ui/techStyle';
import '../tech.css';

/** Root chrome for stores on the Tech Store theme: top bar, header, page, footer, mini cart, toasts. */
export function TechLayout({ children }: { children: ReactNode }) {
  const { store, theme } = useStorefront();
  // Published merchant customization (never the unsaved draft) goes into the theme singleton before children read it.
  applyMerchantThemeOverrides(theme?.theme ?? null);
  const bar = store.announcementBar;
  const above = bar?.placement === 'above';
  const announcement = bar?.message ? <TechAnnouncementBar {...bar} storeId={store.storeId} /> : null;
  return (
    <TechCartProvider>
      <div className="tx-root flex min-h-screen flex-col" style={{ ...techCssVars(), background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>
        <style>{baseTypographyCss('main')}</style>
        {above && announcement}
        <TechNavbar />
        {!above && announcement}
        <main className="flex-1">{children}</main>
        <TechFooter />
      </div>
      <TechToaster />
    </TechCartProvider>
  );
}
