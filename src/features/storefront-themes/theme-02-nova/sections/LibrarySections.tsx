import type { Section, Block } from '@/api/services/storefrontTypes';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { NovaButton } from '../components/NovaButton';
import { NovaProductCard } from '../components/NovaProductCard';
import { registerNovaSection } from './novaSectionRenderer';
import { MulticolumnSection, LogoListSection, MarqueeSection, CustomHtmlSection, ImageBannerSection, CollectionListSection, GalleryGridSection, StoreLocationsSection, ContactFormSection, RelatedProductsSection, type SharedThemeTokens } from '../../sharedSections';

// Shopify-parity section library (multicolumn, logo list, marquee, custom HTML,
// image banner) — one shared implementation, styled by this theme's tokens.
// `t` is the live theme singleton, so a merchant's saved customization applies.
const tokens = (): SharedThemeTokens => ({ fonts: t.fonts, layout: t.layout, imageRadiusPx: t.imageRadiusPx, Button: NovaButton as SharedThemeTokens['Button'], ProductCard: NovaProductCard as SharedThemeTokens['ProductCard'] });

const lib = (Comp: typeof MulticolumnSection) => (section: Section, blocks: Block[], colors: NovaSectionColors) => (
  <Comp section={section} blocks={blocks} colors={colors} theme={tokens()} />
);

registerNovaSection('multicolumn', lib(MulticolumnSection));
registerNovaSection('logo_list', lib(LogoListSection));
registerNovaSection('marquee', lib(MarqueeSection));
registerNovaSection('custom_html', lib(CustomHtmlSection));
registerNovaSection('image_banner', lib(ImageBannerSection));
registerNovaSection('collection_list', lib(CollectionListSection));
registerNovaSection('gallery_grid', lib(GalleryGridSection));
registerNovaSection('store_locations', lib(StoreLocationsSection));
registerNovaSection('contact_form', lib(ContactFormSection));
registerNovaSection('related_products', lib(RelatedProductsSection));
