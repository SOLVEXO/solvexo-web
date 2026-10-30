import { describe, expect, it } from 'vitest';
import { parseProductVideo } from './productVideo';

describe('parseProductVideo', () => {
  it('reads YouTube watch, short and shorts links', () => {
    for (const url of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/shorts/dQw4w9WgXcQ']) {
      const p = parseProductVideo(url);
      expect(p?.kind).toBe('youtube');
      expect(p?.src).toContain('/embed/dQw4w9WgXcQ');
      expect(p?.poster).toContain('dQw4w9WgXcQ');
    }
  });

  it('reads a Vimeo link (no poster)', () => {
    const p = parseProductVideo('https://vimeo.com/123456789');
    expect(p).toEqual({ kind: 'vimeo', src: 'https://player.vimeo.com/video/123456789', poster: null });
  });

  it('reads an uploaded Cloudinary video and derives a still frame', () => {
    const p = parseProductVideo('https://res.cloudinary.com/demo/video/upload/v1/clip.mp4');
    expect(p?.kind).toBe('file');
    expect(p?.poster).toBe('https://res.cloudinary.com/demo/video/upload/v1/clip.jpg');
  });

  it('rejects empty, non-https, image and unknown hosts', () => {
    expect(parseProductVideo('')).toBeNull();
    expect(parseProductVideo('http://youtu.be/dQw4w9WgXcQ')).toBeNull();
    expect(parseProductVideo('https://res.cloudinary.com/demo/image/upload/v1/pic.jpg')).toBeNull();
    expect(parseProductVideo('https://evil.example.com/video.mp4')).toBeNull();
  });
});
