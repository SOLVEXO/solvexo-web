import type { Block } from '@/api/services/storefrontTypes';

/** Where a plain username (@name or name) points, per platform. */
const HANDLE_BASE: Record<string, string> = {
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  x: 'https://x.com/',
  tiktok: 'https://tiktok.com/@',
  youtube: 'https://youtube.com/@',
  linkedin: 'https://linkedin.com/in/',
};

/** A link typed without https:// is accepted only for these well-known social hosts. */
const SOCIAL_HOST = /^(www\.)?(instagram\.com|facebook\.com|fb\.com|fb\.me|x\.com|twitter\.com|tiktok\.com|youtube\.com|youtu\.be|linkedin\.com|wa\.me|linktr\.ee)\/\S*$/i;
const HANDLE = /^@?[A-Za-z0-9._-]{1,60}$/;

/**
 * Where a footer social icon points. Accepts a full https link, a known social link typed without https://
 * (`instagram.com/store`), or a plain username (`@store`). WhatsApp may hold a phone number (becomes wa.me).
 * Null = nothing to link to. The result is always an https URL we built or the seller's own https link.
 */
export function socialHref(settings: Record<string, unknown> | undefined): string | null {
  const raw = String(settings?.url ?? '').trim();
  if (!raw) return null;
  if (/^https:\/\//i.test(raw)) return raw;
  const platform = String(settings?.platform ?? '');
  if (platform === 'whatsapp') {
    const digits = raw.replace(/[^\d]/g, '');
    return digits.length >= 7 ? `https://wa.me/${digits}` : null;
  }
  if (SOCIAL_HOST.test(raw)) return `https://${raw}`;
  if (HANDLE.test(raw) && HANDLE_BASE[platform]) return HANDLE_BASE[platform] + raw.replace(/^@/, '');
  return null;
}

/** A social block is shown only when it has somewhere to go (an icon with no link is just a dead button), same as Shopify. */
export function hasSocialTarget(b: Pick<Block, 'settings'>): boolean {
  return socialHref(b.settings as Record<string, unknown>) !== null;
}
