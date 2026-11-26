import { describe, expect, it } from 'vitest';
import { checkReviewMediaFile, reviewMediaCounts, reviewMediaKind, reviewMediaSummary, splitReviewMedia } from './reviewMedia';

describe('reviewMediaKind', () => {
  it('uses the upload folder first, then the extension', () => {
    expect(reviewMediaKind('https://res.cloudinary.com/x/audio/upload/v1/uploads/audios/a.webm')).toBe('audio');
    expect(reviewMediaKind('https://res.cloudinary.com/x/video/upload/v1/uploads/videos/b.webm')).toBe('video');
    expect(reviewMediaKind('https://cdn.test/uploads/images/c.jpg')).toBe('image');
    expect(reviewMediaKind('https://cdn.test/voice.mp3')).toBe('audio');
    expect(reviewMediaKind('https://cdn.test/clip.mp4?x=1')).toBe('video');
    expect(reviewMediaKind('https://cdn.test/pic.png')).toBe('image');
  });
});

describe('splitReviewMedia', () => {
  it('splits a mixed list and counts each kind', () => {
    const urls = ['https://cdn.test/a.jpg', 'https://cdn.test/b.png', 'https://cdn.test/uploads/audios/c.webm', 'https://cdn.test/uploads/videos/d.mp4'];
    const split = splitReviewMedia(urls);
    expect(split.image).toHaveLength(2);
    expect(split.audio).toHaveLength(1);
    expect(split.video).toHaveLength(1);
    expect(reviewMediaCounts(urls)).toEqual({ image: 2, audio: 1, video: 1 });
    expect(reviewMediaSummary(urls)).toBe('2 photos · 1 audio · 1 video');
    expect(reviewMediaSummary([])).toBe('');
    expect(reviewMediaCounts(undefined)).toEqual({ image: 0, audio: 0, video: 0 });
  });
});

describe('checkReviewMediaFile', () => {
  const file = (name: string, type: string, mb: number) => ({ name, type, size: mb * 1024 * 1024 }) as unknown as File;

  it('allows one audio note and one video, and caps photos at four', () => {
    expect(checkReviewMediaFile(file('a.webm', 'audio/webm', 5), 'audio')).toBeNull();
    expect(checkReviewMediaFile(file('a.webm', 'audio/webm', 5), 'audio', ['https://cdn.test/uploads/audios/x.webm'])).toMatch(/one audio/i);
    expect(checkReviewMediaFile(file('a.mp4', 'video/mp4', 10), 'video')).toBeNull();
    expect(checkReviewMediaFile(file('a.mp4', 'video/mp4', 60), 'video')).toMatch(/too large/i);
    expect(checkReviewMediaFile(file('a.mp3', 'audio/mpeg', 30), 'audio')).toMatch(/too large/i);
    const four = ['1.jpg', '2.jpg', '3.jpg', '4.jpg'].map(n => `https://cdn.test/${n}`);
    expect(checkReviewMediaFile(file('5.jpg', 'image/jpeg', 1), 'image', four)).toMatch(/4 photos/i);
    expect(checkReviewMediaFile(file('5.jpg', 'image/jpeg', 1), 'image', four.slice(0, 3))).toBeNull();
  });
});