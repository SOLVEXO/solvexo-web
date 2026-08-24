import { img, type ThemeModule } from './types';

// Baseline theme — intentionally matches every schema default exactly, so
// it's the safe equivalent a pre-existing store (or a fresh one that's
// never applied a theme) already renders as.
export const warmCraft: ThemeModule = {
  definition: {
    id: 'warm-craft',
    name: 'Warm Craft',
    description: 'Artisan & handmade — warm terracotta, a full-bleed hero, and soft rounded cards.',
    category: 'lifestyle',
    characteristics: ['Full-Bleed Hero', 'Warm Terracotta', 'Rounded Cards'],
    colors: {
      primaryColor: '#D97757', accentColor: '#B95A3A', bgColor: '#FAF9F5', textColor: '#2C2A28', font: 'Poppins',
      buttonStyle: 'solid', buttonRadius: 'medium', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'medium',
      typeScale: 'comfortable', containerWidth: 'standard', sectionSpacing: 'comfortable',
      productCardStyle: 'outlined', productCardRadius: 'medium',
      testimonialCardStyle: 'outlined', testimonialCardRadius: 'medium',
      heroStyle: 'overlay', heroAlignment: 'left',
      productImageRatio: 'square', productImageHover: 'none', productGridDensity: 'cozy',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'Willow & Clay',
    heroHeadline: 'Handcrafted, with intention.',
    heroSubheading: 'Small-batch ceramics and leather goods, made slowly.',
    heroCta: 'Shop the Collection',
    heroImage: img(10, 1600, 900),
    products: [
      { name: 'Luna Leather Tote', price: 129, image: img(20) },
      { name: 'Hand-Thrown Ceramic Mug', price: 34, image: img(30) },
      { name: 'Woven Market Basket', price: 58, image: img(40) },
    ],
    testimonial: { quote: 'Every piece feels like it was made just for me.', authorName: 'Priya N.', authorRole: 'Verified Buyer', rating: 5 },
  },
};
