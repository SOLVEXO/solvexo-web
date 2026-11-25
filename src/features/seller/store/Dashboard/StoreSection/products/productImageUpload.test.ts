import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/services/mediaLibrary', () => ({ apiUploadMediaAsset: vi.fn() }));
vi.mock('@/components/comman/ui/imageCompress', () => ({ compressImage: async (f: File) => f }));

import { apiUploadMediaAsset } from '@/api/services/mediaLibrary';
import { checkPhotos, uploadPhotoFiles } from './productImageUpload';

const file = (name: string, type = 'image/jpeg', size = 1000) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('checkPhotos', () => {
  it('keeps good photos and explains what was skipped', () => {
    const { files, notes } = checkPhotos([file('a.jpg'), file('b.pdf', 'application/pdf'), file('c.png', 'image/png', 25 * 1024 * 1024)], 10);
    expect(files.map(f => f.name)).toEqual(['a.jpg']);
    expect(notes.join(' ')).toMatch(/not JPG, PNG or WebP/);
    expect(notes.join(' ')).toMatch(/over 20 MB/);
  });

  it('respects how many photos the product can still take', () => {
    const { files, notes } = checkPhotos([file('1.jpg'), file('2.jpg'), file('3.jpg')], 2);
    expect(files).toHaveLength(2);
    expect(notes.join(' ')).toMatch(/1 file was skipped/);
    expect(checkPhotos([file('1.jpg')], 0).files).toHaveLength(0);
  });
});

describe('uploadPhotoFiles', () => {
  it('reports each file the moment it finishes and one failure does not stop the others', async () => {
    const api = vi.mocked(apiUploadMediaAsset);
    api.mockImplementation(async (_s, f) => {
      if ((f as File).name === 'bad.jpg') throw new Error('boom');
      return { data: { url: `https://cdn/${(f as File).name}` } } as never;
    });
    const seen: [number, string | null, string][] = [];
    await uploadPhotoFiles('s1', [file('a.jpg'), file('bad.jpg'), file('c.jpg')], (i, url, err) => seen.push([i, url, err]));
    expect(seen).toHaveLength(3);
    expect(seen.find(s => s[0] === 0)?.[1]).toBe('https://cdn/a.jpg');
    expect(seen.find(s => s[0] === 1)).toEqual([1, null, 'boom']);
    expect(seen.find(s => s[0] === 2)?.[1]).toBe('https://cdn/c.jpg');
  });
});
