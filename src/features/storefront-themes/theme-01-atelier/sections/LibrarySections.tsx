import type { Section, Block } from '@/api/services/storefrontTypes';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { AtelierButton } from '../components/AtelierButton';
import { AtelierProductCard } from '../components/AtelierProductCard';
import { registerAtelierSection } from './atelierSectionRenderer';
import { MulticolumnSection, LogoListSection, MarqueeSection, CustomHtmlSection, ImageBannerSection, CollectionListSection, GalleryGridSection, StoreLocationsSection, ContactFormSection, RelatedProductsSection, type SharedThemeTokens } from '../../sharedSections';
import { DividerSection, MultirowSection, CollageSection, FeaturedProductSection, CollectionBannerSection, RecentlyViewedSection } from '../../moreSections';

// Shopify-parity section library (multicolumn, logo list, marquee, custom HTML,
// image banner) — one shared implementation, styled by this theme's tokens.
// `t` is the live theme singleton, so a merchant's saved customization applies.
const tokens = (): SharedThemeTokens => ({ fonts: t.fonts, layout: t.layout, imageRadiusPx: t.imageRadiusPx, Button: AtelierButton as SharedThemeTokens['Button'], ProductCard: AtelierProductCard as SharedThemeTokens['ProductCard'] });

const lib = (Comp: typeof MulticolumnSection) => (section: Section, blocks: Block[], colors: AtelierSectionColors) => (
  <Comp section={section} blocks={blocks} colors={colors} theme={tokens()} />
);

registerAtelierSection('multicolumn', lib(MulticolumnSection));
registerAtelierSection('logo_list', lib(LogoListSection));
registerAtelierSection('marquee', lib(MarqueeSection));
registerAtelierSection('custom_html', lib(CustomHtmlSection));
registerAtelierSection('image_banner', lib(ImageBannerSection));
registerAtelierSection('collection_list', lib(CollectionListSection));
registerAtelierSection('gallery_grid', lib(GalleryGridSection));
registerAtelierSection('store_locations', lib(StoreLocationsSection));
registerAtelierSection('contact_form', lib(ContactFormSection));
registerAtelierSection('related_products', lib(RelatedProductsSection));
registerAtelierSection('divider', lib(DividerSection));
registerAtelierSection('multirow', lib(MultirowSection));
registerAtelierSection('collage', lib(CollageSection));
registerAtelierSection('featured_product', lib(FeaturedProductSection));
registerAtelierSection('collection_banner', lib(CollectionBannerSection));
registerAtelierSection('recently_viewed', lib(RecentlyViewedSection));
