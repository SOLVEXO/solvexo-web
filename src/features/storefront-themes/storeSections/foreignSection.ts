import type { Block, Section } from '@/api/services/storefrontTypes';

/**
 * A section another theme declared (`maison.lookbook`, `tech.bento_grid`, `ledup.projects`...) has no code in this theme.
 * Instead of dropping it, its content (heading, texts, photos, links) is re-expressed as a platform section this theme
 * already draws in its own style (gallery, feature list, image with text, rich text). The stored data is never changed.
 */
type Rec = Record<string, any>;

const NAMESPACES = ['maison.', 'tech.', 'ledup.'];

/** True for a `theme_section` key that belongs to a theme other than `ownNamespace` (and is not a seller-built `my.*`). */
export const isForeignThemeKey = (key: unknown, ownNamespace: string): boolean =>
  typeof key === 'string' && !key.startsWith(ownNamespace) && NAMESPACES.some(ns => key.startsWith(ns));

const str = (o: Rec | undefined, keys: string[]): string => {
  for (const k of keys) { const v = o?.[k]; if (typeof v === 'string' && v.trim()) return v.trim(); }
  return '';
};
const linkOf = (o: Rec | undefined, keys: string[]) => { for (const k of keys) { const v = o?.[k]; if (v && typeof v === 'object') return v; } return undefined; };

const HEADING = ['heading', 'title', 'eyebrow', 'name'];
const TEXT = ['text', 'intro', 'body', 'description', 'subheading', 'subtitle', 'content'];
const IMAGE = ['imageUrl', 'image', 'photo', 'backgroundImage', 'coverImage'];
const CTA_LABEL = ['ctaText', 'ctaLabel', 'buttonLabel', 'buttonText'];
const CTA_LINK = ['ctaLink', 'buttonLink', 'link'];

export function convertForeignSection(section: Section, blocks: Block[]): { section: Section; blocks: Block[] } | null {
  const s: Rec = section.settings ?? {};
  const heading = str(s, HEADING);
  const intro = str(s, TEXT);
  const items = blocks.filter(b => b.type === 'theme_block').map(b => {
    const bs: Rec = b.settings ?? {};
    return { b, title: str(bs, HEADING), text: str(bs, TEXT), image: str(bs, IMAGE), link: linkOf(bs, ['link', 'ctaLink', 'buttonLink']) };
  }).filter(i => i.title || i.text || i.image);

  const make = (type: string, settings: Rec, list: Block[]) => ({ section: { ...section, type, settings } as Section, blocks: list });
  const blk = (type: string, settings: Rec, i: number): Block => ({ _id: `fx-${i}`, type, settings, visible: true } as unknown as Block);

  // a table typed as lines ("Size | Chest | Waist") keeps its data as a real table
  const rows = typeof s.rows === 'string' ? s.rows.split(/\r?\n/).map(l => l.split('|').map(c => c.trim())).filter(r => r.some(Boolean)) : [];
  if (rows.length > 1) {
    const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cell = 'padding:10px 14px;border:1px solid rgba(128,128,128,.3);text-align:left';
    const html = '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%">'
      + `<thead><tr>${rows[0].map(c => `<th style="${cell}">${esc(c)}</th>`).join('')}</tr></thead>`
      + `<tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td style="${cell}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      + (str(s, ['note']) ? `<p>${esc(str(s, ['note']))}</p>` : '');
    return make('custom_html', { heading, html }, []);
  }

  // big-number blocks (`value` + label, e.g. "16GB" Memory) keep the number as the title
  const valued = blocks.filter(b => b.type === 'theme_block' && str(b.settings, ['value']));
  if (valued.length > 0) {
    return make('feature_list', { heading, columns: Math.min(4, Math.max(2, valued.length)) },
      valued.map((b, n) => blk('feature_item', { icon: 'star', title: str(b.settings, ['value']), description: [str(b.settings, HEADING), str(b.settings, TEXT)].filter(Boolean).join(' · ') }, n)));
  }

  const withImage = items.filter(i => i.image);
  if (withImage.length > 0 && withImage.every(i => !i.text)) {
    return make('gallery_grid', { heading, columns: Math.min(4, Math.max(2, withImage.length)) },
      withImage.map((i, n) => blk('gallery_image', { imageUrl: i.image, alt: i.title, caption: i.title, link: i.link }, n)));
  }
  if (withImage.length > 0) {
    return make('image_with_text', { heading: items.length > 1 ? heading : '' },
      withImage.map((i, n) => blk('image_text_pair', { imageUrl: i.image, heading: i.title, body: i.text, ctaLink: i.link, imagePosition: n % 2 ? 'right' : 'left' }, n)));
  }
  const titled = items.filter(i => i.title);
  if (titled.length > 0) {
    return make('feature_list', { heading, columns: Math.min(3, Math.max(2, titled.length)) },
      titled.map((i, n) => blk('feature_item', { icon: 'star', title: i.title, description: i.text }, n)));
  }
  const image = str(s, IMAGE);
  const ctaText = str(s, CTA_LABEL);
  if (image) {
    return make('image_with_text', {}, [blk('image_text_pair', { imageUrl: image, heading, body: intro, ctaText, ctaLink: linkOf(s, CTA_LINK) }, 0)]);
  }
  if (heading || intro) {
    return make('rich_text', { heading, alignment: 'center' }, intro ? [blk('paragraph', { text: intro }, 0)] : []);
  }
  return null;
}
