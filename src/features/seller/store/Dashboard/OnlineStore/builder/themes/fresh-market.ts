import { img, type ThemeModule } from './types';

export const freshMarket: ThemeModule = {
  definition: {
    id: 'fresh-market',
    name: 'Fresh Market',
    description: 'Food, organic & wellness — a natural palette with a friendly, rounded feel.',
    category: 'food',
    characteristics: ['Rounded & Friendly', 'Soft CTA', 'Category Feel'],
    colors: {
      primaryColor: '#4C7A3D', accentColor: '#D98E2D', bgColor: '#FBF8F0', textColor: '#2B2A22', font: 'Nunito',
      buttonStyle: 'solid', buttonRadius: 'full', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'large',
      typeScale: 'comfortable', containerWidth: 'standard', sectionSpacing: 'comfortable',
      productCardStyle: 'outlined', productCardRadius: 'large',
      testimonialCardStyle: 'outlined', testimonialCardRadius: 'large',
      heroStyle: 'overlay', heroAlignment: 'left',
      productImageRatio: 'square', productImageHover: 'none', productGridDensity: 'cozy',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'Bloom & Basket',
    heroHeadline: 'From farm to table.',
    heroSubheading: 'Organic, seasonal, delivered fresh.',
    heroCta: 'Shop Fresh',
    heroImage: img(250, 1600, 900),
    products: [
      { name: 'Organic Sourdough Loaf', price: 9, image: img(260) },
      { name: 'Cold-Pressed Juice Set', price: 28, image: img(270) },
      { name: 'Farm Honey Jar', price: 14, image: img(280) },
    ],
    testimonial: { quote: 'Everything tastes like it was picked this morning.', authorName: 'Noah B.', authorRole: 'Verified Buyer', rating: 5 },
  },
};
