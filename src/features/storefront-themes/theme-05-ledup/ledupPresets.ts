import type { ThemeCustomSectionPreset } from '../themeManifest';

/** One-click starting points for the ledup.pt style sections (shown as cards in Add section). Copy is neutral on purpose: the seller replaces it. */
export const LEDUP_PRESETS: Record<string, ThemeCustomSectionPreset[]> = {
  'ledup.bento': [{
    id: 'highlights',
    name: 'Highlights grid',
    description: 'Photo tiles with round arrows, white product cards and one copper number tile, like the ledup.pt home page.',
    settings: { eyebrow: 'Highlights', heading: 'The right information at the right time.', text: 'Quick access to datasheets, catalogues and news. Clear, organised documentation for informed decisions.' },
    blocks: [
      { title: 'Datasheets', size: 'medium', tone: 'photo', height: 'medium' },
      { title: 'Featured product', size: 'normal', tone: 'light', height: 'tall' },
      { title: '100', caption: 'Stores nationwide', size: 'small', tone: 'stat', height: 'compact' },
      { title: 'Resellers', size: 'normal', tone: 'photo', height: 'short' },
      { title: 'Product one', size: 'normal', tone: 'light', height: 'standard' },
      { title: 'Catalogue', size: 'wide', tone: 'photo', height: 'standard' },
      { title: 'Product two', size: 'normal', tone: 'light', height: 'standard' },
    ],
  }],
  'ledup.projects': [{
    id: 'projects',
    name: 'Projects carousel',
    description: 'A white panel with a drag carousel of project photos and the rotating "drag" badge.',
    settings: { eyebrow: 'Projects', heading: 'Ideas that light the way.', text: 'Explore tailored solutions, designed to answer the needs of each space with precision.', dragText: 'Drag to see more amazing projects' },
    blocks: [{ title: '' }, { title: '' }, { title: '' }, { title: '' }],
  }],
  'ledup.stacked': [{
    id: 'values',
    name: 'Five values',
    description: 'A dark card with five stacked layers; click a layer to open its text and photos.',
    settings: {},
    blocks: [
      { title: 'INNOVATION', heading: 'For those who demand more from lighting', text: 'We turn light into innovative solutions that make a difference, anticipating needs with technology.' },
      { title: 'QUALITY', heading: 'For those who never give up excellence', text: 'Quality in every detail, from the first sketch to the finished product.' },
      { title: 'EFFICIENCY', heading: 'For those who value every resource', text: 'Performance and energy savings thought through for every project.' },
      { title: 'EXPERTISE', heading: 'For those who look for solutions in the right hands', text: 'A specialised team ready to advise you.' },
      { title: 'SUSTAINABILITY', heading: 'For those for whom sustainability is a principle', text: 'Responsible choices that last.' },
    ],
  }],
  'ledup.simulation': [{
    id: 'zones',
    name: 'Five light zones',
    description: 'A scene with five switches. Add the "lights off" photo and an "all lights on" photo; the glow follows the switches.',
    settings: { label: 'Switches' },
    blocks: [{ title: 'ZONE 1' }, { title: 'ZONE 2' }, { title: 'ZONE 3' }, { title: 'ZONE 4' }, { title: 'ZONE 5' }],
  }],
  'ledup.timeline': [{
    id: 'journey',
    name: 'Company timeline',
    description: 'A copper carousel: one year per slide with a large watermark.',
    settings: {},
    blocks: [
      { year: '2026', title: 'New website', text: 'A more intuitive, modern and functional online platform with easy access to our catalogue.' },
      { year: '2020', title: 'New range', text: 'We launched our latest range.' },
      { year: '2014', title: 'Our beginning', text: 'The company was founded with a clear goal: better light.' },
    ],
  }],
  'ledup.mission': [{
    id: 'mvv',
    name: 'Mission, vision, values',
    description: 'A tilted oval photo with three frosted cards.',
    settings: {},
    blocks: [
      { icon: 'sparkles', eyebrow: 'Mission', title: 'Light that answers the need.', text: 'To deliver reliable solutions that respond to what each project asks for.' },
      { icon: 'star', eyebrow: 'Vision', title: 'Develop solutions with criteria.', text: 'To keep growing as a brand professionals trust: more performance, more rigour, more return.' },
      { icon: 'shield', eyebrow: 'Values', title: 'Quality, innovation and commitment.', text: 'We believe in applied quality, technological evolution and human commitment.' },
    ],
  }],
  'ledup.collage': [{
    id: 'about-hero',
    name: 'About page opening',
    description: 'Six photos around a big headline that grows while you scroll.',
    settings: { heading: 'The future of lighting goes through us.' },
    blocks: [{}, {}, {}, {}, {}, {}],
  }],
  'ledup.districts': [{
    id: 'finder',
    name: 'Reseller finder',
    description: 'District slider, towns and shop cards. Replace the sample shop with your own.',
    settings: {},
    blocks: [{ district: 'District one', town: 'Town one', title: 'Your shop name', phone: '', email: '', address: '', website: '' }],
  }],
  'ledup.documents': [{
    id: 'catalogues',
    name: 'Catalogues and datasheets',
    description: 'A searchable table of datasheets with Download buttons. Add a cover photo to any item to turn it into a big card.',
    settings: { heading: 'Datasheets' },
    blocks: [{ title: 'Product datasheet', kind: 'REF-0001' }, { title: 'Another datasheet', kind: 'REF-0002' }],
  }],
  'ledup.statement': [{
    id: 'excellence',
    name: 'Commitment statement',
    description: 'Centred statement, outlined button and a wide photo.',
    settings: { eyebrow: 'About us', heading: 'A commitment to excellence', text: 'For over 10 years a reference in the market: technical strength, clear communication and solutions aligned with the demands of our partners and customers.', ctaText: 'Learn more' },
  }],
};
