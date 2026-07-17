import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, Store } from 'lucide-react';
import { apiGetPublicActiveCampaigns, type PublicCampaign } from '@/api/services/marketing/publicCampaigns';

function useCountdown(endDate: string) {
  const [remaining, setRemaining] = useState(() => new Date(endDate).getTime() - Date.now());

  useEffect(() => {
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
      <div className="min-w-[26px] rounded-md bg-white/10 px-1.5 py-[3px] text-center text-[13px] font-bold tabular-nums leading-none ring-1 ring-white/15">
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-[3px] text-[8.5px] font-medium uppercase tracking-wide text-white/50">{label}</span>
    </div>
  );
}

/** Platform-wide sale campaign banner for the buyer marketplace/homepage —
 * shows the soonest-ending active campaign, if any. Distinct from the
 * admin-managed image `BannerCarousel` (that's promo images; this is the
 * structured Campaign feature sellers opt their stores into). */
export function DealsBanner({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetPublicActiveCampaigns()
      .then((res) => {
        if (cancelled || !res.data.length) return;
        const soonest = [...res.data].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0];
        setCampaign(soonest);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const countdown = useCountdown(campaign?.endDate ?? '');

  if (!campaign || countdown.expired) return null;

  const discountLabel = campaign.discountType && campaign.discountValue != null
    ? campaign.discountType === 'percentage' ? `Up to ${campaign.discountValue}% off` : `$${campaign.discountValue} off`
    : 'Special deals';

  return (
    <div
      className={`banner-slide-down relative w-full overflow-hidden border-b border-black/10 bg-gradient-to-r from-brand-deep-orange via-brand-orange to-[#F2A65A] text-white shadow-md ${className ?? ''}`}
    >
      {/* Glossy top rim-light — subtle depth, matches the elevated-surface feel of shadow-card panels */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
      {/* Dot-grid texture — consistent with the auth branding panel treatment */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}
      />
      {/* Ambient glow accents — warm gold + soft white, richer than a flat two-tone fill */}
      <div className="pointer-events-none absolute -top-10 left-[22%] size-24 rounded-full bg-warning/40 blur-3xl auth-glow-pulse" />
      <div className="pointer-events-none absolute -bottom-14 right-[12%] size-28 rounded-full bg-white/20 blur-3xl" />
      {/* Shimmer sweep — reads as "live sale" */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 banner-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" />

      <button
        onClick={() => navigate('/marketplace')}
        className="group relative flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left text-white outline-none cursor-pointer transition-colors duration-150 hover:bg-white/10 sm:gap-4"
      >
        {/* Icon badge — small "live" pulse dot signals an active, ticking sale */}
        <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
          <Zap size={14} className="fill-white text-white" />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-success ring-2 ring-brand-deep-orange">
            <span className="absolute inset-0 rounded-full bg-success animate-ping" />
          </span>
        </span>

        {/* Campaign name + discount pill */}
        <span className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <span className="shrink-0 font-serif text-[14.5px] font-bold tracking-[-0.01em] whitespace-nowrap">{campaign.name}</span>
          <span className="hidden shrink-0 rounded-full bg-carbon/25 px-2 py-[2px] text-[11px] font-semibold text-white whitespace-nowrap ring-1 ring-white/25 sm:inline-block">
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
        <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-[6px] text-[12.5px] font-bold text-brand-deep-orange shadow-sm transition-transform duration-150 group-hover:scale-[1.03] sm:ml-0">
          <span className="hidden sm:inline">Shop the Sale</span>
          <span className="sm:hidden">Shop</span>
          <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      </button>
    </div>
  );
}
