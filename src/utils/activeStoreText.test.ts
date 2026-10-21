import { afterEach, describe, expect, it } from 'vitest';
import { indexTextStrings } from './storeText';
import { localizeBlogPost, localizeCategory, localizePaymentMethod, localizeShippingZone, setActiveStoreText } from './activeStoreText';

afterEach(() => setActiveStoreText('', new Map()));

describe('active storefront text', () => {
  it('leaves everything untouched in the store\'s own language', () => {
    setActiveStoreText('', indexTextStrings({ 'cat:c1#name': 'Hüte' }));
    const cat = { _id: 'c1', name: 'Hats' };
    expect(localizeCategory(cat)).toBe(cat);
  });

  it('translates a category tree', () => {
    setActiveStoreText('de', indexTextStrings({ 'cat:c1#name': 'Hüte', 'cat:c2#name': 'Kappen' }));
    const out = localizeCategory({ _id: 'c1', name: 'Hats', children: [{ _id: 'c2', name: 'Caps', children: [] }] });
    expect(out.name).toBe('Hüte');
    expect(out.children[0].name).toBe('Kappen');
  });

  it('translates a blog post from its saved translation and its body strings', () => {
    setActiveStoreText('de', indexTextStrings({ 'bp:p1#content.0.settings.text': 'Hallo Welt' }));
    const post = {
      _id: 'p1', title: 'Hello', excerpt: 'Short', seoTitle: null as string | null,
      translations: { de: { title: 'Hallo', description: 'Kurz', metaTitle: 'Hallo SEO' }, ur: { title: 'x' } },
      content: [{ type: 'paragraph', settings: { text: 'Hello world' } }],
    };
    const out = localizeBlogPost(post);
    expect(out.title).toBe('Hallo');
    expect(out.excerpt).toBe('Kurz');
    expect(out.seoTitle).toBe('Hallo SEO');
    expect(out.content[0].settings.text).toBe('Hallo Welt');
    expect(post.title).toBe('Hello');
  });

  it('falls back to the original when a language has no translation', () => {
    setActiveStoreText('fr', indexTextStrings({}));
    const post = { _id: 'p1', title: 'Hello', translations: { de: { title: 'Hallo' } } };
    expect(localizeBlogPost(post).title).toBe('Hello');
  });

  it('translates delivery options and the seller\'s payment methods', () => {
    setActiveStoreText('de', indexTextStrings({ 'ship:z1#name': 'Standardversand', 'pay:m1#name': 'Überweisung', 'pay:m1#instructions': 'Bitte überweisen' }));
    expect(localizeShippingZone({ _id: 'z1', name: 'Standard' }).name).toBe('Standardversand');
    const pay = localizePaymentMethod({ methodId: 'm1', displayName: 'Bank transfer', instructions: 'Please transfer' });
    expect(pay.displayName).toBe('Überweisung');
    expect(pay.instructions).toBe('Bitte überweisen');
    expect(localizePaymentMethod({ displayName: 'Card' }).displayName).toBe('Card');
  });
});
