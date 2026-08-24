import { img, type ThemeModule } from './types';

export const streetUrban: ThemeModule = {
  definition: {
    id: 'street-urban',
    name: 'Street / Urban',
    description: 'Sneakers & streetwear — bold contrast type and an energetic, edge-to-edge grid.',
    category: 'fashion',
    badge: 'new',
    characteristics: ['Bold Type', 'High Contrast', 'Energetic Grid'],
    colors: {
      primaryColor: '#E8382A', accentColor: '#1A1A1A', bgColor: '#F5F4F0', textColor: '#111111', font: 'Space Grotesk',
      buttonStyle: 'solid', buttonRadius: 'none', buttonWidth: 'full', buttonSize: 'lg',
      imageRadius: 'none',
      typeScale: 'spacious', containerWidth: 'wide', sectionSpacing: 'compact',
      productCardStyle: 'flat', productCardRadius: 'none',
      testimonialCardStyle: 'flat', testimonialCardRadius: 'none',
      heroStyle: 'overlay', heroAlignment: 'left',
      productImageRatio: 'square', productImageHover: 'zoom', productGridDensity: 'cozy',
      testimonialStyle: 'minimal', faqStyle: 'list',
    },
    headerStyle: 'standard', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'CONCRETE CO.',
    heroHeadline: 'Built for the street.',
    heroSubheading: 'New drop, limited run.',
    heroCta: 'Shop the Drop',
    heroImage: img(290, 1600, 900),
    products: [
      { name: 'Retro Runner Sneakers', price: 139, image: img(300), badge: 'NEW' },
      { name: 'Oversized Graphic Hoodie', price: 78, image: img(310) },
      { name: 'Cargo Utility Pants', price: 92, image: img(320) },
    ],
    testimonial: { quote: 'Drops sell out fast — glad I caught this one.', authorName: 'Malik J.', authorRole: 'Verified Buyer', rating: 5 },
  },
};
