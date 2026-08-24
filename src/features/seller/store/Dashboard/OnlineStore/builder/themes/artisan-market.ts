import { img, type ThemeModule } from './types';

export const artisanMarket: ThemeModule = {
  definition: {
    id: 'artisan-market',
    name: 'Artisan Market',
    description: 'Craft & maker marketplace — rustic rust and forest tones, a split hero, and portrait product photography.',
    category: 'general',
    characteristics: ['Rustic Palette', 'Split Hero', 'Portrait Cards'],
    colors: {
      primaryColor: '#B5451B', accentColor: '#3D5A45', bgColor: '#FFF9F0', textColor: '#2A1F16', font: 'Lora',
      buttonStyle: 'outline', buttonRadius: 'medium', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'small',
      typeScale: 'spacious', containerWidth: 'standard', sectionSpacing: 'comfortable',
      productCardStyle: 'outlined', productCardRadius: 'medium',
      testimonialCardStyle: 'elevated', testimonialCardRadius: 'small',
      heroStyle: 'split', heroAlignment: 'left',
      productImageRatio: 'portrait', productImageHover: 'none', productGridDensity: 'cozy',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'The Maker’s Market',
    heroHeadline: 'Made by hand, sold with pride.',
    heroSubheading: 'A curated marketplace of independent makers.',
    heroCta: 'Meet the Makers',
    heroImage: img(450, 1600, 900),
    products: [
      { name: 'Hand-Carved Wooden Bowl', price: 42, image: img(460) },
      { name: 'Small-Batch Candle Set', price: 26, image: img(470) },
      { name: 'Woven Wall Hanging', price: 64, image: img(480) },
    ],
    testimonial: { quote: 'You can feel the craftsmanship in every purchase.', authorName: 'Owen R.', authorRole: 'Verified Buyer', rating: 5 },
  },
};
