import type { Section } from '@/api/services/storefrontTypes';

/** Sample content for the Theme Library preview only (before a seller installs the theme). Photos live in /public/theme-demo/maison. */
export const FASHION_DEMO_STORE = {
  name: 'Maison',
  tagline: 'Modern style, made to be worn',
  description: 'A clean, image-led storefront for fashion and apparel brands.',
};

const IMG = '/theme-demo/maison';

export const FASHION_DEMO_SECTIONS: Section[] = [
  {
    _id: 'd-hero', type: 'hero', settings: { heightPreset: 'large', autoplay: false, pagination: 'dots', showArrows: false }, blocks: [
      { _id: 'd-hero-1', type: 'hero_slide', settings: { imageUrl: `${IMG}/story.jpg`, focalPoint: 'center', heading: 'Modern style for every day', subheading: 'Considered pieces in honest fabrics, made to be worn on repeat.', ctaText: 'Shop the collection', ctaLink: { linkType: 'home' }, contentAlign: 'left', overlayOpacity: 25 } },
      { _id: 'd-hero-2', type: 'hero_slide', settings: { imageUrl: `${IMG}/style-guide.jpg`, focalPoint: 'center', heading: 'Soft layers for slow weekends', subheading: 'Knitwear and linen in a quiet, neutral palette.', ctaText: 'Explore the edit', ctaLink: { linkType: 'home' }, contentAlign: 'left', overlayOpacity: 25 } },
    ],
  },
  {
    _id: 'd-badges', type: 'trust_badges', settings: {}, blocks: [
      { _id: 'b1', type: 'trust_badge_item', settings: { icon: 'truck', text: 'Free shipping over $75' } },
      { _id: 'b2', type: 'trust_badge_item', settings: { icon: 'refresh', text: '30-day returns' } },
      { _id: 'b3', type: 'trust_badge_item', settings: { icon: 'shield', text: 'Secure checkout' } },
      { _id: 'b4', type: 'trust_badge_item', settings: { icon: 'headphones', text: 'Friendly support' } },
    ],
  },
  // Static stand-ins (no store data in the library preview) - see FashionDemoStore.tsx
  { _id: 'demo-categories', type: 'featured_category_grid', settings: { heading: 'Shop by category' }, blocks: [] },
  { _id: 'demo-products', type: 'featured_products', settings: { heading: 'New arrivals' }, blocks: [] },
  {
    _id: 'd-story', type: 'image_with_text', settings: { heading: '' }, blocks: [
      { _id: 'i1', type: 'image_text_pair', settings: { imageUrl: `${IMG}/cat-apparel.jpg`, heading: 'Made to last, designed to layer', body: 'We work with small mills and keep our runs short, so every piece is cut with care and sold at an honest price.', ctaText: 'Our story', ctaLink: { linkType: 'home' }, imagePosition: 'left' } },
    ],
  },
  { _id: 'd-marquee', type: 'marquee', settings: { speed: 'medium', direction: 'left', pauseOnHover: true }, blocks: ['Free shipping over $75', 'New season arrivals', '30-day returns', 'Made to last'].map((text, i) => ({ _id: 'm' + i, type: 'marquee_item', settings: { text } })) },
  {
    _id: 'd-quotes', type: 'testimonials', settings: { heading: 'Loved by our customers' }, blocks: [
      { _id: 't1', type: 'testimonial', settings: { quote: 'The fit and the fabric are exactly what I hoped for. I wear the trousers every week.', authorName: 'Amelia R.', rating: 5 } },
      { _id: 't2', type: 'testimonial', settings: { quote: 'Fast delivery and beautiful packaging. The bag looks even better in person.', authorName: 'Daniel K.', rating: 5 } },
      { _id: 't3', type: 'testimonial', settings: { quote: 'Easy returns and friendly support. Will definitely order again.', authorName: 'Sofia M.', rating: 5 } },
    ],
  },
  { _id: 'd-news', type: 'newsletter', settings: { heading: 'Stay in the loop', subtext: 'Be first to hear about new arrivals and offers.' }, blocks: [] },
];
