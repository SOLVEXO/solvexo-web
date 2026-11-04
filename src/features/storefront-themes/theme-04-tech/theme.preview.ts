import { registerThemePreviewComponents } from '../themePreviewComponents';
import { TechSectionRenderer, getRegisteredTechSectionTypes } from './sections';
import { TechNavbar } from './components/TechNavbar';
import { TechFooter } from './components/TechFooter';
import { techTheme, applyMerchantThemeOverrides } from './theme.config';
import type { SectionType } from '@/api/services/storefrontTypes';
import './tech.css';

/** What the Customize / Header & Footer live preview renders for stores on this theme. */
registerThemePreviewComponents({
  id: 'theme-04-tech',
  SectionRenderer: TechSectionRenderer,
  Navbar: TechNavbar,
  Footer: TechFooter,
  theme: techTheme,
  applyMerchantThemeOverrides,
  supportedSectionTypes: getRegisteredTechSectionTypes() as SectionType[],
});
