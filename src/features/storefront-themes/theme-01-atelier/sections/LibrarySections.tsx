import type { Section, Block } from '@/api/services/storefrontTypes';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { AtelierButton } from '../components/AtelierButton';
import { registerAtelierSection } from './atelierSectionRenderer';
import { MulticolumnSection, LogoListSection, MarqueeSection, CustomHtmlSection, ImageBannerSection, type SharedThemeTokens } from '../../sharedSections';

// Shopify-parity section library (multicolumn, logo list, marquee, custom HTML,
// image banner) — one shared implementation, styled by this theme's tokens.
// `t` is the live theme singleton, so a merchant's saved customization applies.
const tokens = (): SharedThemeTokens => ({ fonts: t.fonts, layout: t.layout, imageRadiusPx: t.imageRadiusPx, Button: AtelierButton as SharedThemeTokens['Button'] });

const lib = (Comp: typeof MulticolumnSection) => (section: Section, blocks: Block[], colors: AtelierSectionColors) => (
  <Comp section={section} blocks={blocks} colors={colors} theme={tokens()} />
);

registerAtelierSection('multicolumn', lib(MulticolumnSection));
registerAtelierSection('logo_list', lib(LogoListSection));
registerAtelierSection('marquee', lib(MarqueeSection));
registerAtelierSection('custom_html', lib(CustomHtmlSection));
registerAtelierSection('image_banner', lib(ImageBannerSection));
