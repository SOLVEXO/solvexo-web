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
  {
    _id: 'd-bento', type: 'theme_section',
    settings: { sectionKey: 'ledup.bento', eyebrow: 'Highlights', heading: 'The right information at the right time.' },
    blocks: [
      { _id: 'b1', type: 'theme_block', settings: { blockKey: 'ledup.bento.tile', title: 'Datasheets', size: 'wide', tone: 'light', link: { type: 'none' } } },
      { _id: 'b2', type: 'theme_block', settings: { blockKey: 'ledup.bento.tile', title: '102', caption: 'Stores nationwide', size: 'small', tone: 'stat' } },
      { _id: 'b3', type: 'theme_block', settings: { blockKey: 'ledup.bento.tile', title: 'Catalogue 2025', size: 'normal', tone: 'light' } },
    ],
  },
  {
    _id: 'd-sim', type: 'theme_section',
    settings: { sectionKey: 'ledup.simulation', label: 'Switches' },
    blocks: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'].map((title, i) => ({ _id: 'z' + i, type: 'theme_block', settings: { blockKey: 'ledup.simulation.zone', title } })),
  },
  { _id: 'd-statement', type: 'theme_section', settings: { sectionKey: 'ledup.statement', heading: 'A commitment to excellence' }, blocks: [] },
] as unknown as Section[];
