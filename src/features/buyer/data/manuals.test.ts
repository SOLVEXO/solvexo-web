// @vitest-environment node
import { statSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { MANUALS, formatFileSize } from './manuals';

describe('user manuals', () => {
  it('points every download at a real PDF in /public with the size the page shows', () => {
    for (const m of MANUALS) {
      for (const file of [m.complete, ...m.chapters]) {
        const onDisk = statSync(path.resolve(__dirname, '../../../../public', `.${file.file}`));
        expect(file.file).toMatch(/^\/manuals\/(store|pos)\/[a-z0-9-]+\.pdf$/);
        expect(onDisk.size).toBe(file.sizeBytes);
      }
    }
  });

  it('formats sizes for people', () => {
    expect(formatFileSize(4810141)).toBe('4.8 MB');
    expect(formatFileSize(308078)).toBe('308 KB');
  });
});
