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

  it('reads a Vimeo link', () => {
    const p = parseProductVideo('https://vimeo.com/123456789');
    expect(p).toEqual({ kind: 'vimeo', src: 'https://player.vimeo.com/video/123456789', poster: 'https://vumbnail.com/123456789.jpg' });
  });

  it('reads an uploaded Cloudinary video and derives a still frame', () => {
    const p = parseProductVideo('https://res.cloudinary.com/demo/video/upload/v1/clip.mp4');
    expect(p?.kind).toBe('file');
    expect(p?.poster).toBe('https://res.cloudinary.com/demo/video/upload/v1/clip.jpg');
  });

  it('rejects empty, non-https, image and local addresses', () => {
    expect(parseProductVideo('')).toBeNull();
    expect(parseProductVideo('http://youtu.be/dQw4w9WgXcQ')).toBeNull();
    expect(parseProductVideo('https://res.cloudinary.com/demo/image/upload/v1/pic.jpg')).toBeNull();
    expect(parseProductVideo('https://localhost/video.mp4')).toBeNull();
    expect(parseProductVideo('https://127.0.0.1/v.mp4')).toBeNull();
  });

  it('accepts any other https link: a file link plays, a page link opens in a new tab', () => {
    expect(parseProductVideo('https://cdn.example.com/clips/a.mp4?x=1')?.kind).toBe('file');
    expect(parseProductVideo('https://www.tiktok.com/@shop/video/123')?.kind).toBe('link');
  });
});
