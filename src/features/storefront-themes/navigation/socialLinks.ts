import type { Block } from '@/api/services/storefrontTypes';

/** Where a footer social icon points. WhatsApp may hold a phone number (becomes wa.me); everything else needs an https link. Null = nothing to link to. */
export function socialHref(settings: Record<string, unknown> | undefined): string | null {
  const raw = String(settings?.url ?? '').trim();
  if (!raw) return null;
  if (/^https:\/\//i.test(raw)) return raw;
  if (settings?.platform === 'whatsapp') {
    const digits = raw.replace(/[^\d]/g, '');
    return digits.length >= 7 ? `https://wa.me/${digits}` : null;
  }
  return null;
}

/** A social block is shown only when it has somewhere to go (an icon with no link is just a dead button). */
export function hasSocialTarget(b: Pick<Block, 'settings'>): boolean {
  return socialHref(b.settings as Record<string, unknown>) !== null;
}
