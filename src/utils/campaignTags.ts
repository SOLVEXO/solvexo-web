/**
 * Campaign tags (utm_source / utm_medium / utm_campaign) from the link a visitor arrived through. Ads usually land
 * on the homepage, and the visitor books a demo a few clicks later, so the first tags seen this visit are kept
 * for the session and sent with the Book-a-demo form. Per-tab and best-effort: storage may be unavailable.
 */
export interface CampaignTags { utmSource?: string; utmMedium?: string; utmCampaign?: string }
const KEY = 'solvexo:utm';

function fromSearch(search: string): CampaignTags {
  const p = new URLSearchParams(search);
  const pick = (k: string) => p.get(k)?.trim().slice(0, 100) || undefined;
  const t: CampaignTags = { utmSource: pick('utm_source'), utmMedium: pick('utm_medium'), utmCampaign: pick('utm_campaign') };
  return t.utmSource || t.utmMedium || t.utmCampaign ? t : {};
}

/** Call on every public page view: keeps the first set of tags this session. */
export function rememberCampaignTags(search: string): void {
  const t = fromSearch(search);
  if (!Object.keys(t).length) return;
  try { if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, JSON.stringify(t)); } catch { /* storage blocked */ }
}

/** Tags on the current URL win; otherwise the ones remembered this session. */
export function campaignTags(search: string): CampaignTags {
  const now = fromSearch(search);
  if (Object.keys(now).length) return now;
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as CampaignTags; } catch { return {}; }
}
