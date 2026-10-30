// A product video is an uploaded file, a YouTube / Vimeo link, a direct link to a video file, or any other https link
// (opened in a new tab). One small parser tells the seller form and the storefront how to play it and which still
// image to show as its thumbnail.

export type ProductVideoKind = 'file' | 'youtube' | 'vimeo' | 'link';

export interface ParsedProductVideo {
  kind: ProductVideoKind;
  /** What to put in a <video src> (file), an <iframe src> (youtube / vimeo) or an <a href> (link). */
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

  if (u.hostname === 'res.cloudinary.com') {
    // Cloudinary serves a still frame of a video when the extension is swapped for .jpg
    return /\/video\/upload\//.test(u.pathname) ? { kind: 'file', src: url, poster: url.replace(/\.[a-z0-9]{2,4}(\?.*)?$/i, '.jpg') } : null;
  }
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || /^[\d.]+$/.test(host) || host.includes(':')) return null;
  // A direct link to a video file plays in the page; any other https page opens in a new tab.
  if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(u.pathname)) return { kind: 'file', src: url, poster: null };
  return { kind: 'link', src: url, poster: null };
}
