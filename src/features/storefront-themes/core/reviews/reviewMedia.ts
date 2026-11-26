/**
 * Review media (photos + audio + video) — one place that decides what a URL is.
 *
 * The API keeps a review's attachments in ONE array of URLs (`Rating.media`), so
 * the kind has to be derived. Uploads go to Cloudinary folders by resource type
 * (`uploads/audios`, `uploads/videos`, `uploads/images`), which is the reliable
 * signal; the extension is only a fallback for older/hand-pasted URLs.
 */
export type ReviewMediaKind = 'image' | 'audio' | 'video';

export const REVIEW_MEDIA_LIMITS = {
  images: 4,
  audio: 1,
  video: 1,
  audioMaxBytes: 25 * 1024 * 1024,
  videoMaxBytes: 50 * 1024 * 1024,
} as const;

const AUDIO_EXT = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'opus', 'flac', 'weba', 'webm'];
const VIDEO_EXT = ['mp4', 'mov', 'm4v', 'webm', 'ogv', 'mkv', 'avi'];

function extensionOf(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const last = clean.slice(clean.lastIndexOf('/') + 1);
  const dot = last.lastIndexOf('.');
  return dot >= 0 ? last.slice(dot + 1).toLowerCase() : '';
}

export function reviewMediaKind(url: string): ReviewMediaKind {
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  // Cloudinary keeps the resource type in the folder and in `resource_type` on
  // the delivery URL (`/image/upload/`, `/video/upload/`, `/audio/upload/`).
  if (/\/audios?\//.test(clean) || /\/audio\/upload\//.test(clean)) return 'audio';
  if (/\/videos?\//.test(clean) || /\/video\/upload\//.test(clean)) return 'video';
  const ext = extensionOf(clean);
  if (AUDIO_EXT.includes(ext)) return 'audio';
  if (VIDEO_EXT.includes(ext)) return 'video';
  return 'image';
}

export function splitReviewMedia(urls: string[] | null | undefined): Record<ReviewMediaKind, string[]> {
  const out: Record<ReviewMediaKind, string[]> = { image: [], audio: [], video: [] };
  for (const url of urls ?? []) {
    if (!url) continue;
    out[reviewMediaKind(url)].push(url);
  }
  return out;
}

export function reviewMediaCounts(urls: string[] | null | undefined): Record<ReviewMediaKind, number> {
  const split = splitReviewMedia(urls);
  return { image: split.image.length, audio: split.audio.length, video: split.video.length };
}

export function hasReviewMedia(urls: string[] | null | undefined): boolean {
  return (urls ?? []).some(Boolean);
}

/** "2 photos · 1 audio · 1 video" — used by the seller's review list. */
export function reviewMediaSummary(urls: string[] | null | undefined): string {
  const counts = reviewMediaCounts(urls);
  const parts: string[] = [];
  if (counts.image) parts.push(`${counts.image} photo${counts.image > 1 ? 's' : ''}`);
  if (counts.audio) parts.push(`${counts.audio} audio`);
  if (counts.video) parts.push(`${counts.video} video`);
  return parts.join(' · ');
}

/**
 * Client-side guard before uploading: type + size + "one audio / one video per
 * review". Returns a message to show, or null when the file is fine.
 * `kind` is what the picker asked for; the file's own mimetype wins when it disagrees.
 */
export function checkReviewMediaFile(file: File, kind: ReviewMediaKind, current: string[] = []): string | null {
  const counts = reviewMediaCounts(current);
  const actual: ReviewMediaKind = file.type.startsWith('audio/') ? 'audio'
    : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('image/') ? 'image'
        : kind;
  if (actual === 'audio') {
    if (counts.audio >= REVIEW_MEDIA_LIMITS.audio) return 'Only one audio note per review.';
    if (file.size > REVIEW_MEDIA_LIMITS.audioMaxBytes) return 'The audio note is too large (max 25 MB).';
  }
  if (actual === 'video') {
    if (counts.video >= REVIEW_MEDIA_LIMITS.video) return 'Only one video per review.';
    if (file.size > REVIEW_MEDIA_LIMITS.videoMaxBytes) return 'The video is too large (max 50 MB).';
  }
  if (actual === 'image' && counts.image >= REVIEW_MEDIA_LIMITS.images) return 'Up to 4 photos per review.';
  return null;
}