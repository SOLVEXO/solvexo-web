// A product video is either an uploaded file (Cloudinary) or a YouTube / Vimeo link. One small parser tells the
// seller form and the storefront how to play it and which still image to show as its thumbnail.

export type ProductVideoKind = 'file' | 'youtube' | 'vimeo';

export interface ParsedProductVideo {
  kind: ProductVideoKind;
  /** What to put in a <video src> (file) or <iframe src> (youtube / vimeo). */
  src: string;
  /** A still frame for the thumbnail / player poster (Vimeo's comes from the free vumbnail.com service). */
  poster: string | null;
}

function youtubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'youtu.be') return u.pathname.split('/')[1] || null;
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') return u.searchParams.get('v');
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
    if (m) return m[1];
  }
  return null;
}

function vimeoId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, '');
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
  const m = u.pathname.match(/(\d{5,})/);
  return m ? m[1] : null;
}

export function parseProductVideo(raw: string | null | undefined): ParsedProductVideo | null {
  const url = String(raw ?? '').trim();
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:') return null;

  const yt = youtubeId(u);
  if (yt && /^[\w-]{6,20}$/.test(yt)) {
    return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`, poster: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` };
  }
  const vm = vimeoId(u);
  if (vm) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vm}`, poster: `https://vumbnail.com/${vm}.jpg` };

  if (u.hostname === 'res.cloudinary.com' && /\/video\/upload\//.test(u.pathname)) {
    // Cloudinary serves a still frame of a video when the extension is swapped for .jpg
    return { kind: 'file', src: url, poster: url.replace(/\.[a-z0-9]{2,4}(\?.*)?$/i, '.jpg') };
  }
  return null;
}
