import type { ReactNode } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { baseTypographyCss } from '../theme.base';
import { LedupNavbar } from '../components/LedupNavbar';
import { LedupFooter } from '../components/LedupFooter';
import { LedupCartProvider } from '../components/LedupCart';
import { LedupToaster } from '../components/LedupToaster';
import { ledupTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import { ledupCssVars } from '../ui/ledupStyle';
import '../ledup.css';
import { ledupCssVars as txCssVars } from '../ui/ledupStylePort';
import '../ledup-tx.css';

export function LedupLayout({ children }: { children: ReactNode }) {
  const { theme } = useStorefront();
  applyMerchantThemeOverrides(theme?.theme ?? null);

  return (
    <LedupCartProvider>
      <div
        className="ld-root tx-root flex min-h-screen flex-col"
        style={{
          ...ledupCssVars(),
          ...txCssVars(),
          background: t.colors.bg,
          color: t.colors.ink,
          fontFamily: t.fonts.body,
        }}
      >
        <style>{baseTypographyCss('main')}</style>
        <LedupNavbar />
        <main className="flex-1 w-full">{children}</main>
        <LedupFooter />
      </div>
      <LedupToaster />
    </LedupCartProvider>
  );
}
