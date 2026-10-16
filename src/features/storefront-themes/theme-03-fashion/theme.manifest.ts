import { registerThemeManifest, type ThemeManifest } from '../themeManifest';

const RADIUS = [{ value: 'none', label: 'Square' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'full', label: 'Pill' }];
const SHOW_HIDE = [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }];
const fonts = (list: string[]) => list.map(f => ({ value: f, label: f }));

/** Maison (fashion): the scopes the seller can edit in Customize and the theme settings this theme actually reads. */
export const fashionThemeManifest: ThemeManifest = {
  id: 'theme-03-fashion',
  name: 'Maison',
  supportsAnnouncementBar: true,

  templates: [
    { id: 'home', label: 'Home', group: 'home', showChrome: true, resource: { kind: 'store-page', pageType: 'home' } },
    { id: 'product', label: 'Product', group: 'products', showChrome: true, resource: { kind: 'collection-template', resourceType: 'product', templateKey: 'default', allowAltTemplates: true } },
    { id: 'collection', label: 'Collection', group: 'collections', showChrome: true, resource: { kind: 'collection-template', resourceType: 'collection', templateKey: 'default', allowAltTemplates: true } },
    { id: 'pages', label: 'Pages', group: 'pages', showChrome: true, resource: { kind: 'store-page', pageType: 'custom' } },
    { id: 'search', label: 'Search', group: 'search', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'search', allowAltTemplates: false } },
    { id: 'cart', label: 'Cart', group: 'cart', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'cart', allowAltTemplates: false } },
    { id: 'blogIndex', label: 'Blog index', group: 'blogs', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'blog-index', allowAltTemplates: false, previewPicker: 'blog' } },
    { id: 'blogArticle', label: 'Blog article', group: 'articles', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'blog-article', allowAltTemplates: false, previewPicker: 'article' } },
    { id: 'account', label: 'Customer account', group: 'other', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'account', allowAltTemplates: false } },
    { id: 'notFound', label: '404 page', group: 'other', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'not-found', allowAltTemplates: false } },
    { id: 'password', label: 'Password page', group: 'other', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'password', allowAltTemplates: false } },
  ],

  themeSettingsFields: [
    { key: 'bgColor', label: 'Background', group: 'Colors', control: { kind: 'color' } },
    { key: 'textColor', label: 'Text', group: 'Colors', control: { kind: 'color' } },
    { key: 'primaryColor', label: 'Buttons & accent', group: 'Colors', control: { kind: 'color' } },

    { key: 'font', label: 'Body & UI font', group: 'Typography', control: { kind: 'select', options: fonts(['Inter', 'Poppins', 'Roboto', 'Montserrat', 'DM Sans', 'Nunito', 'Space Grotesk', 'Playfair Display', 'Fraunces']) }, helpText: 'Sets body and interface text. Use Heading font for headlines.' },
    { key: 'headingFont', label: 'Heading font', group: 'Typography', control: { kind: 'select', options: fonts(['Inter', 'Poppins', 'Roboto', 'Montserrat', 'DM Sans', 'Space Grotesk', 'Playfair Display', 'Fraunces', 'Lora']) } },

    { key: 'buttonStyle', label: 'Style', group: 'Buttons', control: { kind: 'select', options: [{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'soft', label: 'Soft (accent tint)' }] } },
    { key: 'buttonRadius', label: 'Corner radius', group: 'Buttons', control: { kind: 'select', options: RADIUS.map(o => (o.value === 'full' ? { ...o, label: 'Pill (default)' } : o)) } },
    { key: 'buttonWidth', label: 'Width', group: 'Buttons', control: { kind: 'select', options: [{ value: 'auto', label: 'Fits content' }, { value: 'full', label: 'Full width' }] } },

    { key: 'sectionSpacing', label: 'Section spacing', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }] } },
    { key: 'containerWidth', label: 'Container width', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'narrow', label: 'Narrow' }, { value: 'standard', label: 'Standard' }, { value: 'wide', label: 'Wide' }] } },

    { key: 'imageRadius', label: 'Image corners', group: 'Images', control: { kind: 'select', options: RADIUS } },
    { key: 'productCardRadius', label: 'Product card corners', group: 'Images', control: { kind: 'select', options: RADIUS } },
    { key: 'productImageRatio', label: 'Product image ratio', group: 'Images', control: { kind: 'select', options: [{ value: 'adapt', label: 'Adapt to image' }, { value: 'square', label: 'Square' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }] } },
    { key: 'productImageHover', label: 'Product image hover', group: 'Images', control: { kind: 'select', options: [{ value: 'none', label: 'None' }, { value: 'zoom', label: 'Zoom' }, { value: 'second-image', label: 'Show second image' }] } },

    { key: 'saleBadge', label: 'Sale badge', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE } },
    { key: 'quickView', label: 'Quick view button', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Lets shoppers pick options and add to cart from a pop-up on the product grid.' },
    { key: 'colorSwatches', label: 'Colour swatches', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Shows the available colours on product cards; hovering one previews its photo.' },
    { key: 'soldOutBadge', label: 'Sold out badge', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE } },
    { key: 'cardStyle', label: 'Card style', group: 'Product cards', control: { kind: 'select', options: [{ value: 'theme', label: 'Theme default' }, { value: 'flat', label: 'Flat' }, { value: 'outlined', label: 'Border' }, { value: 'elevated', label: 'Shadow' }] } },

    { key: 'cartType', label: 'Cart type', group: 'Cart', control: { kind: 'select', options: [{ value: 'drawer', label: 'Drawer (slides in)' }, { value: 'page', label: 'Cart page' }] }, helpText: 'What happens after a shopper adds a product.' },
  ],
};

registerThemeManifest(fashionThemeManifest);
