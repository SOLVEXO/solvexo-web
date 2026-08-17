const KEY = 'promotionAttribution';
const TTL_MS = 48 * 60 * 60 * 1000; // 48h — long enough to cover a same-session or next-day purchase

interface PromotionAttribution {
  entityType: 'banner' | 'store_banner';
  entityId: string;
  expiresAt: number;
}

/** Set when a buyer clicks a promoted banner — read back at checkout to
 *  attribute the resulting order for promotion analytics (conversions/revenue). */
export function setPromotionAttribution(entityType: PromotionAttribution['entityType'], entityId: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ entityType, entityId, expiresAt: Date.now() + TTL_MS }));
  } catch { /* localStorage unavailable — attribution is best-effort, not required */ }
}

export function getPromotionAttribution(): PromotionAttribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PromotionAttribution;
    if (parsed.expiresAt < Date.now()) { localStorage.removeItem(KEY); return null; }
    return parsed;
  } catch { return null; }
}

/** Maps the stored attribution (if any) onto the two fields checkout creation accepts. */
export function getCheckoutAttributionFields(): { attributedBannerId?: string; attributedStoreBannerId?: string } {
  const attribution = getPromotionAttribution();
  if (!attribution) return {};
  return attribution.entityType === 'banner'
    ? { attributedBannerId: attribution.entityId }
    : { attributedStoreBannerId: attribution.entityId };
}
