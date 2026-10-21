import { describe, expect, it } from 'vitest';
import type { Section } from '@/api/services/storefrontTypes';
import { indexTextStrings, localizeSection, localizeStoreText, localizeThemeText } from './storeText';

const section = {
  _id: 's1', type: 'hero',
  settings: { heading: 'Big sale', imageUrl: 'https://x/y.png', cta: { label: 'Shop' } },
  blocks: [{ _id: 'b1', type: 'hero_slide', settings: { heading: 'Slide', links: [{ label: 'One' }, { label: 'Two' }] } }, { type: 'x', settings: { text: 'No id' } }],
} as unknown as Section;

describe('storeText overlay', () => {
  it('replaces only the translated text and leaves the source untouched', () => {
    const idx = indexTextStrings({ 's:s1#heading': 'Grosse Aktion', 'b:s1:b1#links.1.label': 'Zwei', 'b:s1:1#text': 'Ohne Id' });
    const out = localizeSection(section, idx);
    expect(out.settings.heading).toBe('Grosse Aktion');
    expect(out.settings.imageUrl).toBe('https://x/y.png');
    expect(out.blocks[0].settings.links).toEqual([{ label: 'One' }, { label: 'Zwei' }]);
    expect(out.blocks[1].settings.text).toBe('Ohne Id'); // a block with no id is addressed by its position
    expect(section.settings.heading).toBe('Big sale');
  });

  it('ignores a path that no longer exists and empty values', () => {
    const idx = indexTextStrings({ 's:s1#gone': 'x', 's:s1#heading': '' });
    expect(localizeSection(section, idx)).toEqual(section);
  });

  it('is a no-op without translations', () => {
    expect(localizeSection(section, indexTextStrings({}))).toBe(section);
  });

  it('translates the store details and the announcement bar', () => {
    const idx = indexTextStrings({ 'store#name': 'Mein Laden', 'announcement#message': 'Gratis Versand', 'announcement#moreMessages.0.message': 'Zweite' });
    const store = localizeStoreText({ name: 'My shop', tagline: 'T', announcementBar: { message: 'Free shipping', moreMessages: [{ message: 'Second' }] } }, idx);
    expect(store.name).toBe('Mein Laden');
    expect(store.tagline).toBe('T');
    expect(store.announcementBar.message).toBe('Gratis Versand');
    expect(store.announcementBar.moreMessages[0].message).toBe('Zweite');
  });

  it('translates header fields, nav links and footer columns', () => {
    const idx = indexTextStrings({ 'header#ctaLabel': 'Jetzt', 'hb:n1#children.0.label': 'Hüte', 'fb:f1#heading': 'Hilfe', 'footer#newsletterHeading': 'Bleib dran' });
    const theme = localizeThemeText({
      header: { ctaLabel: 'Now', blocks: [{ _id: 'n1', type: 'nav_link', settings: { label: 'Shop', children: [{ label: 'Hats' }] } }] },
      footer: { newsletterHeading: 'Stay', blocks: [{ _id: 'f1', type: 'footer_column', settings: { heading: 'Help' } }] },
    }, idx)!;
    expect(theme.header.ctaLabel).toBe('Jetzt');
    expect(theme.header.blocks[0].settings.children[0].label).toBe('Hüte');
    expect(theme.header.blocks[0].settings.label).toBe('Shop');
    expect(theme.footer.blocks[0].settings.heading).toBe('Hilfe');
    expect(theme.footer.newsletterHeading).toBe('Bleib dran');
  });
});
