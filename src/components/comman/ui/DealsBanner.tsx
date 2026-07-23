import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Zap, ArrowRight, Store } from 'lucide-react';
import { apiGetPublicActiveCampaigns, type PublicCampaign } from '@/api/services/marketing/publicCampaigns';

function useCountdown(endDate: string) {
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

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[30px] rounded-md bg-white px-1.5 py-[3px] text-center text-[13px] font-bold tabular-nums leading-none text-brand-deep-orange">
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-[3px] text-[8.5px] font-medium uppercase tracking-wide text-white/70">{label}</span>
    </div>
  );
}

const ROTATE_MS = 6000;

/** Platform-wide sale campaign banner for the buyer marketplace/homepage.
 * Multiple campaigns can be active at once (sellers opt their stores into a
 * platform Campaign independently) — this rotates through all of them one at
 * a time, soonest-ending first, instead of only ever showing a single one and
 * silently dropping the rest. Distinct from the admin-managed image
 * `BannerCarousel` (that's promo images; this is the structured Campaign
 * feature sellers opt their stores into). */
export function DealsBanner({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetPublicActiveCampaigns()
      .then((res) => {
        if (cancelled) return;
        const sorted = [...res.data].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        setCampaigns(sorted);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`banner-slide-down relative w-full overflow-hidden border-b border-black/10 bg-gradient-to-r from-brand-orange to-[#F0A57A] text-white ${className ?? ''}`}
    >
      {/* Thin top rim-light — depth via layering, not a shadow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" />

      <button
        key={campaign._id}
        onClick={() => navigate('/marketplace')}
        className="campaign-fade group relative flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left text-white outline-none cursor-pointer transition-colors duration-150 hover:bg-white/10 sm:gap-4"
      >
        {/* Icon badge — small "live" pulse dot signals an active, ticking sale */}
        <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Zap size={14} className="fill-white text-white" />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-success ring-2 ring-brand-deep-orange">
            <span className="absolute inset-0 rounded-full bg-success animate-ping" />
          </span>
        </span>

        {/* Campaign name + discount pill */}
        <span className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <span className="shrink-0 font-serif text-[14.5px] font-bold tracking-[-0.01em] whitespace-nowrap">{campaign.name}</span>
          <span className="hidden shrink-0 rounded-full bg-white px-2 py-[2px] text-[11px] font-semibold text-brand-deep-orange whitespace-nowrap sm:inline-block">
            {discountLabel}
          </span>
          <span className="hidden items-center gap-1 text-[12px] text-white/80 whitespace-nowrap md:flex">
            <Store size={12} className="shrink-0" />
            {campaign.storeCount} store{campaign.storeCount === 1 ? '' : 's'} participating
          </span>
        </span>

        {/* Live countdown */}
        <span className="hidden shrink-0 items-center gap-1 sm:flex">
          {countdown.days > 0 && <><CountdownUnit value={countdown.days} label="d" /><span className="pb-3 text-white/50">:</span></>}
          <CountdownUnit value={countdown.hours} label="hrs" />
          <span className="pb-3 text-white/50">:</span>
          <CountdownUnit value={countdown.minutes} label="min" />
          <span className="pb-3 text-white/50">:</span>
          <CountdownUnit value={countdown.seconds} label="sec" />
        </span>

        {/* CTA */}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-[6px] text-[12.5px] font-bold text-brand-deep-orange transition-transform duration-150 group-hover:scale-[1.03] sm:ml-0">
          <span className="hidden sm:inline">Shop the Sale</span>
          <span className="sm:hidden">Shop</span>
          <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      </button>

      {/* Segmented progress bar — Stories-style: fills over the rotation
          interval instead of a row of dots, so it also communicates the
          auto-advance timing. Only shown when more than one campaign is active. */}
      {campaigns.length > 1 && (
        <div className="relative flex items-center justify-center gap-[5px] pb-[7px]">
          {campaigns.map((c, i) => (
            <button
              key={c._id}
              onClick={e => { e.stopPropagation(); setActiveIndex(i); }}
              aria-label={`Show ${c.name}`}
              aria-current={i === activeIndex}
              className="relative h-[3px] w-6 rounded-full bg-white/30 overflow-hidden border-none cursor-pointer"
            >
              <span
                className={clsx(
                  'absolute inset-y-0 left-0 rounded-full bg-white',
                  i < activeIndex ? 'w-full' : i > activeIndex ? 'w-0' : 'campaign-progress-fill',
                )}
                style={i === activeIndex ? { animationDuration: `${ROTATE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' } : undefined}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
