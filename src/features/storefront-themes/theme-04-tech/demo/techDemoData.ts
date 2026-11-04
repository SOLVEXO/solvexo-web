import type { Section } from '@/api/services/storefrontTypes';

/** Sample content for the Theme Library preview only (before a seller installs the theme). No photos: nothing here is a real store or product. */
export const TECH_DEMO_STORE = {
  name: 'Tech Store',
  tagline: 'Computers, parts and accessories',
  description: 'A clean, product-first storefront for electronics and computer shops.',
};

export const TECH_DEMO_SECTIONS: Section[] = [
  { _id: 'demo-products', type: 'featured_products', settings: { heading: 'New products' }, blocks: [] },
  {
    _id: 'd-deal', type: 'theme_section', settings: { sectionKey: 'tech.deal_banner', heading: 'This week only', text: 'A short line about your best offer goes here.', buttonLabel: 'Shop now' }, blocks: [],
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
