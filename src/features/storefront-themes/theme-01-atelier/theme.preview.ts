import { registerThemePreviewComponents } from '../themePreviewComponents';
import { AtelierSectionRenderer, getRegisteredAtelierSectionTypes } from './sections';
import { AtelierNavbar } from './components/AtelierNavbar';
import { AtelierFooter } from './components/AtelierFooter';
import { atelierTheme, applyMerchantThemeOverrides } from './theme.config';
import type { SectionType } from '@/api/services/storefrontTypes';

/**
 * Atelier's real preview-components registration — see `themePreviewComponents.ts`
 * for why this file exists (the live-preview panel shared by Customize and
 * Header & Footer used to import these three components + `theme.config`
 * directly by name, which is exactly the kind of per-theme hardcoding the
 * platform's reusability requirement rules out).
 */
registerThemePreviewComponents({
  id: 'theme-01-atelier',
  SectionRenderer: AtelierSectionRenderer,
  Navbar: AtelierNavbar,
  Footer: AtelierFooter,
  theme: atelierTheme,
  applyMerchantThemeOverrides,
  supportedSectionTypes: getRegisteredAtelierSectionTypes() as SectionType[],
});
