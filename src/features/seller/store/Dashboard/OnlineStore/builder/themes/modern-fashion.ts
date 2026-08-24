import { img, type ThemeModule } from './types';

export const modernFashion: ThemeModule = {
  definition: {
    id: 'modern-fashion',
    name: 'Modern Fashion',
    description: 'Premium fashion — dramatic split hero, editorial type, and a full-width CTA.',
    category: 'fashion',
    characteristics: ['Split Hero', 'Editorial Type', 'Full-Width CTA'],
    colors: {
      primaryColor: '#1F1B2E', accentColor: '#C9A15A', bgColor: '#FFFFFF', textColor: '#1A1720', font: 'Montserrat',
      buttonStyle: 'solid', buttonRadius: 'small', buttonWidth: 'full', buttonSize: 'lg',
      imageRadius: 'small',
      typeScale: 'comfortable', containerWidth: 'wide', sectionSpacing: 'comfortable',
      productCardStyle: 'elevated', productCardRadius: 'small',
      testimonialCardStyle: 'flat', testimonialCardRadius: 'none',
      heroStyle: 'split', heroAlignment: 'left',
      productImageRatio: 'portrait', productImageHover: 'zoom', productGridDensity: 'relaxed',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'centered', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'NOIR MAISON',
    heroHeadline: 'The Fall/Winter Edit.',
    heroSubheading: 'Tailored silhouettes for a modern wardrobe.',
    heroCta: 'Shop Now',
    heroImage: img(50, 1600, 900),
    products: [
      { name: 'Tailored Wool Coat', price: 340, image: img(60) },
      { name: 'Silk Slip Dress', price: 210, image: img(70) },
      { name: 'Structured Leather Bag', price: 265, image: img(80) },
    ],
    testimonial: { quote: 'The quality and fit are unmatched. Worth every dollar.', authorName: 'Amara K.', authorRole: 'Verified Buyer', rating: 5 },
  },
};
