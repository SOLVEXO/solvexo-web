import { describe, expect, it } from 'vitest';
import { localizeCollection, localizeMenuItemLabel, localizePage, localizeProduct } from './localize';

describe('localize', () => {
  const product = {
    name: 'Shirt', description: 'Cotton', slug: 'shirt',
    translations: { ur: { title: 'قمیض', description: '', handle: 'qameez', metaTitle: 'میٹا' } },
  };
  it('uses the translation and keeps the source slug', () => {
    const p = localizeProduct(product, 'ur');
    expect(p.name).toBe('قمیض');
    expect(p.slug).toBe('shirt');
    expect(p.localizedHandle).toBe('qameez');
    expect(p.localizedMetaTitle).toBe('میٹا');
  });
  it('falls back per field when the translation is empty', () => {
    expect(localizeProduct(product, 'ur').description).toBe('Cotton');
  });
  it('returns the source when the locale has no translation (never blank)', () => {
    expect(localizeProduct(product, 'fr')).toBe(product);
    expect(localizeProduct({ name: 'A' }, 'ur').name).toBe('A');
    expect(localizeProduct({ name: 'A', translations: { ur: { title: '   ' } } }, 'ur').name).toBe('A');
  });
  it('collections and pages', () => {
    expect(localizeCollection({ name: 'Sale', description: null, translations: { ur: { title: 'سیل', description: 'تفصیل' } } }, 'ur'))
      .toMatchObject({ name: 'سیل', description: 'تفصیل' });
    expect(localizePage({ title: 'About', translations: { ur: { title: 'ہمارے بارے میں' } } }, 'ur').title).toBe('ہمارے بارے میں');
    expect(localizePage({ title: 'About' }, 'ur').title).toBe('About');
  });
  it('menu labels', () => {
    expect(localizeMenuItemLabel({ label: 'Shop', labelTranslations: { ur: 'دکان' } }, 'ur')).toBe('دکان');
    expect(localizeMenuItemLabel({ label: 'Shop', labelTranslations: { ur: '' } }, 'ur')).toBe('Shop');
    expect(localizeMenuItemLabel({ label: 'Shop' }, 'ur')).toBe('Shop');
    expect(localizeMenuItemLabel(null, 'ur')).toBe('');
  });
});
