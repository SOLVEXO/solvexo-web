import { img, type ThemeModule } from './types';

export const luxuryNoir: ThemeModule = {
  definition: {
    id: 'luxury-noir',
    name: 'Luxury Noir',
    description: 'Fine jewelry & premium goods — a deep dark palette with cinematic imagery.',
    category: 'luxury',
    characteristics: ['Dark Palette', 'Cinematic Hero', 'Serif Type'],
    colors: {
      primaryColor: '#C9A461', accentColor: '#8B7333', bgColor: '#0E0D0C', textColor: '#F3F1EA', font: 'Playfair Display',
      buttonStyle: 'outline', buttonRadius: 'none', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'none',
      typeScale: 'spacious', containerWidth: 'wide', sectionSpacing: 'spacious',
      productCardStyle: 'flat', productCardRadius: 'none',
      testimonialCardStyle: 'flat', testimonialCardRadius: 'none',
      heroStyle: 'overlay', heroAlignment: 'center',
      productImageRatio: 'portrait', productImageHover: 'zoom', productGridDensity: 'relaxed',
      testimonialStyle: 'minimal', faqStyle: 'list',
    },
    headerStyle: 'centered', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'AURELIA',
    heroHeadline: 'Timeless, by design.',
    heroSubheading: 'Fine jewelry crafted for a lifetime.',
    heroCta: 'Discover the Collection',
    heroImage: img(210, 1600, 900),
    products: [
      { name: '18k Gold Hoop Earrings', price: 420, image: img(220) },
      { name: 'Diamond Pendant Necklace', price: 980, image: img(230) },
      { name: 'Sterling Cuff Bracelet', price: 310, image: img(240) },
    ],
    testimonial: { quote: 'Exquisite craftsmanship — it photographs even better in person.', authorName: 'Camille D.', authorRole: 'Verified Buyer', rating: 5 },
  },
};
