import { describe, expect, it } from 'vitest';
import { describeEditorError } from './editorErrors';

const sections = [
  { _id: 'a1', type: 'hero', blocks: [] },
  { type: 'rich_text', blocks: [{ _id: 'b1' }, {}] },
];

describe('describeEditorError', () => {
  it('names the section and points at it', () => {
    const r = describeEditorError('sections.1.settings must be an object', sections);
    expect(r.sectionId).toBe('1');
    expect(r.text).toMatch(/missing its settings/);
    expect(r.text).not.toMatch(/sections\.1/);
  });
  it('finds blocks and fields', () => {
    const r = describeEditorError('sections.0.blocks.1.settings.buttonLink must be a valid URL', sections);
    expect(r.sectionId).toBe('a1');
    expect(r.blockId).toBe('1');
    expect(r.text).toContain('Button link must be a valid URL');
    expect(r.text).toContain('item 2');
  });
  it('leaves unknown messages alone', () => {
    expect(describeEditorError('Something else', sections)).toEqual({ text: 'Something else' });
    expect(describeEditorError('sections.9.settings x', sections)).toEqual({ text: 'sections.9.settings x' });
  });
});
