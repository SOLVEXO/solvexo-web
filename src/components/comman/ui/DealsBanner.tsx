import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowRight } from 'lucide-react';
import { apiGetPublicActiveCampaigns, type PublicCampaign } from '@/api/services/marketing/publicCampaigns';

// Exported so other one-off campaign banners (e.g. SellerStorefront's single-
// campaign strip) can share the exact same countdown behavior/markup instead
// of drifting into their own reimplementation.
export function useCountdown(endDate: string) {
  const [remaining, setRemaining] = useState(() => new Date(endDate).getTime() - Date.now());

  useEffect(() => {
    setRemaining(new Date(endDate).getTime() - Date.now());
    const id = setInterval(() => setRemaining(new Date(endDate).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const clamped = Math.max(0, remaining);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    expired: clamped <= 0,
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[36px] rounded-md bg-white px-2 py-1 text-center text-[16px] font-bold tabular-nums leading-none text-brand-deep-orange">
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-1 text-[7.5px] font-medium uppercase tracking-wide text-white/60">{label}</span>
    </div>
  );
}

const ROTATE_MS = 6000;
// Showing a raw low opt-in count ("1 store participating") undersells the
// sale more than it informs — below this, the line is just omitted rather
// than advertising how few sellers have joined so far. Platform-sponsored
// campaigns never hit this path (see below) since "All N stores" is never a
// weak number to show.
const MIN_STORE_COUNT_TO_SHOW = 3;

/** Platform-wide sale campaign banner for the buyer marketplace/homepage.
 * Multiple campaigns can be active at once (sellers opt their stores into a
 * platform Campaign independently) — this rotates through all of them one at
 * a time, soonest-ending first, instead of only ever showing a single one and
 * silently dropping the rest. Distinct from the admin-managed image
 * `BannerCarousel` (that's promo images; this is the structured Campaign
 * feature sellers opt their stores into).
 *
 * Fixed 3-column layout — [image] [title/meta] [countdown + CTA] — on sm+
 * screens; stacks to image-on-top / content / countdown+CTA on mobile so
 * nothing wraps or overlaps at narrow widths. The image column is only ever
 * present in the DOM when bannerImage is set (never rendered-but-hidden), so
 * a campaign with no image never leaves dead space behind. */
export function DealsBanner({ className, storeType }: { className?: string; storeType?: string }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Rotation order comes straight from the backend (admin-set Campaign.order,
    // soonest-ending as the tiebreaker) — never re-sorted client-side, so an
    // admin's chosen position actually takes effect.
    apiGetPublicActiveCampaigns(storeType)
      .then((res) => {
        if (cancelled) return;
        setCampaigns(res.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [storeType]);

  // Auto-rotate through every active campaign, one at a time — pauses while
  // the cursor is over the banner so it never changes mid-read or mid-click.
  useEffect(() => {
    if (paused || campaigns.length <= 1) return;
    const id = setInterval(() => setActiveIndex(i => (i + 1) % campaigns.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, campaigns.length]);

  useEffect(() => {
    if (activeIndex >= campaigns.length) setActiveIndex(0);
  }, [campaigns.length, activeIndex]);

  const campaign = campaigns[activeIndex] ?? null;
  const countdown = useCountdown(campaign?.endDate ?? '');

  // A campaign that expires while it's on screen is dropped from the
  // rotation instead of freezing on a dead 00:00:00 countdown.
  useEffect(() => {
    if (campaign && countdown.expired) {
      setCampaigns(prev => prev.filter(c => c._id !== campaign._id));
    }
  }, [campaign, countdown.expired]);

  if (!campaign) return null;

  const discountLabel = campaign.discountType && campaign.discountValue != null
    ? campaign.discountType === 'percentage' ? `Up to ${campaign.discountValue}% off` : `$${campaign.discountValue} off`
    : 'Special deals';

  const showStoreCount = campaign.sponsorType === 'platform' || campaign.storeCount >= MIN_STORE_COUNT_TO_SHOW;
  // "23 Stores Participating · Limited Time"-style meta line — a single
  // subtle subtitle rather than separate chips.
  const metaText = [
    campaign.sponsorType === 'platform' ? 'Sponsored by Solvexo' : null,
    showStoreCount ? (campaign.sponsorType === 'platform' ? `All ${campaign.storeCount} stores participating` : `${campaign.storeCount} stores participating`) : null,
    'Limited time',
  ].filter(Boolean).join(' · ');

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={clsx(
        'banner-slide-down relative w-full overflow-hidden border-b border-black/10 bg-gradient-to-r from-[#E07F57] to-[#EB9468] text-white',
        className,
      )}
    >
      {/* Thin top rim-light — depth via layering, not a shadow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" />
      {/* Very light grain/texture (~4% opacity) instead of a flat fill — a
          repeating micro-dot pattern, not an image asset or backdrop blur. */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[length:3px_3px]" />

      <button
        key={campaign._id}
        onClick={() => navigate(`/marketplace?campaign=${campaign._id}`)}
        className="campaign-fade group relative flex w-full flex-col items-stretch gap-2.5 border-none bg-transparent px-4 py-2.5 text-left text-white outline-none cursor-pointer transition-colors duration-150 hover:bg-white/10 sm:h-16 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-0"
      >
        {/* Column 1 — optional image, 150–160×64–68, own rounded corners +
            border, with a soft glow sitting behind it (not a box-shadow). */}
        {campaign.bannerImage && (
          <span className="relative mx-auto h-16 w-full max-w-[220px] shrink-0 sm:mx-0 sm:h-16 sm:w-[150px] lg:w-[160px]">
            <span className="pointer-events-none absolute -inset-1.5 rounded-2xl bg-[#FFB88C]/35 blur-md" />
            <span className="relative block h-full w-full overflow-hidden rounded-xl border border-white/25">
              <img src={campaign.bannerImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </span>
          </span>
        )}

        {/* Column 2 — offer pill + title (title is the dominant element) +
            a single subtle meta line beneath. */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:flex-nowrap">
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-deep-orange whitespace-nowrap">
              {discountLabel}
            </span>
            <span className="min-w-0 truncate font-serif text-[17px] font-bold tracking-[-0.01em] sm:text-[18px]">
              {campaign.name}
            </span>
          </div>
          <p className="truncate text-[11.5px] text-white/75">{metaText}</p>
        </div>

        {/* Column 3 — countdown + CTA grouped as one visual unit, right-
            aligned on sm+, centered on mobile. */}
        <div className="flex shrink-0 items-center justify-center gap-3 sm:justify-end">
          <div className="flex shrink-0 items-center gap-1.5">
            {countdown.days > 0 && <><CountdownUnit value={countdown.days} label="d" /><span className="pb-3 text-white/50">:</span></>}
            <CountdownUnit value={countdown.hours} label="hrs" />
            <span className="pb-3 text-white/50">:</span>
            <CountdownUnit value={countdown.minutes} label="min" />
            <span className="pb-3 text-white/50">:</span>
            <CountdownUnit value={countdown.seconds} label="sec" />
          </div>

          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-brand-deep-orange transition-colors duration-150 group-hover:bg-cream">
            <span>Shop the Sale</span>
            <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>

      {/* Carousel indicators — subtle overlay along the bottom-center, not
          their own row (so they add no extra height) and deliberately NOT in
          a bottom corner — the countdown/CTA column sits right up against the
          right edge on sm+, so a bottom-right placement used to render the
          dots underneath/behind the "Shop the Sale" button instead of
          visible next to it. */}
      {campaigns.length > 1 && (
        <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {campaigns.map((c, i) => (
            <button
              key={c._id}
              onClick={e => { e.stopPropagation(); setActiveIndex(i); }}
              aria-label={`Show ${c.name}`}
              aria-current={i === activeIndex}
              className="pointer-events-auto relative w-4 h-4 flex items-center border-none bg-transparent cursor-pointer"
            >
              <span className="relative block h-[3px] w-full rounded-full bg-white/20 overflow-hidden">
                <span
                  className={clsx(
                    'absolute inset-y-0 left-0 rounded-full bg-white',
                    i < activeIndex ? 'w-full' : i > activeIndex ? 'w-0' : 'campaign-progress-fill',
                  )}
                  style={i === activeIndex ? { animationDuration: `${ROTATE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' } : undefined}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
