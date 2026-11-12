import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox } from '@/components/comman/ui';
import { ArrowRight, GraduationCap, Palette, Store, Gem, Briefcase, Building2, Gift, Hammer, Download, Sparkles, BarChart2, Monitor, CreditCard, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiGetPlatformStats, type PlatformStats } from '@/api/services/store';
import { Reveal, RevealStagger } from '@/components/comman/motion/Reveal';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { ClipReveal } from '@/components/comman/motion/ClipReveal';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { AnimatedCounter } from '@/components/comman/motion/AnimatedCounter';
import { TiltPreview } from '@/components/comman/motion/TiltPreview';
import { Marquee } from '@/components/comman/motion/Marquee';
import { SellerDashboardPreview } from '@/components/comman/mockups/ProductMockups';
import { salesMailto } from '@/utils/contact';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { FOR_SELLERS_TEXT } from './ForSellersPage.text';

const compactNumber   = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const compactCurrency = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: 'USD' });

const SERIF = "'Lora', Georgia, serif";

// Text (titles, descriptions, buttons) lives in ForSellersPage.text.ts in the same order.
const SELLER_TYPE_ICONS: LucideIcon[] = [GraduationCap, Palette, Store, Gem, Briefcase, Building2];
// The last seller type ("Schools & Districts") opens a sales email instead of sign-up.
const CONTACT_SELLER_TYPE = SELLER_TYPE_ICONS.length - 1;

const FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Gift,        title: 'Loyalty & Rewards',    desc: 'Give buyers points, tiers and perks that keep them coming back.' },
  { Icon: Hammer,      title: 'Custom Storefront',    desc: 'Your brand, your domain, your store.'              },
  { Icon: Download,    title: 'Digital Delivery',     desc: 'Instant file delivery for digital products.'       },
  { Icon: Sparkles,    title: 'AI SEO suggestions',   desc: 'AI proposes page titles and descriptions. You approve each one.' },
  { Icon: BarChart2,   title: 'Analytics',            desc: 'Real-time sales data and customer insights.'       },
  { Icon: Monitor,     title: 'Point of Sale',        desc: 'Accept payments in person with our mobile POS.'   },
  { Icon: CreditCard,  title: 'Fast Payouts',         desc: 'Get paid within 2 business days, every time.'     },
  { Icon: Lock,        title: 'Seller Protection',    desc: 'Fraud protection and dispute resolution support.'  },
];
const FEATURE_ICONS: LucideIcon[] = [Gift, Hammer, Download, Sparkles, BarChart2, Monitor, CreditCard, Lock];

export function ForSellersPage() {
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  const t = useSiteText(FOR_SELLERS_TEXT);
  const { pageLang } = useSiteLang();
  usePageTitle(t.pageTitle);

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetPlatformStats()
      .then(res => { if (!cancelled) setStats(res.data); })
      .catch(() => { /* non-critical — stat strip just stays hidden */ })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const statItems = stats ? [
    { value: stats.sellersCount, format: (n: number) => `${compactNumber.format(n)}+`, label: t.statActiveSellers },
    { value: stats.gmv,          format: (n: number) => `${compactCurrency.format(n)}+`, label: t.statGmv },
    { value: stats.buyersCount,  format: (n: number) => `${compactNumber.format(n)}+`,  label: t.statBuyers },
    { value: stats.ratingCount > 0 ? stats.avgRating : null, format: (n: number) => `${n.toFixed(1)} ★`, label: t.statRating },
  ] : [];

  return (
    <div className="bg-white min-h-full">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-10 md:pb-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #141413 0%, #2C2A28 100%)' }}
      >
        <div className="absolute rounded-full w-[400px] h-[400px] bg-brand-orange opacity-[0.08] -top-[80px] -right-[80px]" />
        <div className="absolute rounded-full w-[300px] h-[300px] bg-brand-deep-orange opacity-[0.06] -bottom-[60px] left-[40%]" />

        {/* Asymmetric two-column hero — copy left, a real (tilted, cursor-
           reactive) seller-dashboard preview right, instead of a centered
           text block with nothing to look at beside it. */}
        <div className="max-w-[1180px] mx-auto relative z-[1] grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-start">
            {/* Was `stats ? real : '50,000+'` — a fabricated, specific-
               looking fallback number shown as real on every first paint
               (stats loads async) and on any API failure. Hidden instead
               until the real count actually loads, matching this same
               page's own stats-strip further down. */}
            {stats && (
              <Reveal delay={0}>
                <div className="inline-flex items-center gap-2 bg-[rgba(217,119,87,0.15)] border border-[rgba(217,119,87,0.3)] rounded-[20px] px-[14px] py-[5px] mb-6">
                  <span className="text-[12px] text-brand-orange font-medium">
                    {t.trustedBy(compactNumber.format(stats.sellersCount))}
                  </span>
                </div>
              </Reveal>
            )}

            <h1 className="block text-3xl md:text-5xl lg:text-[46px] font-bold text-white leading-[1.15] mb-5" style={{ fontFamily: SERIF }}>
              <ClipReveal as="div" delay={0.06}>{t.heroLine1}</ClipReveal>
              {/* The two lines are inline blocks; the shorter Arabic lines would otherwise sit side by side. */}
              {pageLang === 'ar' && <br />}
              <ClipReveal as="div" delay={0.18}>{t.heroWith} Solvex<span className="text-brand-orange">o</span>.</ClipReveal>
            </h1>

            <Reveal delay={0.16}>
              <p className="text-sm md:text-[17px] text-[#b0aea8] leading-[1.7] max-w-[480px] mx-auto lg:mx-0 mb-9">
                {t.heroIntro1}
                {' '}{t.heroIntro2}
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <MagneticButton>
                  <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading}>
                    {t.startForFree} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
                  </Button>
                </MagneticButton>
                <button
                  onClick={() => navigate('/pricing')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
                >
                  {t.seePricing}
                </button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.3} className="hidden lg:block">
            <TiltPreview>
              <SellerDashboardPreview />
            </TiltPreview>
          </Reveal>
        </div>
      </div>

      {/* ── Seller Types — an alternating light/dark rhythm instead of six
         identical white cards, so the grid reads as intentional composition
         rather than a repeated template tile. ── */}
      <div className="px-4 md:px-8 lg:px-12 py-12 md:py-[72px] bg-cream">
        <div className="max-w-[1100px] mx-auto">
          <SectionHeading kicker={t.typesKicker} title={t.typesTitle} align="center" className="mb-12" size="lg" />
          <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" step={0.08} y={20}>
            {t.sellerTypes.map((s, i) => {
              const featured = i % 3 === 0;
              const Icon = SELLER_TYPE_ICONS[i];
              return (
                <PremiumCard key={i} tone={featured ? 'dark' : 'light'} className="p-7">
                  <Icon size={36} className="block mb-4 text-brand-orange" />
                  <p className={featured ? 'text-[17px] font-bold text-white mb-2' : 'text-[17px] font-bold text-carbon mb-2'}>{s.title}</p>
                  <p className={featured ? 'text-[13px] text-white/65 leading-[1.7] mb-5' : 'text-[13px] text-slate leading-[1.7] mb-5'}>{s.desc}</p>
                  <Button
                    variant={featured ? 'primary' : 'secondary'} size="sm"
                    onClick={() => i === CONTACT_SELLER_TYPE
                      ? (window.location.href = salesMailto('Institutional Account Inquiry'))
                      : sellEntry.go()}
                  >
                    {s.cta} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
                  </Button>
                </PremiumCard>
              );
            })}
          </RevealStagger>
        </div>
      </div>

      {/* ── Feature Highlights — a slow, continuous strip instead of an
         8-up card grid. Supporting content gets the quieter, ambient motion
         tier (a marquee that pauses on hover) rather than another staggered
         card reveal identical to the section above it. ── */}
      <div className="py-12 md:py-[72px] bg-white overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 lg:px-12">
          <SectionHeading title={t.featuresTitle} subtitle={t.featuresSubtitle} align="center" className="mb-12" size="lg" />
        </div>
        {/* The marquee track scrolls in a left-to-right box (its -50% loop only works that way); each card keeps the page direction. */}
        <div dir="ltr">
        <Marquee duration={38}>
          {t.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
            <div key={i} dir={pageLang === 'ar' ? 'rtl' : undefined} className="flex items-center gap-3 rounded-2xl border border-bone bg-cream px-5 py-4 mx-2.5 w-[280px] shrink-0">
              <span className="w-10 h-10 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
                <Icon size={19} className="text-brand-orange" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-carbon mb-[2px]">{f.title}</p>
                <p className="text-[11.5px] text-slate leading-[1.5] truncate">{f.desc}</p>
              </div>
            </div>
            );
          })}
        </Marquee>
        </div>
      </div>

      {/* ── Social Proof ─────────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 lg:px-12 py-12 md:py-[72px] bg-cream border-t border-bone">
        <div className="max-w-[1100px] mx-auto">
          {(statsLoading || statItems.length > 0) && (
            <RevealStagger className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center mb-12" step={0.08} y={14}>
              {statsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <SkeletonBox width={70} height={32} className="mb-2 mx-auto" />
                      <SkeletonBox width={90} height={13} className="mx-auto" />
                    </div>
                  ))
                : statItems.map(s => (
                    <div key={s.label} className="text-center">
                      {/* Left-to-right so "1.2K+" keeps its plus sign after the number in Arabic. */}
                      <div dir="ltr">
                      {s.value === null
                        ? <p className="block text-[32px] font-bold text-brand-orange">—</p>
                        : <AnimatedCounter value={s.value} format={s.format} className="block text-[32px] font-bold text-brand-orange" />}
                      </div>
                      <p className="text-[13px] text-slate">{s.label}</p>
                    </div>
                  ))}
            </RevealStagger>
          )}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="bg-carbon px-4 md:px-8 lg:px-12 py-12 md:py-[72px] text-center">
        <SectionHeading title={t.ctaTitle} subtitle={t.ctaSubtitle} tone="dark" align="center" size="lg" className="mb-9" />
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <MagneticButton>
              <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading}>
                {t.createFreeAccount} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
              </Button>
            </MagneticButton>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
            >
              {t.seeAllPlans}
            </button>
          </div>
          <p className="mt-3 text-[12.5px] text-[#d7d4cc] hover:text-white">{t.preferWalkthrough} <button type="button" onClick={() => navigate('/book-demo')} className="font-semibold underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer text-inherit">{t.bookFreeDemo}</button></p>
        </Reveal>
      </div>
    </div>
  );
}
