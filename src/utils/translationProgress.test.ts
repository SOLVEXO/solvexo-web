import { describe, it, expect } from 'vitest';
import { menuProgress, translationProgress, untranslatedFields } from './translationProgress';

describe('translation progress', () => {
  const source = { title: 'Shirt', description: 'Cotton', handle: 'shirt' };
  it('counts only fields that have source text', () => {
    expect(translationProgress(source, undefined)).toEqual({ done: 0, total: 3 });
    expect(translationProgress(source, { title: 'x', description: ' ' })).toEqual({ done: 1, total: 3 });
    expect(translationProgress({ title: 'A', description: '' }, { title: 'B' })).toEqual({ done: 1, total: 1 });
  });
  it('lists untranslated fields', () => {
    expect(untranslatedFields(source, { title: 'x', handle: 'y' })).toEqual(['description']);
  });
  it('menu progress', () => {
    const items = [{ id: 'a', label: 'Home', labelTranslations: { ur: 'x' } }, { id: 'b', label: 'Shop' }];
    expect(menuProgress(items, 'ur')).toEqual({ done: 1, total: 2 });
  });
});

import { findUnknownTags } from './translationProgress';
describe('findUnknownTags', () => {
  it('finds placeholders that are not allowed, once each', () => {
    expect(findUnknownTags('Hi {{name}} {{ orderNumber }} {{oops}} {{oops}}', ['name', 'orderNumber'])).toEqual(['oops']);
    expect(findUnknownTags('no tags', ['a'])).toEqual([]);
  });
});
