import { registerThemePreviewComponents } from '../themePreviewComponents';
import { FashionSectionRenderer, getRegisteredFashionSectionTypes } from './sections';
import { FashionNavbar } from './components/FashionNavbar';
import { FashionFooter } from './components/FashionFooter';
import { fashionTheme, applyMerchantThemeOverrides } from './theme.config';
import type { SectionType } from '@/api/services/storefrontTypes';
import './fashion.css';

/** What the Customize / Header & Footer live preview renders for stores on this theme. */
registerThemePreviewComponents({
  id: 'theme-03-fashion',
  SectionRenderer: FashionSectionRenderer,
  Navbar: FashionNavbar,
  Footer: FashionFooter,
  theme: fashionTheme,
  applyMerchantThemeOverrides,
  supportedSectionTypes: getRegisteredFashionSectionTypes() as SectionType[],
});
