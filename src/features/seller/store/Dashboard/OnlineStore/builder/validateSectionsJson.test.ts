import { describe, it, expect } from 'vitest';
import { validateSectionsJson } from './validateSectionsJson';

describe('validateSectionsJson (Phase 10 — Edit Code structural validation)', () => {
  it('accepts an empty array', () => {
    expect(validateSectionsJson([])).toEqual({ errors: [], notices: [] });
  });

  it('rejects a non-array payload', () => {
    const { errors } = validateSectionsJson({ not: 'an array' });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/must be a json array/i);
  });

  it('accepts a real, valid rich_text section with a paragraph block', () => {
    const { errors, notices } = validateSectionsJson([
      { type: 'rich_text', settings: { heading: '', alignment: 'left' }, blocks: [{ type: 'paragraph', settings: { text: 'Hello' } }] },
    ]);
    expect(errors).toEqual([]);
    expect(notices).toEqual([]);
  });

  it('reports an unrecognized section type as a NON-BLOCKING notice, not a hard error', () => {
    const { errors, notices } = validateSectionsJson([{ type: 'not_a_real_section', settings: {}, blocks: [] }]);
    expect(errors).toEqual([]);
    expect(notices.some(n => /isn't recognized/i.test(n))).toBe(true);
  });

  it('reports a real backend section type with no frontend renderer (e.g. feature_list) as a notice too — a disclosed, existing state, not a merchant error, found live against a real store\'s real Home page during this phase\'s own verification', () => {
    const { errors, notices } = validateSectionsJson([
      { type: 'feature_list', settings: { heading: 'Why shop with us' }, blocks: [{ type: 'feature_item', settings: { icon: 'leaf' } }] },
    ]);
    expect(errors).toEqual([]);
    expect(notices).toHaveLength(1);
  });

  it('rejects a block type not allowed inside its section', () => {
    const { errors } = validateSectionsJson([
      { type: 'rich_text', settings: {}, blocks: [{ type: 'hero_slide', settings: {} }] },
    ]);
    expect(errors.some(e => /not allowed inside/i.test(e))).toBe(true);
  });

  it('allows an app-block-shaped type through even though it is not in the section\'s own allow-list', () => {
    const { errors, notices } = validateSectionsJson([
      { type: 'rich_text', settings: {}, blocks: [{ type: 'app:trust-signals:rating_badge', settings: { text: 'Hi' } }] },
    ]);
    expect(errors).toEqual([]);
    expect(notices).toEqual([]);
  });

  it('rejects settings that are not an object', () => {
    const { errors } = validateSectionsJson([{ type: 'rich_text', settings: 'nope', blocks: [] }]);
    expect(errors.some(e => /"settings" must be an object/i.test(e))).toBe(true);
  });

  it('rejects blocks that are not an array', () => {
    const { errors } = validateSectionsJson([{ type: 'rich_text', settings: {}, blocks: 'nope' }]);
    expect(errors.some(e => /"blocks" must be an array/i.test(e))).toBe(true);
  });

  it('rejects a half-set dynamic source pair on a block', () => {
    const { errors } = validateSectionsJson([
      { type: 'rich_text', settings: {}, blocks: [{ type: 'paragraph', settings: { dynamicSourceKey: 'tagline' } }] },
    ]);
    expect(errors.some(e => /dynamicSourceNamespace and dynamicSourceKey must both be set/i.test(e))).toBe(true);
  });

  it('rejects a half-set dynamic source pair on a section\'s own settings', () => {
    const { errors } = validateSectionsJson([
      { type: 'rich_text', settings: { dynamicSourceNamespace: 'custom' }, blocks: [] },
    ]);
    expect(errors.some(e => /dynamicSourceNamespace and dynamicSourceKey must both be set/i.test(e))).toBe(true);
  });

  it('accepts a fully-set dynamic source pair', () => {
    const { errors } = validateSectionsJson([
      { type: 'rich_text', settings: { dynamicSourceNamespace: 'custom', dynamicSourceKey: 'tagline' }, blocks: [] },
    ]);
    expect(errors).toEqual([]);
  });

  it('reports multiple independent errors across sections/blocks in one pass', () => {
    const { errors } = validateSectionsJson([
      { type: 'rich_text', settings: 'not-an-object', blocks: [] },
      { type: 'rich_text', settings: {}, blocks: [{ type: 'hero_slide', settings: {} }] },
    ]);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
