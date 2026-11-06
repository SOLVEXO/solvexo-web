import type { Section } from '@/api/services/storefrontTypes';

/** Sample content for the Theme Library preview only (before a seller installs the theme). No photos: nothing here is a real store or product. */
export const TECH_DEMO_STORE = {
  name: 'Tech Store',
  tagline: 'Computers, parts and accessories',
  description: 'A clean, product-first storefront for electronics and computer shops.',
};

const themeBlock = (_id: string, blockKey: string, settings: Record<string, unknown>) => ({ _id, type: 'theme_block', settings: { blockKey, ...settings } });

export const TECH_DEMO_SECTIONS: Section[] = [
  {
    _id: 'd-hero', type: 'theme_section', settings: { sectionKey: 'tech.hero', heading: 'Featured offers', height: 'standard', autoplay: false }, blocks: [
      themeBlock('h1', 'tech.hero.slide', { eyebrow: 'New arrival', heading: 'Power for work and play', text: 'Add your own headline, text and product photo here.', buttonLabel: 'Shop now', link: { linkType: 'search' } }),
      themeBlock('h2', 'tech.hero.slide', { eyebrow: 'Best seller', heading: 'Upgrade your setup', text: 'Slides can change on their own or with the arrows.', buttonLabel: 'See more', link: { linkType: 'search' } }),
      themeBlock('h3', 'tech.hero.slide', { eyebrow: 'On sale', heading: 'Deals you will not miss', buttonLabel: 'View deals', link: { linkType: 'search' } }),
    ],
  },
  {
    _id: 'd-cats', type: 'theme_section', settings: { sectionKey: 'tech.category_tiles', heading: 'Shop by category' }, blocks: ['Laptops', 'Desktops', 'Monitors', 'Accessories', 'Networking', 'PC parts'].map((title, i) => themeBlock(`c${i}`, 'tech.category_tiles.tile', { title })),
  },
  { _id: 'demo-products', type: 'featured_products', settings: { heading: 'New products' }, blocks: [] },
  {
    _id: 'd-bento', type: 'theme_section', settings: { sectionKey: 'tech.bento_grid', heading: 'Explore the range' }, blocks: [
      themeBlock('b1', 'tech.bento_grid.tile', { title: 'Gaming', text: 'Built for speed', size: 'large' }),
      themeBlock('b2', 'tech.bento_grid.tile', { title: 'Work', text: 'Reliable all day' }),
      themeBlock('b3', 'tech.bento_grid.tile', { title: 'Creators', text: 'Colour-true screens' }),
      themeBlock('b4', 'tech.bento_grid.tile', { title: 'Home office', text: 'Everything for your desk', size: 'wide' }),
    ],
  },
  {
    _id: 'd-deal', type: 'theme_section', settings: { sectionKey: 'tech.deal_banner', heading: 'This week only', text: 'A short line about your best offer goes here.', buttonLabel: 'Shop now', buttonLink: { linkType: 'search' } }, blocks: [],
  },
  {
    _id: 'd-specs', type: 'theme_section', settings: { sectionKey: 'tech.spec_highlights', heading: 'Built for performance', intro: 'Highlight the numbers that matter to your buyers.' }, blocks: [
      { _id: 's1', type: 'theme_block', settings: { blockKey: 'tech.spec_highlights.spec', value: '16GB', title: 'Memory', text: 'Fast DDR4' } },
      { _id: 's2', type: 'theme_block', settings: { blockKey: 'tech.spec_highlights.spec', value: '1TB', title: 'Storage', text: 'NVMe SSD' } },
      { _id: 's3', type: 'theme_block', settings: { blockKey: 'tech.spec_highlights.spec', value: '3 yrs', title: 'Warranty', text: 'On-site cover' } },
      { _id: 's4', type: 'theme_block', settings: { blockKey: 'tech.spec_highlights.spec', value: '24/7', title: 'Support', text: 'Always on' } },
    ],
  },
  {
    _id: 'd-features', type: 'theme_section', settings: { sectionKey: 'tech.feature_strip' }, blocks: [
      { _id: 'f1', type: 'theme_block', settings: { blockKey: 'tech.feature_strip.item', title: 'Product support', text: 'Warranty and help when you need it.' } },
      { _id: 'f2', type: 'theme_block', settings: { blockKey: 'tech.feature_strip.item', title: 'Personal account', text: 'Track orders and save your details.' } },
      { _id: 'f3', type: 'theme_block', settings: { blockKey: 'tech.feature_strip.item', title: 'Amazing savings', text: 'Great prices on new products.' } },
    ],
  },
];
