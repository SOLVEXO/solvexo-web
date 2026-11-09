import type { Section } from '@/api/services/storefrontTypes';

/** Sample content for the Theme Library preview card only (never shown on a real store). */
export const LEDUP_DEMO_STORE = {
  name: 'Lumen Studio',
  tagline: 'Professional lighting for every project.',
  description: 'Architectural and commercial LED lighting.',
};

export const LEDUP_DEMO_SECTIONS: Section[] = [
  { _id: 'd-hero', type: 'theme_section', settings: { sectionKey: 'ledup.category_tabs' }, blocks: [] },
  { _id: 'demo-products', type: 'featured_products', settings: { heading: 'Featured products', subheading: 'Efficient, high-performance lighting.' }, blocks: [] },
  {
    _id: 'd-highlights',
    type: 'theme_section',
    settings: { sectionKey: 'ledup.highlights', eyebrow: 'Highlights', heading: 'The right information at the right time.' },
    blocks: [
      { _id: 'h1', type: 'theme_block', settings: { blockKey: 'ledup.highlights.item', title: 'Datasheets', description: 'Technical documents for every product.' } },
      { _id: 'h2', type: 'theme_block', settings: { blockKey: 'ledup.highlights.item', title: 'Catalogue', description: 'The full range in one place.' } },
      { _id: 'h3', type: 'theme_block', settings: { blockKey: 'ledup.highlights.item', title: 'Where to buy', description: 'Find a reseller near you.' } },
    ],
  },
  { _id: 'd-statement', type: 'theme_section', settings: { sectionKey: 'ledup.statement', heading: 'A commitment to excellence' }, blocks: [] },
] as unknown as Section[];
