// Phase 9 — Merchant Acquisition Tracking.
//
// Same "capture on landing, read back at conversion" shape as
// promotionAttribution.ts, but for a completely different question: THIS
// util is about how a SELLER found the platform and signed up, not about
// what made a BUYER complete a purchase. Captured once, at app startup
// (see main.tsx calling captureSellerAcquisitionAttribution), from real
// UTM query params and/or a real external referrer present on THIS page
// load — never fabricated, never guessed. Read back once, at seller-
// registration submit time (RegisterPage.tsx), and sent to the backend
// where it's persisted immutably on the new Seller document (see
// Seller.acquisitionSource et al.) — completely separate from and never
// blended with the buyer-side Order.attributionSource field.

const KEY = 'sellerAcquisitionAttribution';
// 30 days — a prospective seller may research/compare for a while before
// actually signing up. promotionAttribution.ts's 48h window is right for a
// buyer's checkout decision; a merchant's signup decision is a longer one.
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface SellerAcquisitionSnapshot {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  landingPage: string;
  expiresAt: number;
}

const UTM_SOURCE_PARAM = 'utm_source';
const UTM_MEDIUM_PARAM = 'utm_medium';
const UTM_CAMPAIGN_PARAM = 'utm_campaign';

function readSnapshot(): SellerAcquisitionSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SellerAcquisitionSnapshot;
    if (!parsed || typeof parsed.expiresAt !== 'number' || parsed.expiresAt < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Call once, at app startup (main.tsx) — before React Router even mounts,
 *  so a fresh landing from an ad/campaign link is captured on its very
 *  first page load. First touch wins: never overwrites an existing,
 *  still-valid snapshot, matching how AffiliateReferral/promotionAttribution.ts
 *  both credit the FIRST attribution touch, not the most recent one. */
export function captureSellerAcquisitionAttribution(): void {
  capturePartnerCode();
  try {
    if (typeof window === 'undefined') return;
    if (readSnapshot()) return; // already have a live snapshot — leave it alone

    const params = new URLSearchParams(window.location.search);
    const source = params.get(UTM_SOURCE_PARAM);
    const medium = params.get(UTM_MEDIUM_PARAM);
    const campaign = params.get(UTM_CAMPAIGN_PARAM);

    // A real external referrer counts as a signal too, even with no UTM
    // params — e.g. an organic search-engine click or another site linking
    // in. Same-origin navigation (an internal link click) is never treated
    // as a new acquisition touch.
    let referrerSource: string | null = null;
    try {
      if (document.referrer) {
        const referrerOrigin = new URL(document.referrer).origin;
        if (referrerOrigin !== window.location.origin) referrerSource = referrerOrigin;
      }
    } catch {
      // malformed/unparseable referrer — ignore, never guess
    }

    if (!source && !medium && !campaign && !referrerSource) return; // nothing real to capture — stays unattributed (organic/direct)

    const snapshot: SellerAcquisitionSnapshot = {
      source: source ?? referrerSource,
      medium: medium ?? (referrerSource ? 'referral' : null),
      campaign: campaign ?? null,
      landingPage: window.location.pathname + window.location.search,
      expiresAt: Date.now() + TTL_MS,
    };
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage unavailable — attribution is best-effort, never blocks the app
  }
}

/** Read back at seller-registration submit time. Maps the stored snapshot
 *  (if any) onto the fields RegisterPayload/RegisterDto accept. Returns an
 *  empty object when nothing was ever captured — a genuinely organic/
 *  direct signup — so the backend stores null, never a guessed value. */
export function getSellerAcquisitionFields(): {
  acquisitionSource?: string;
  acquisitionMedium?: string;
  acquisitionCampaign?: string;
  acquisitionLandingPage?: string;
  partnerCode?: string;
} {
  const partnerCode = getPartnerCode() ?? undefined;
  const snapshot = readSnapshot();
  if (!snapshot) return partnerCode ? { partnerCode } : {};
  return {
    ...(partnerCode ? { partnerCode } : {}),
    ...(snapshot.source ? { acquisitionSource: snapshot.source } : {}),
    ...(snapshot.medium ? { acquisitionMedium: snapshot.medium } : {}),
    ...(snapshot.campaign ? { acquisitionCampaign: snapshot.campaign } : {}),
    acquisitionLandingPage: snapshot.landingPage,
  };
}

// ── Sales Ops partner referrals ─────────────────────────────────────────────
// A reseller's or agent's link carries ?partner=CODE. The FIRST partner link a
// visitor uses is kept for 60 days (a partner shouldn't lose a merchant they
// brought because the merchant later clicked someone else's link), then sent
// with the seller sign-up and the Book-a-demo form so the partner is credited.

const PARTNER_KEY = 'solvexo:partnerRef';
const PARTNER_TTL_MS = 60 * 24 * 60 * 60 * 1000;

const cleanCode = (s: string | null) => (s ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40) || null;

export function capturePartnerCode(search = typeof window === 'undefined' ? '' : window.location.search): void {
  try {
    const code = cleanCode(new URLSearchParams(search).get('partner'));
    if (!code || getPartnerCode()) return;
    localStorage.setItem(PARTNER_KEY, JSON.stringify({ code, expiresAt: Date.now() + PARTNER_TTL_MS }));
  } catch { /* storage blocked: best-effort */ }
}

export function getPartnerCode(): string | null {
  try {
    const raw = localStorage.getItem(PARTNER_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { code?: string; expiresAt?: number };
    if (!v?.code || typeof v.expiresAt !== 'number' || v.expiresAt < Date.now()) { localStorage.removeItem(PARTNER_KEY); return null; }
    return v.code;
  } catch { return null; }
}
