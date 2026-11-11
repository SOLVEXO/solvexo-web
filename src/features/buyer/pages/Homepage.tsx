import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { Avatar } from '@/components/comman/ui/Avatar';
// Direct imports, not the '@/components/comman/ui' index: that index also re-exports the map picker, phone input and
// chart cards, and importing it made the home page download those libraries.
import { Footer } from '@/components/comman/ui/Footer';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import {
  ArrowRight, Store, Sparkles, Check,
  Star, BadgeCheck, Quote,
  BarChart3, UserPlus, Link2, Rows3, TrendingUp,
} from 'lucide-react';
import { apiGetTestimonials, type Testimonial } from '@/api/services/testimonials';
import { apiGetPlatformStats, type PlatformStats } from '@/api/services/store';
import { Reveal, RevealStagger } from '@/components/comman/motion/Reveal';
import { HomeHeroLight } from '@/features/buyer/components/HomeHeroLight';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { SplitText } from '@/components/comman/motion/SplitText';
import { Marquee } from '@/components/comman/motion/Marquee';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { AnimatedCounter } from '@/components/comman/motion/AnimatedCounter';
import {
  StorefrontPreview, POSPreview, SellerDashboardPreview, MobileStorePreview, mockupForProductSlug, PRODUCT_ICONS,
} from '@/components/comman/mockups/ProductMockups';
import { PLATFORM_PRODUCTS, getPlatformProduct } from '@/features/buyer/data/platformProducts';
import { SOLUTIONS } from '@/features/buyer/data/solutions';
import { stockPhotoAlt, unsplashUrl } from '@/assets/stockPhotos';
import { motion, useReducedMotion, useInView, AnimatePresence } from 'motion/react';
import { localizeProduct, localizeSolution } from '@/features/buyer/data/localizedData';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { HOMEPAGE_TEXT } from './Homepage.text';

const compactNumber   = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const compactCurrency = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: 'USD' });

function TestimonialCardBody({ t }: { t: Testimonial }) {
  const text = useSiteText(HOMEPAGE_TEXT);
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-[2px]">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={13} className={i <= Math.round(t.rating) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'} />
          ))}
        </div>
        <Quote size={22} className="text-brand-orange/20 fill-brand-orange/20 shrink-0" />
      </div>
      <p className="text-[13.5px] text-charcoal leading-[1.75] mb-4 italic">"{t.text}"</p>
      <div className="flex items-center gap-[10px] pt-3 border-t border-bone">
        <Avatar name={t.name} size={32} />
        <div>
          <div className="flex items-center gap-[6px]">
            <p className="text-[13.5px] font-semibold text-carbon">{t.name}</p>
            {t.isVerifiedSeller && <BadgeCheck size={13} className="text-info fill-info/15 shrink-0" />}
          </div>
          <p className="text-[11px] text-slate">{t.storeName ? text.owner(t.storeName) : text.verifiedSeller}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * "Spotlight carousel with side peek" — one focused testimonial in the
 * center (the new one dropping in from above each cycle, via
 * AnimatePresence), the previous/next ones dimmed and peeking at the edges.
 * Auto-advances every 4s, same pause-on-hover-ref pattern this page's other
 * auto-cyclers (explorer tabs, system diagram, POS steps) already use.
 * Replaces the earlier marquee treatment — a deliberately calmer, more
 * "curated" feel than a continuously-scrolling strip.
 */
function TestimonialSpotlight({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const text = useSiteText(HOMEPAGE_TEXT);

  useEffect(() => {
    if (reduceMotion || testimonials.length <= 1) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setIndex(i => (i + 1) % testimonials.length);
    }, 4200);
    return () => clearInterval(id);
  }, [reduceMotion, testimonials.length]);

  const n = testimonials.length;
  const active = testimonials[index];
  const prev = n > 1 ? testimonials[(index - 1 + n) % n] : null;
  const next = n > 1 ? testimonials[(index + 1) % n] : null;

  return (
    <div
      className="relative h-[300px] sm:h-[320px] flex items-center justify-center"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Left peek — the one that just left the spotlight */}
      {prev && (
        <div className="hidden sm:block absolute left-1/2 -translate-x-[calc(50%+250px)] w-[300px] opacity-30 blur-[1.5px] scale-[0.82] pointer-events-none transition-[opacity,filter] duration-500">
          <Card padding="none" className="overflow-hidden"><TestimonialCardBody t={prev} /></Card>
        </div>
      )}
      {/* Right peek — the one coming up next */}
      {next && (
        <div className="hidden sm:block absolute left-1/2 translate-x-[calc(-50%+250px)] w-[300px] opacity-30 blur-[1.5px] scale-[0.82] pointer-events-none transition-[opacity,filter] duration-500">
          <Card padding="none" className="overflow-hidden"><TestimonialCardBody t={next} /></Card>
        </div>
      )}
      {/* Center spotlight — the active card genuinely mounts fresh each
         cycle (key={t.id}), so it always plays its own top-drop-in entrance
         rather than sliding over from a side. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          className="relative z-10 w-[300px] sm:w-[360px]"
          initial={{ opacity: 0, y: -46, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.94 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card padding="none" className="overflow-hidden shadow-[0_20px_45px_rgba(28,25,23,0.14)]">
            <div className="h-[3px] bg-gradient-to-r from-brand-orange to-[#f0a57a]" />
            <TestimonialCardBody t={active} />
          </Card>
        </motion.div>
      </AnimatePresence>
      {/* Progress dots — real position indicator, not just decoration. */}
      {n > 1 && (
        <div className="absolute -bottom-2 sm:bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-[6px]">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setIndex(i)}
              aria-label={text.showTestimonial(t.name)}
              className={clsx(
                'h-[6px] rounded-full border-none cursor-pointer transition-all duration-300 p-0',
                i === index ? 'w-5 bg-brand-orange' : 'w-[6px] bg-bone hover:bg-brand-orange/40',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Icons of the "How Solvexo works" steps; the step names and descriptions are HOMEPAGE_TEXT.howSteps, same order.
const HOW_IT_WORKS_ICONS = [Store, Link2, Rows3, TrendingUp] as const;

const EXPLORER_SLUGS = ['analytics', 'inventory', 'orders-customers'] as const;
// Search → cart → payment → receipt; labels in HOMEPAGE_TEXT.posSteps.
const POS_STEP_COUNT = 4;

// ── "One business. One connected system." — a hub-and-spoke diagram whose
// nodes light up in sequence on scroll-in, then keep auto-cycling one at a
// time (pause on hover, click jumps straight there) — each active node
// drives a real preview panel below it, so the diagram isn't just
// decoration, it's the same tabbed-explorer pattern used elsewhere on the
// page, staged as a system map instead of a row of tabs. Every node is
// still a real, working link to its /products/:slug page. ──
function ConnectedSystemDiagram({ onNavigate, activeIndex, onHover, onLeave }: {
  onNavigate: (slug: string) => void;
  activeIndex: number;
  onHover: (i: number) => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const text = useSiteText(HOMEPAGE_TEXT);
  const { pageLang } = useSiteLang();
  const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

  const positions = PLATFORM_PRODUCTS.map((_, i) => {
    const angle = (-90 + i * (360 / PLATFORM_PRODUCTS.length)) * (Math.PI / 180);
    return { x: 50 + 38 * Math.cos(angle), y: 50 + 40 * Math.sin(angle) };
  });

  return (
    <div ref={ref} className="relative w-full max-w-[720px] mx-auto aspect-[4/3.4]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
        {positions.map((pos, i) => (
          <motion.line
            key={i}
            x1={50} y1={50} x2={pos.x} y2={pos.y}
            stroke="var(--color-brand-orange)" strokeWidth={i === activeIndex ? 1 : 0.5} strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: i === activeIndex ? 0.9 : 0.3 } : {}}
            transition={{ duration: 0.5, delay: 0.25 + i * 0.1, ease: EASE_OUT, opacity: { duration: 0.3 } }}
          />
        ))}
      </svg>

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] rounded-full bg-gradient-to-br from-brand-orange to-brand-deep-orange flex items-center justify-center shadow-xl"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <span className="absolute inset-0 rounded-full bg-brand-orange/40 blur-lg -z-10" />
        <span className="text-white font-bold text-[14px] sm:text-[16px] tracking-tight">Solvexo</span>
      </motion.div>

      {PLATFORM_PRODUCTS.map((p, i) => {
        const Icon = PRODUCT_ICONS[p.slug] ?? Store;
        const pos = positions[i];
        const active = i === activeIndex;
        return (
          <motion.button
            key={p.slug}
            onClick={() => onNavigate(p.slug)}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={onLeave}
            className="absolute z-[2] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={inView ? { scale: active ? 1.14 : 1, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.45 + i * 0.1, ease: EASE_OUT }}
          >
            <span className={clsx(
              'w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-xl border flex items-center justify-center transition-all duration-300',
              active ? 'bg-brand-orange border-brand-orange shadow-card-hover -translate-y-0.5' : 'bg-white border-bone shadow-card group-hover:border-brand-orange/40',
            )}>
              <Icon size={20} className={active ? 'text-white' : 'text-brand-orange'} />
            </span>
            <span className="text-[11px] sm:text-[12px] font-semibold text-carbon whitespace-nowrap">{text.shortProductLabel[p.slug] ?? localizeProduct(p, pageLang).name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── "AI that helps you sell smarter" gets its own visual — a data → analysis
// → recommendation flow, distinct from `AICommercePreview` (which stays the
// dashboard-shaped card used in the mega menu / explorer / connected-system
// panel) so this section doesn't just repeat the same mockup it's next to. ──
function AIFlowVisual() {
  const text = useSiteText(HOMEPAGE_TEXT);
  const STAGES = [
    { ...text.aiStages[0], Icon: BarChart3, tone: 'bg-white/10 text-white' },
    { ...text.aiStages[1], Icon: Sparkles, tone: 'bg-accent-violet text-white' },
    { ...text.aiStages[2], Icon: Check, tone: 'bg-success text-white' },
  ] as const;
  return (
    <div className="w-full rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/12 p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
        {STAGES.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 p-4 text-center">
              <span className={clsx('inline-flex w-9 h-9 rounded-lg items-center justify-center mb-2.5', s.tone)}>
                <s.Icon size={16} />
              </span>
              <p className="text-[12.5px] font-bold text-white">{s.label}</p>
              <p className="text-[10.5px] text-white/50 mt-0.5">{s.sub}</p>
            </div>
            {i < STAGES.length - 1 && (
              <ArrowRight size={16} className="text-white/25 shrink-0 hidden sm:block rtl:-scale-x-100" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Homepage() {
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  const reduceMotion = useReducedMotion();
  const text = useSiteText(HOMEPAGE_TEXT);
  const { pageLang } = useSiteLang();
  const solutions = SOLUTIONS.map(s => localizeSolution(s, pageLang));
  // The home page title is the app's exact name (Google OAuth verification compares the consent screen's app name with it).
  usePageTitle(''); // empty = keep the plain "Solvexo" title from index.html

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetTestimonials(5)
      .then(res => { if (!cancelled) setTestimonials(res.data ?? []); })
      .catch(() => { /* non-critical — section just stays hidden */ })
      .finally(() => { if (!cancelled) setTestimonialsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGetPlatformStats()
      .then(res => { if (!cancelled) setStats(res.data); })
      .catch(() => { /* non-critical — stat strip just stays hidden */ })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Feature explorer tab auto-advance — paused while the pointer is over the
  // section, resumes when it leaves; a manual click just jumps straight to
  // that tab, no separate timer reset needed.
  const [explorerTab, setExplorerTab] = useState(0);
  const explorerPausedRef = useRef(false);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      if (!explorerPausedRef.current) setExplorerTab(i => (i + 1) % EXPLORER_SLUGS.length);
    }, 4500);
    return () => clearInterval(id);
  }, [reduceMotion]);

  // Connected-system diagram — same auto-cycle/pause/hover pattern, driving
  // both the diagram's active node AND the preview panel underneath it.
  const [systemActive, setSystemActive] = useState(0);
  const systemPausedRef = useRef(false);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      if (!systemPausedRef.current) setSystemActive(i => (i + 1) % PLATFORM_PRODUCTS.length);
    }, 3200);
    return () => clearInterval(id);
  }, [reduceMotion]);
  const systemActiveProduct = localizeProduct(PLATFORM_PRODUCTS[systemActive], pageLang);

  // POS workflow strip — a small self-contained step indicator, purely
  // narrative (doesn't drive POSPreview's own content), cycling to imply
  // "search → cart → payment → receipt" without a full workflow rebuild.
  const [posStep, setPosStep] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setPosStep(i => (i + 1) % POS_STEP_COUNT), 1400);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const activeExplorerProduct = localizeProduct(getPlatformProduct(EXPLORER_SLUGS[explorerTab])!, pageLang);

  const statItems = stats ? [
    { value: stats.sellersCount, format: (n: number) => `${compactNumber.format(n)}+`, label: text.statSellers },
    { value: stats.gmv,          format: (n: number) => `${compactCurrency.format(n)}+`, label: text.statGmv },
    { value: stats.buyersCount,  format: (n: number) => `${compactNumber.format(n)}+`,  label: text.statBuyers },
    { value: stats.ratingCount > 0 ? stats.avgRating : null, format: (n: number) => `${n.toFixed(1)} ★`, label: text.statRating },
  ] : [];

  return (
    <div className="bg-white min-h-full">

      {/* ── Hero — the owner's new light design (copy + illustrative workspace/storefront mock-up). ── */}
      <HomeHeroLight />

      {/* ── Industries strip — a continuous marquee instead of a static pill
         row, editorial text links (no pill chrome) with a dot separator,
         real navigation into /solutions on click. ── */}
      {/* dir="ltr": the marquee's -50% loop assumes the track starts at the left edge; under RTL the track would slide
         away and leave the strip empty. The Arabic names inside still render right-to-left. */}
      <section dir="ltr" className="bg-carbon border-b border-bone/20 py-8 sm:py-10 overflow-hidden">
        <Marquee duration={30}>
          {solutions.map(s => (
            <span key={s.slug} className="flex items-center shrink-0">
              <button
                onClick={() => navigate(`/solutions/${s.slug}`)}
                data-cursor="hover"
                className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[0.01em] text-white/50 hover:text-white transition-colors duration-300 bg-transparent border-none cursor-pointer px-5"
              >
                {s.name}
              </button>
              <span className="w-[7px] h-[7px] sm:w-[8px] sm:h-[8px] rounded-full bg-brand-orange/60 shrink-0" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* ── One connected system — the strongest section on the page. A
         hub-and-spoke diagram whose active node drives a real preview panel
         underneath it, not a flat card grid. Every node is a real,
         clickable link into that product's own page. ── */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-12 bg-cream"
        onMouseEnter={() => { systemPausedRef.current = true; }}
        onMouseLeave={() => { systemPausedRef.current = false; }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,var(--color-brand-orange)_0%,transparent_65%)] opacity-[0.06] pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative max-w-[1320px] mx-auto">
          <div className="text-center max-w-[900px] mx-auto mb-16 lg:mb-20">
            <Reveal>
              <p className="text-[11px] font-semibold text-brand-deep-orange uppercase tracking-[0.12em] rtl:tracking-normal mb-5">{text.systemKicker}</p>
            </Reveal>
            <h2 className="font-serif text-[40px] sm:text-[64px] lg:text-[84px] font-bold text-carbon leading-[1.02] tracking-[-0.015em] rtl:tracking-normal rtl:leading-[1.25]">
              <SplitText as="div" text={text.systemTitle1} delay={0.05} />
              <SplitText as="div" text={text.systemTitle2} delay={0.2} />
            </h2>
            <Reveal delay={0.4}>
              <p className="text-[15px] sm:text-[17px] text-slate leading-[1.7] mt-7 max-w-[660px] mx-auto">
                {text.systemLead}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <ConnectedSystemDiagram
              onNavigate={slug => navigate(`/products/${slug}`)}
              activeIndex={systemActive}
              onHover={setSystemActive}
              onLeave={() => {}}
            />

            <div className="relative rounded-[24px] bg-white border border-bone shadow-raised p-6 sm:p-8">
              <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] rtl:tracking-normal mb-2">{systemActiveProduct.name}</p>
              <p className="text-[13.5px] text-slate leading-[1.65] mb-5 max-w-[420px]">{systemActiveProduct.heroSubtext}</p>
              <div className="relative min-h-[240px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={systemActiveProduct.slug}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {mockupForProductSlug(systemActiveProduct.slug)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Store Builder ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-10 lg:gap-14 items-center">
          <Reveal>
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] rtl:tracking-normal mb-3">{text.storeKicker}</p>
            <h2 className="text-[24px] sm:text-[32px] font-bold text-carbon leading-[1.2] mb-4" style={{ fontFamily: "'Lora', 'IBM Plex Sans Arabic', Georgia, serif" }}>
              {text.storeTitle}
            </h2>
            <p className="text-[14px] text-slate leading-[1.7] mb-5">
              {text.storeLead}
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {text.storeFeatures.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={14} className="text-success shrink-0" />
                  <span className="text-[13px] text-charcoal">{f}</span>
                </div>
              ))}
            </div>
            <MagneticButton>
              <Button onClick={() => navigate('/products/store-builder')}>
                {text.storeCta} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
              </Button>
            </MagneticButton>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="flex -space-x-1">
                {['#D97757', '#141413', '#7C3AED', '#2D8A4E'].map(c => (
                  <span key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                ))}
              </div>
              <span className="text-[11px] text-slate">{text.storeHint}</span>
              <ArrowRight size={12} className="text-slate/50 rtl:-scale-x-100" />
            </div>
            <div className="relative">
              <StorefrontPreview />
              {/* Mobile-preview companion — literally illustrates the "Live
                 desktop & mobile preview" bullet above instead of leaving it
                 as an unproven text claim. */}
              <div className="hidden sm:block absolute -bottom-7 -end-6 w-[110px] xl:w-[122px] drop-shadow-xl">
                <MobileStorePreview />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── POS ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-cream">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-10 lg:gap-14 items-center">
          <Reveal className="lg:order-2">
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] rtl:tracking-normal mb-3">{text.posKicker}</p>
            <h2 className="text-[24px] sm:text-[32px] font-bold text-carbon leading-[1.2] mb-4" style={{ fontFamily: "'Lora', 'IBM Plex Sans Arabic', Georgia, serif" }}>
              {text.posTitle}
            </h2>
            <p className="text-[14px] text-slate leading-[1.7] mb-5">
              {text.posLead}
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {text.posFeatures.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={14} className="text-success shrink-0" />
                  <span className="text-[13px] text-charcoal">{f}</span>
                </div>
              ))}
            </div>
            <MagneticButton>
              <Button onClick={() => navigate('/products/pos')}>
                {text.posCta} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
              </Button>
            </MagneticButton>
          </Reveal>
          <Reveal delay={0.1} className="lg:order-1">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {text.posSteps.map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-300',
                    i === posStep ? 'bg-brand-orange text-white' : 'bg-bone text-slate',
                  )}>
                    {i + 1}
                  </span>
                  <span className={clsx('text-[11px] font-medium transition-colors duration-300 hidden sm:inline', i === posStep ? 'text-carbon' : 'text-slate')}>{s}</span>
                  {i < text.posSteps.length - 1 && <ArrowRight size={11} className="text-slate/40 mx-0.5 rtl:-scale-x-100" />}
                </div>
              ))}
            </div>
            <POSPreview />
          </Reveal>
        </div>
      </section>

      {/* ── AI Commerce ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-carbon relative overflow-hidden">
        <div className="absolute w-[300px] h-[300px] rounded-full bg-accent-violet/15 blur-3xl -top-20 -left-16 pointer-events-none" />
        <div className="relative z-[1] max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-10 lg:gap-14 items-center">
          <Reveal>
            <p className="text-[11px] font-semibold text-accent-violet uppercase tracking-[0.1em] rtl:tracking-normal mb-3">{text.aiKicker}</p>
            <h2 className="text-[24px] sm:text-[32px] font-bold text-white leading-[1.2] mb-4" style={{ fontFamily: "'Lora', 'IBM Plex Sans Arabic', Georgia, serif" }}>
              {text.aiTitle}
            </h2>
            <p className="text-[14px] text-[#b0aea8] leading-[1.7] mb-5">
              {text.aiLead}
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {text.aiFeatures.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={14} className="text-accent-violet shrink-0" />
                  <span className="text-[13px] text-[#d8d6d0]">{f}</span>
                </div>
              ))}
            </div>
            <MagneticButton>
              <Button variant="dark" onClick={() => navigate('/products/ai-commerce')}>
                {text.aiCta} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
              </Button>
            </MagneticButton>
          </Reveal>
          <Reveal delay={0.1}>
            <AIFlowVisual />
          </Reveal>
        </div>
      </section>

      {/* ── Seller Dashboard preview ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white">
        <div className="max-w-[1200px] mx-auto text-center">
          <SectionHeading title={text.dashboardTitle} subtitle={text.dashboardSubtitle} align="center" size="lg" className="mb-10" />
          <Reveal delay={0.1}>
            <SellerDashboardPreview className="max-w-[960px] mx-auto" />
          </Reveal>
        </div>
      </section>

      {/* ── Workspace Explorer — a large, immersive dashboard exploration,
         not another tab strip. Distinct crossfade (scale+blur) from the
         connected-system section above it. ── */}
      <section
        className="bg-carbon relative overflow-hidden py-16 sm:py-20 lg:py-24"
        onMouseEnter={() => { explorerPausedRef.current = true; }}
        onMouseLeave={() => { explorerPausedRef.current = false; }}
      >
        <div className="absolute w-[320px] h-[320px] rounded-full bg-brand-orange/15 blur-3xl -bottom-32 right-[8%] pointer-events-none" />
        <div className="absolute w-[240px] h-[240px] rounded-full bg-accent-violet/12 blur-3xl top-[10%] -left-16 pointer-events-none" />
        <div className="relative z-[1] px-4 sm:px-6 lg:px-12">
          <SectionHeading kicker={text.explorerKicker} title={text.explorerTitle} subtitle={text.explorerSubtitle} tone="dark" align="center" className="mb-12 sm:mb-14" />

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-12 items-stretch max-w-[1000px] mx-auto">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:pb-0 scrollbar-hide">
              {EXPLORER_SLUGS.map((slug, i) => {
                const product = localizeProduct(getPlatformProduct(slug)!, pageLang);
                const Icon = PRODUCT_ICONS[slug] ?? Store;
                const isActive = i === explorerTab;
                return (
                  <button
                    key={slug}
                    onClick={() => setExplorerTab(i)}
                    className={clsx(
                      'relative shrink-0 lg:shrink text-start rounded-xl px-4 py-4 border transition-all duration-300 cursor-pointer w-[220px] lg:w-auto overflow-hidden',
                      isActive ? 'bg-white/[0.08] border-brand-orange/40' : 'bg-transparent border-white/10 hover:border-white/20',
                    )}
                  >
                    {isActive && <span className="absolute start-0 top-0 bottom-0 w-[3px] bg-brand-orange" />}
                    <span className="flex items-center gap-3">
                      <span className={clsx('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300', isActive ? 'bg-brand-orange text-white' : 'bg-white/10 text-white/60')}>
                        <Icon size={17} />
                      </span>
                      <span>
                        <span className="block text-[13.5px] font-bold text-white">{product.name}</span>
                        <span className="hidden lg:block text-[11px] text-white/50 mt-0.5">{product.tagline}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-h-[340px] flex flex-col sm:flex-row items-center gap-8 rounded-[24px] bg-white/[0.05] backdrop-blur-md border border-white/12 overflow-hidden p-6 sm:p-9">
              <div className="absolute -inset-px rounded-[24px] bg-gradient-to-br from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeExplorerProduct.slug}
                  initial={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-[1] flex flex-col sm:flex-row items-center gap-8 w-full"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-white mb-2.5">{activeExplorerProduct.name}</p>
                    <p className="text-[12.5px] text-white/60 leading-[1.65] mb-4">{activeExplorerProduct.heroSubtext}</p>
                    <div className="flex flex-col gap-2">
                      {activeExplorerProduct.features.slice(0, 3).map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <Check size={12} className="text-success shrink-0" />
                          <span className="text-[12px] text-white/75">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full sm:w-[320px] shrink-0">
                    {mockupForProductSlug(activeExplorerProduct.slug)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── How Solvexo works ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <SectionHeading title={text.howTitle} align="center" size="lg" className="mb-10" />
          <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" step={0.08} y={20}>
            {text.howSteps.map(({ step, desc }, i) => {
              const Icon = HOW_IT_WORKS_ICONS[i];
              return (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-pale-orange flex items-center justify-center mx-auto mb-4">
                  <Icon size={24} className="text-brand-orange" />
                </div>
                <p className="text-[15px] font-bold text-carbon mb-1.5">{i + 1}. {step}</p>
                <p className="text-[12.5px] text-slate leading-[1.6]">{desc}</p>
              </div>
              );
            })}
          </RevealStagger>
        </div>
      </section>

      {/* ── Industries — full-bleed editorial image cards, text overlaid on
         the photo itself, not a photo-on-top / caption-below card. ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-cream">
        <div className="max-w-[1100px] mx-auto">
          <SectionHeading kicker={text.industriesKicker} title={text.industriesTitle} align="center" size="lg" className="mb-10" />
          <RevealStagger className="grid grid-cols-2 sm:grid-cols-3 gap-4" step={0.06} y={18}>
            {solutions.map(s => (
              <PremiumCard key={s.slug} onClick={() => navigate(`/solutions/${s.slug}`)} className="group relative overflow-hidden p-0 aspect-[4/5]">
                <img src={unsplashUrl(s.image, 320)} alt={text.solutionAlt(s.name, stockPhotoAlt(s.image))} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 flex items-end justify-between gap-2">
                  <p className="text-[13px] font-bold text-white leading-tight">{s.name}</p>
                  <span className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-brand-orange group-hover:border-brand-orange">
                    <ArrowRight size={13} className="text-white rtl:-scale-x-100" />
                  </span>
                </div>
              </PremiumCard>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ── Stats — real platform figures, self-hides until there's real data ── */}
      {(statsLoading || statItems.length > 0) && (
        <section className="py-12 sm:py-14 px-4 sm:px-6 lg:px-12 bg-white border-t border-b border-bone">
          <RevealStagger className="max-w-[1000px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center" step={0.08} y={14}>
            {statsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <SkeletonBox width={70} height={32} className="mb-2 mx-auto" />
                    <SkeletonBox width={90} height={13} className="mx-auto" />
                  </div>
                ))
              : statItems.map(s => (
                  <div key={s.label} className="text-center">
                    {/* dir="ltr": "1.2K+" / "$18.4K+" keep their sign order on the Arabic page. */}
                    <div dir="ltr">
                      {s.value === null
                        ? <p className="block text-[32px] font-bold text-brand-orange">—</p>
                        : <AnimatedCounter value={s.value} format={s.format} className="block text-[32px] font-bold text-brand-orange" />}
                    </div>
                    <p className="text-[13px] text-slate">{s.label}</p>
                  </div>
                ))}
          </RevealStagger>
        </section>
      )}

      {/* ClosingCtaBanner (stats row + phone-mockup showing a fabricated
         central-marketplace "search products, stores..." + "My Orders"
         app screen) removed — that app/browsing experience no longer exists
         post marketplace-to-standalone-store pivot. The page's own later
         closing section ("Start Selling Free" / "Explore the Platform")
         already covers the final CTA, so nothing is missing here. Component
         itself is untouched, just unlinked from this page (same convention
         as the rest of the pivot's disconnected marketplace surfaces). */}

      {/* ── Social Proof — real reviews only; section hides itself until there's enough real content ── */}
      {(testimonialsLoading || testimonials.length > 0) && (
        <section className="bg-cream border-t border-bone py-10 sm:py-12 lg:py-14 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-12">
            <SectionHeading kicker={text.trustedKicker} title={text.trustedTitle} align="center" className="mb-10" />
          </div>
          {testimonialsLoading ? (
            // A still skeleton row, not a moving one — nothing to imply
            // motion over placeholder content.
            <div className="px-4 sm:px-6 lg:px-12 flex flex-wrap justify-center gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} padding="none" className="w-full sm:w-[340px]">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <SkeletonBox width={70} height={12} />
                      <SkeletonBox width={22} height={22} rounded="6px" />
                    </div>
                    <SkeletonBox width="100%" height={13} className="mb-2" />
                    <SkeletonBox width="80%" height={13} className="mb-4" />
                    <div className="flex items-center gap-[10px] pt-3 border-t border-bone">
                      <SkeletonBox width={30} height={30} rounded="999px" />
                      <div>
                        <SkeletonBox width={90} height={13} className="mb-1" />
                        <SkeletonBox width={70} height={11} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <TestimonialSpotlight testimonials={testimonials} />
          )}
        </section>
      )}

      {/* ── Final CTA — a dark spotlight card floating on a LIGHT section,
         deliberately not another full-bleed dark block. The industries grid
         above is white and the Footer right below is dark-carbon — stacking
         a third full-dark section directly between them collapsed all three
         into one indistinguishable dark mass with no visible seams. Putting
         the card's own explicit dark bg on a bg-cream section restores the
         page's established white/orange/cream rhythm and gives the Footer's
         dark bg a real edge to contrast against again. ── */}
      <section className="relative bg-cream px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
        <Reveal className="relative max-w-[860px] mx-auto overflow-hidden rounded-[24px] bg-carbon shadow-raised px-6 sm:px-12 py-10 sm:py-14 text-center">
          <div className="hero-grid-drift absolute inset-0 pointer-events-none opacity-25" />
          <div className="hero-breath absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-[radial-gradient(circle,var(--color-brand-orange)_0%,transparent_70%)] blur-3xl pointer-events-none" />

          <div className="relative z-[1]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] rtl:tracking-normal text-brand-orange mb-3">
              {text.ctaKicker}
            </p>

            <h2 className="font-sans font-extrabold text-white leading-[1.12] tracking-[-0.02em]">
              <SplitText as="div" text={text.ctaTitle1} delay={0.08} className="text-[22px] sm:text-[27px] lg:text-[30px] block" />
              <SplitText
                as="div"
                text={text.ctaTitle2}
                delay={0.24}
                className="text-[22px] sm:text-[27px] lg:text-[30px] block bg-gradient-to-r from-brand-orange to-[#f0a57a] bg-clip-text text-transparent"
              />
            </h2>

            <p className="text-[12.5px] text-[#b0aea8] leading-[1.6] mt-3 mb-6 max-w-[400px] mx-auto">
              {text.ctaLead}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <MagneticButton>
                <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading} icon={<UserPlus size={14} />}>
                  {text.startSellingFree}
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button variant="outline" size="lg" onClick={() => navigate('/products')} icon={<ArrowRight size={14} className="rtl:-scale-x-100" />}>
                  {text.explorePlatform}
                </Button>
              </MagneticButton>
            </div>
            <p className="mt-3 text-[12.5px] text-[#d7d4cc] hover:text-white">{text.preferWalkthrough} <button type="button" onClick={() => navigate('/book-demo')} className="font-semibold underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer text-inherit">{text.bookFreeDemo}</button></p>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
