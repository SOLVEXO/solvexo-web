import { img, type ThemeModule } from './types';

export const coastalBreeze: ThemeModule = {
  definition: {
    id: 'coastal-breeze',
    name: 'Coastal Breeze',
    description: 'Resort & beach lifestyle — airy teal and sand tones, a centered overlay hero, and soft pill buttons.',
    category: 'lifestyle',
    characteristics: ['Airy Palette', 'Centered Hero', 'Pill Buttons'],
    colors: {
      primaryColor: '#2A9D8F', accentColor: '#E76F51', bgColor: '#FBFEFD', textColor: '#173A36', font: 'DM Sans',
      buttonStyle: 'soft', buttonRadius: 'full', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'large',
      typeScale: 'comfortable', containerWidth: 'wide', sectionSpacing: 'spacious',
      productCardStyle: 'elevated', productCardRadius: 'medium',
      testimonialCardStyle: 'outlined', testimonialCardRadius: 'full',
      heroStyle: 'overlay', heroAlignment: 'center',
      productImageRatio: 'square', productImageHover: 'zoom', productGridDensity: 'relaxed',
      testimonialStyle: 'cards', faqStyle: 'list',
    },
    headerStyle: 'centered', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'Salt & Sand Co.',
    heroHeadline: 'Summer, all year round.',
    heroSubheading: 'Breezy essentials for the coast and beyond.',
    heroCta: 'Shop the Collection',
    heroImage: img(410, 1600, 900),
    products: [
      { name: 'Linen Beach Kaftan', price: 68, image: img(420) },
      { name: 'Woven Straw Tote', price: 45, image: img(430) },
      { name: 'Polarized Sunglasses', price: 52, image: img(440) },
    ],
    testimonial: { quote: 'Feels like a permanent vacation wardrobe.', authorName: 'Talia M.', authorRole: 'Verified Buyer', rating: 5 },
  },
};
