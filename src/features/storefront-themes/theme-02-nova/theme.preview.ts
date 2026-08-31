import { registerThemePreviewComponents } from '../themePreviewComponents';
import { NovaSectionRenderer, getRegisteredNovaSectionTypes } from './sections';
import { NovaNavbar } from './components/NovaNavbar';
import { NovaFooter } from './components/NovaFooter';
import { novaTheme, applyMerchantThemeOverrides } from './theme.config';
import type { SectionType } from '@/api/services/storefrontTypes';

/**
 * Nova's real preview-components registration — same contract Atelier's own
 * `theme.preview.ts` implements (see that file and `themePreviewComponents.ts`
 * for the full rationale). Registering this is what makes the live-preview
 * panel inside Customize/Header & Footer genuinely show NOVA's real chrome
 * and sections the moment Nova is the active theme, instead of silently
 * continuing to render Atelier underneath a Nova-labeled editor.
 */
registerThemePreviewComponents({
  id: 'theme-02-nova',
  SectionRenderer: NovaSectionRenderer,
  Navbar: NovaNavbar,
  Footer: NovaFooter,
  theme: novaTheme,
  applyMerchantThemeOverrides,
  supportedSectionTypes: getRegisteredNovaSectionTypes() as SectionType[],
});
