import { useEffect, type ReactNode } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { baseTypographyCss } from '../theme.base';
import { LedupNavbar } from '../components/LedupNavbar';
import { LedupFooter } from '../components/LedupFooter';
import { LedupCartProvider } from '../components/LedupCart';
import { LedupPreloader } from '../components/LedupPreloader';
import { LedupToaster } from '../components/LedupToaster';
import { ledupTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import { ledupCssVars } from '../ui/ledupStyle';
import '../ledup.css';
import { ledupCssVars as txCssVars } from '../ui/ledupStylePort';
import '../ledup-base.css';
import '../ledup-signature.css';

export function LedupLayout({ children }: { children: ReactNode }) {
  const { theme } = useStorefront();
  applyMerchantThemeOverrides(theme?.theme ?? null);

  const vars = ledupCssVars();
  // Panels that render outside this wrapper (cookie banner, sign-in pop-up, password page) read the same colours from the page root.
  useEffect(() => {
    const root = document.documentElement;
    const keys = Object.keys(vars);
    for (const k of keys) root.style.setProperty(k, String((vars as Record<string, unknown>)[k]));
    return () => { for (const k of keys) root.style.removeProperty(k); };
  });

  return (
    <LedupCartProvider>
      <div
        className="ld-root lb-root flex min-h-screen flex-col"
        style={{
          ...ledupCssVars(),
          ...txCssVars(),
          background: t.colors.bg,
          color: t.colors.ink,
          fontFamily: t.fonts.body,
        }}
      >
        <style>{baseTypographyCss('main')}</style>
        <LedupPreloader />
        <LedupNavbar />
        <main className="flex-1 w-full">{children}</main>
        <LedupFooter />
      </div>
      <LedupToaster />
    </LedupCartProvider>
  );
}
