import { registerThemePreviewComponents } from '../themePreviewComponents';
import { LedupSectionRenderer, getRegisteredLedupSectionTypes } from './sections';
import { LedupNavbar } from './components/LedupNavbar';
import { LedupFooter } from './components/LedupFooter';
import { ledupTheme, applyMerchantThemeOverrides } from './theme.config';
import type { SectionType } from '@/api/services/storefrontTypes';
import './ledup.css';

/** What the Customize / Header & Footer live preview renders for stores on this theme. */
registerThemePreviewComponents({
  id: 'theme-05-ledup',
  SectionRenderer: LedupSectionRenderer,
  Navbar: LedupNavbar,
  Footer: LedupFooter,
  theme: ledupTheme,
  applyMerchantThemeOverrides,
  supportedSectionTypes: getRegisteredLedupSectionTypes() as SectionType[],
});
