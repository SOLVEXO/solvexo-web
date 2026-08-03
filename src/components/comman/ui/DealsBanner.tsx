import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowRight, Zap, Gift } from 'lucide-react';
import { apiGetPublicActiveCampaigns, type PublicCampaign } from '@/api/services/marketing/publicCampaigns';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { currencySymbol } from '@/utils/currency';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';

// Exported so other one-off campaign banners can share the exact same
// countdown behavior/markup instead of drifting into their own reimplementation.
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

export function CountdownUnit({ value, label, size = 'md' }: { value: number; label: string; size?: 'md' | 'sm' }) {
  const isSm = size === 'sm';
  return (
    <div className="flex flex-col items-center gap-[4px]">
      <div
        className={clsx(
          'flex items-center justify-center rounded-[10px] border border-white/15 bg-white font-bold tabular-nums leading-none text-brand-deep-orange',
          isSm ? 'w-[38px] h-[40px] text-[15px]' : 'w-[50px] h-[52px] text-[21px]',
        )}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span className={clsx('font-semibold uppercase tracking-[0.06em] text-white/70', isSm ? 'text-[7px]' : 'text-[8.5px]')}>{label}</span>
    </div>
  );
}

// ── Campaign image — the banner's hero visual. object-contain inside a
// bounded "showcase" panel (never a bare floating image), with a graceful
// fallback (a plain decorative icon, not a fake photo) when there's no real
// image or it fails to load. Local error state is keyed by campaign id at the
// call site, so switching campaigns doesn't get stuck on a stale error. ──
function CampaignImage({ src }: { src: string | null }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-pale-orange">
          <Gift size={26} className="text-brand-orange" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={cloudinaryUrl(src, 500)}
      srcSet={cloudinarySrcSet(src, [250, 500, 750])}
      sizes="(min-width: 1024px) 230px, 170px"
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className="max-h-full max-w-full object-contain rounded-[10px] transition-transform duration-300 ease-out group-hover:scale-[1.03]"
    />
  );
}

const ROTATE_MS = 6000;
// Showing a raw low opt-in count ("1 store participating") undersells the
// sale more than it informs — below this, the line is just omitted rather
// than advertising how few sellers have joined so far. Platform-sponsored
// campaigns never hit this path (see below) since "All N stores" is never a
// weak number to show.
const MIN_STORE_COUNT_TO_SHOW = 3;

/** Platform-wide sale campaign banner for the buyer marketplace/homepage —
 * a compact (~180px), full-width, Alibaba/Daraz/Temu-style event strip, not
 * a tall hero. Multiple campaigns can be active at once (sellers opt their
 * stores into a platform Campaign independently) — this rotates through all
 * of them one at a time, soonest-ending first, instead of only ever showing
 * a single one and silently dropping the rest. Distinct from the
 * admin-managed image `BannerCarousel` (that's promo images; this is the
 * structured Campaign feature sellers opt their stores into).
 *
 * Desktop is a fixed-height 40/35/25 three-column layout — campaign copy,
 * then the product image in its own showcase panel (bled slightly past the
 * card's top edge for emphasis), then countdown + CTA. Below lg it stacks to
 * one column (text → image → countdown), growing to fit instead of forcing
 * the same fixed height. */
export function DealsBanner({ className, storeType, compact = false }: {
  className?: string;
  storeType?: string;
  /** Forces the single-column mobile-style stack (text → image → countdown)
   *  regardless of viewport width, and drops the built-in page gutters/fixed
   *  height — for embedding inside a narrower host layout (e.g. Marketplace's
   *  WelcomeStrip hero cell) instead of as its own full-width page section. */
  compact?: boolean;
}) {
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
        setCampaigns(res.data ?? []);
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

  const { currency: displayCurrency, convert } = useCurrencyPreference();
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

  const hasPercentOff = campaign.discountType === 'percentage' && campaign.discountValue != null;
  const hasFixedOff = campaign.discountType === 'fixed' && campaign.discountValue != null;
  const displayedFixedOff = hasFixedOff ? convert(campaign.discountValue as number, campaign.currency ?? 'USD') : null;
  const discountHeadline = hasPercentOff
    ? `UP TO ${campaign.discountValue}% OFF`
    : hasFixedOff
      ? `${currencySymbol(displayCurrency)}${displayedFixedOff} OFF`
      : 'SPECIAL DEALS';

  const showStoreCount = campaign.sponsorType === 'platform' || campaign.storeCount >= MIN_STORE_COUNT_TO_SHOW;
  const metaText = [
    campaign.sponsorType === 'platform' ? 'Sponsored by Solvexo' : null,
    showStoreCount ? (campaign.sponsorType === 'platform' ? `All ${campaign.storeCount} stores participating` : `${campaign.storeCount} stores participating`) : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={clsx('banner-slide-down', compact ? undefined : 'px-4 sm:px-6 lg:px-10 pt-3', className)}
    >
      {/* No overflow-hidden on this outer layer in the default (non-compact)
          layout — the product image is allowed to bleed slightly past the
          card's own top edge for visual emphasis there. Compact mode has no
          such bleed (see the CENTER column below), so it clips normally —
          without that, stacked content taller than the host's own height
          assumption would spill out past the visible rounded card. */}
      <div className={clsx('relative w-full h-full transition-transform duration-200 hover:-translate-y-[2px]', compact && 'overflow-hidden rounded-[20px]')}>
        <div className="absolute inset-0 overflow-hidden rounded-[20px] border border-black/10">
          <div className="gradient-drift absolute inset-0 bg-gradient-to-br from-[#D97757] via-[#E28B63] to-[#F3A27A]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[length:16px_16px]" />
          <div className="pointer-events-none absolute -top-10 left-[38%] size-40 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 right-[20%] size-48 rounded-full bg-[#7A3520]/25 blur-3xl" />
          {/* Thin vertical separators between the 3 columns — desktop only, there's no room below lg. Not part of the compact (forced single-column) layout. */}
          {!compact && (
            <>
              <div className="pointer-events-none hidden lg:block absolute inset-y-6 left-[40%] w-px bg-white/15" />
              <div className="pointer-events-none hidden lg:block absolute inset-y-6 left-[75%] w-px bg-white/15" />
            </>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" />
        </div>

        {compact ? (
          /* Compact: a clean, full, un-cropped image — no headline/
             description/countdown text overlaid on top of it, since the
             image itself is the entire point of this placement. */
          <button
            key={campaign._id}
            onClick={() => navigate(`/marketplace?campaign=${campaign._id}`)}
            className="group relative z-[1] flex w-full h-full items-center justify-center border-none bg-transparent p-4 outline-none cursor-pointer"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <CampaignImage src={campaign.bannerImage} />
              {hasPercentOff && (
                <span className="absolute -top-2 -left-2 -rotate-6 flex flex-col items-center justify-center size-[42px] rounded-full bg-error text-white border-2 border-white/40">
                  <span className="text-[11px] font-bold leading-none">-{campaign.discountValue}%</span>
                  <span className="text-[5px] font-semibold uppercase tracking-wide leading-none mt-[1px]">off</span>
                </span>
              )}
            </div>
          </button>
        ) : (
          <button
            key={campaign._id}
            onClick={() => navigate(`/marketplace?campaign=${campaign._id}`)}
            className="campaign-fade group relative z-[1] grid w-full h-full gap-4 border-none bg-transparent text-left text-white outline-none cursor-pointer px-5 py-5 sm:px-7 sm:py-6 grid-cols-1 lg:grid-cols-[40%_35%_25%] lg:gap-0 lg:px-8 lg:py-0 lg:h-[188px]"
          >
            {/* LEFT (40%) — badge, huge discount, title, description, meta, CTA.
                5 text elements max, one line each — everything stays legible
                inside a ~180px-tall card instead of sprawling. */}
            <div className="flex min-w-0 flex-col justify-center gap-[5px] lg:pr-6">
              <span className="inline-flex w-fit items-center gap-[5px] rounded-full bg-white px-[10px] py-[5px] text-[10px] font-bold uppercase tracking-wide text-brand-deep-orange whitespace-nowrap">
                <Zap size={11} className="fill-brand-deep-orange" /> Limited Time
              </span>
              <span className="font-serif text-[26px] sm:text-[29px] lg:text-[31px] font-bold leading-[1.05] tracking-[-0.01em] text-white">
                {discountHeadline}
              </span>
              <span className="min-w-0 truncate text-[14px] sm:text-[15px] font-bold">{campaign.name}</span>
              <p className="truncate text-[12px] text-white/85">{campaign.description || 'Limited time campaign'}</p>
              {metaText && (
                <p className="truncate text-[10.5px] font-medium text-white/65">{metaText}</p>
              )}
              <span className="mt-[3px] inline-flex w-fit items-center gap-[6px] text-[13px] font-bold text-white underline-offset-4 group-hover:underline">
                Shop Now <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </div>

            {/* CENTER (35%) — the product image as a bounded showcase panel
                (never a bare floating image), bled slightly past the card's
                top edge on desktop so it reads as the banner's focal point. */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full h-[130px] sm:h-[150px] lg:mt-[-14px] lg:h-[calc(100%+14px)] lg:max-w-[230px] rounded-[14px] border border-white/15 bg-white/10 backdrop-blur-sm p-2">
                <CampaignImage src={campaign.bannerImage} />

                {hasPercentOff && (
                  <span className="absolute -top-2 -left-2 -rotate-6 flex flex-col items-center justify-center size-[42px] rounded-full bg-error text-white border-2 border-white/40">
                    <span className="text-[11px] font-bold leading-none">-{campaign.discountValue}%</span>
                    <span className="text-[5px] font-semibold uppercase tracking-wide leading-none mt-[1px]">off</span>
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT (25%) — countdown + CTA */}
            <div className="flex flex-col items-center justify-center gap-3 lg:pl-6">
              <div className="countdown-pulse flex shrink-0 items-center gap-[6px]">
                <CountdownUnit value={countdown.hours} label="hrs" size="sm" />
                <span className="pb-4 text-white/40">:</span>
                <CountdownUnit value={countdown.minutes} label="min" size="sm" />
                <span className="pb-4 text-white/40">:</span>
                <CountdownUnit value={countdown.seconds} label="sec" size="sm" />
              </div>
              <span className="flex shrink-0 items-center gap-[7px] rounded-full bg-white px-6 py-[10px] text-[13px] font-bold text-brand-deep-orange transition-[background-color,transform] duration-150 group-hover:bg-cream group-hover:scale-[1.03]">
                Shop the Sale
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/60">Ends Soon</span>
            </div>
          </button>
        )}

        {/* Carousel indicators — a bit bigger/more visible than a subtle hairline,
            still along the bottom-center so they add no extra height. */}
        {campaigns.length > 1 && (
          <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-[6px] z-[1]">
            {campaigns.map((c, i) => (
              <button
                key={c._id}
                onClick={e => { e.stopPropagation(); setActiveIndex(i); }}
                aria-label={`Show ${c.name}`}
                aria-current={i === activeIndex}
                className="pointer-events-auto relative w-7 h-5 flex items-center border-none bg-transparent cursor-pointer"
              >
                <span className="relative block h-[5px] w-full rounded-full border border-black/10 bg-white/25 overflow-hidden">
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
    </div>
  );
}
