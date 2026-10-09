import type { Section, Block } from '@/api/services/storefrontTypes';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { NovaButton } from '../components/NovaButton';
import { registerNovaSection } from './novaSectionRenderer';
import { MulticolumnSection, LogoListSection, MarqueeSection, CustomHtmlSection, ImageBannerSection, type SharedThemeTokens } from '../../sharedSections';

// Shopify-parity section library (multicolumn, logo list, marquee, custom HTML,
// image banner) — one shared implementation, styled by this theme's tokens.
// `t` is the live theme singleton, so a merchant's saved customization applies.
const tokens = (): SharedThemeTokens => ({ fonts: t.fonts, layout: t.layout, imageRadiusPx: t.imageRadiusPx, Button: NovaButton as SharedThemeTokens['Button'] });

const lib = (Comp: typeof MulticolumnSection) => (section: Section, blocks: Block[], colors: NovaSectionColors) => (
  <Comp section={section} blocks={blocks} colors={colors} theme={tokens()} />
);

registerNovaSection('multicolumn', lib(MulticolumnSection));
registerNovaSection('logo_list', lib(LogoListSection));
registerNovaSection('marquee', lib(MarqueeSection));
registerNovaSection('custom_html', lib(CustomHtmlSection));
registerNovaSection('image_banner', lib(ImageBannerSection));
