import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { Avatar } from '@/components/comman/ui/Avatar';
import { Footer, SkeletonBox, ClosingCtaBanner } from '@/components/comman/ui';
import {
  ArrowRight, Store, Sparkles, Check,
  Star, BadgeCheck, Quote, ShieldCheck, Globe, Rocket, Headphones, Loader2,
  MonitorSmartphone, BarChart3, PackageCheck, Users, UserPlus, Link2, Rows3, TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiGetTestimonials, type Testimonial } from '@/api/services/testimonials';
import { apiGetPlatformStats, type PlatformStats } from '@/api/services/store';
import homepageHero from '@/assets/homepage-hero.webp';
import { Reveal, RevealStagger } from '@/components/comman/motion/Reveal';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { useMouseParallax } from '@/components/comman/motion/useMouseParallax';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { AnimatedCounter } from '@/components/comman/motion/AnimatedCounter';
import {
  StorefrontPreview, POSPreview, AICommercePreview, AnalyticsPreview, SellerDashboardPreview,
} from '@/components/comman/mockups/ProductMockups';
import { PLATFORM_PRODUCTS, getPlatformProduct } from '@/features/buyer/data/platformProducts';
import { SOLUTIONS } from '@/features/buyer/data/solutions';
import { unsplashUrl } from '@/assets/stockPhotos';
import { motion, useReducedMotion, useTransform, AnimatePresence } from 'motion/react';

const compactNumber   = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const compactCurrency = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: 'USD' });

// ── Hero floating proof chips — small glass cards drifting around the hero
// image at independent parallax depths (mouse-move on desktop, static on
// touch/reduced-motion). Illustrative chrome only, same convention this
// page already uses for the showcase mockups below (fabricated example
// numbers on a real UI shell) — not a claim of live data.
type ParallaxMV = ReturnType<typeof useMouseParallax<HTMLDivElement>>;
function FloatingChip({
  px, py, depth, className, delay, children,
}: {
  px: ParallaxMV['px']; py: ParallaxMV['py']; depth: number; className: string; delay: number;
  children: ReactNode;
}) {
  const x = useTransform(px, v => v * depth);
  const y = useTransform(py, v => v * depth);
  return (
    <motion.div
      className={clsx('absolute z-[2] flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-xl px-3 py-2', className)}
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const HERO_TRUST_ROW: { Icon: LucideIcon; label: string }[] = [
  { Icon: Rocket,      label: 'Easy to Start' },
  { Icon: ShieldCheck, label: 'Secure Payments' },
  { Icon: Globe,       label: 'Global Reach' },
  { Icon: Headphones,  label: '24/7 Support' },
];

const PRODUCT_ICONS: Record<string, LucideIcon> = {
  'store-builder': Store,
  pos: MonitorSmartphone,
  'ai-commerce': Sparkles,
  analytics: BarChart3,
  inventory: PackageCheck,
  'orders-customers': Users,
};

const HOW_IT_WORKS = [
  { Icon: Store,    step: 'Create',  desc: 'Build your storefront from a curated theme, or set up POS to sell in person.' },
  { Icon: Link2,    step: 'Connect', desc: 'Add products, connect a payment method, and your inventory syncs across every channel.' },
  { Icon: Rows3,     step: 'Sell',    desc: 'Take orders online and in person — from the same catalog, the same stock.' },
  { Icon: TrendingUp, step: 'Grow',   desc: 'Use real analytics and AI tools to see what\'s working and do more of it.' },
] as const;

const EXPLORER_SLUGS = ['analytics', 'inventory', 'orders-customers'] as const;

function explorerPreview(slug: string) {
  if (slug === 'analytics') return <AnalyticsPreview />;
  return <SellerDashboardPreview />;
}

export function Homepage() {
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  const reduceMotion = useReducedMotion();
  const { ref: heroVisualRef, px, py } = useMouseParallax<HTMLDivElement>();
  usePageTitle('Home');

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

  const activeExplorerProduct = getPlatformProduct(EXPLORER_SLUGS[explorerTab])!;

  const statItems = stats ? [
    { value: stats.sellersCount, format: (n: number) => `${compactNumber.format(n)}+`, label: 'Active Sellers' },
    { value: stats.gmv,          format: (n: number) => `${compactCurrency.format(n)}+`, label: 'GMV Processed' },
    { value: stats.buyersCount,  format: (n: number) => `${compactNumber.format(n)}+`,  label: 'Registered Buyers' },
    { value: stats.ratingCount > 0 ? stats.avgRating : null, format: (n: number) => `${n.toFixed(1)} ★`, label: 'Average Rating' },
  ] : [];

  return (
    <div className="bg-white min-h-full">

      {/* ── Hero — seller-acquisition first: the primary CTA is "Start for
         Free", not "browse the marketplace". ─────────────────────────────── */}
      <section className="mesh-brand grain-overlay relative overflow-hidden">

        {/* Ambient glow orbs on top of the mesh — kept for extra drift/life,
           the mesh itself supplies the base layered depth. */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="auth-float absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[480px] lg:h-[480px] rounded-full -top-24 -right-20 bg-[radial-gradient(circle,var(--color-brand-orange)_0%,transparent_70%)] opacity-[0.18] blur-3xl" />
          <div className="auth-float-slow absolute w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] rounded-full -bottom-16 right-[30%] bg-[radial-gradient(circle,var(--color-accent-violet)_0%,transparent_70%)] opacity-[0.12] blur-3xl" />
        </div>

        <div className="relative z-[1] px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16 lg:pt-20 pb-14 sm:pb-18 lg:pb-24 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-[560px]">

            {/* Badge */}
            <Reveal delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full px-[14px] py-[5px] mb-5 border border-[rgba(217,119,87,0.35)] bg-[rgba(217,119,87,0.12)]">
                <Sparkles size={12} className="text-brand-orange shrink-0" />
                <span className="text-[12px] font-medium text-brand-orange">
                  Built for Sellers, Creators &amp; Educators
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="font-serif text-[30px] sm:text-[40px] lg:text-[48px] leading-[1.18] tracking-[-0.01em] font-semibold text-white mb-4">
                Everything you need to sell.{' '}
                <span className="bg-gradient-to-r from-brand-orange to-[#f0a57a] bg-clip-text text-transparent">
                  Everywhere your customers shop.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="text-[13px] sm:text-sm text-[#b0aea8] leading-[1.75] mb-6 max-w-[440px]">
                Build your online store, sell in person with POS, manage products and orders, and grow your business — all from one connected commerce platform.
              </p>
            </Reveal>

            {/* Trust row — quick-scan reasons to stay, ahead of the CTAs */}
            <Reveal delay={0.24}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
                {HERO_TRUST_ROW.map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-[6px]">
                    <Icon size={14} className="text-brand-orange shrink-0" />
                    <span className="text-[12px] text-[#c7c5bf] whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* CTAs — "Start for Free" is the one job of this page */}
            <Reveal delay={0.32}>
              <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
                <MagneticButton className="w-full sm:w-auto">
                  <button
                    onClick={sellEntry.go}
                    disabled={sellEntry.loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-[11px] rounded-lg text-[13.5px] font-semibold text-white bg-gradient-to-r from-brand-orange to-brand-deep-orange hover:brightness-105 transition-[filter] cursor-pointer disabled:opacity-60"
                  >
                    {sellEntry.loading ? <Loader2 size={14} className="animate-spin" /> : null}
                    Start Selling Free <ArrowRight size={13} className="inline align-middle" />
                  </button>
                </MagneticButton>
                <button
                  onClick={() => navigate('/products')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
                >
                  Explore the Platform
                </button>
              </div>
            </Reveal>
          </div>

          {/* Hero visual — single pre-composed graphic (devices + real
             product cutouts). Scales with the viewport: capped/centered
             on mobile & tablet (stacked below the text), grows with the
             available row space from lg up so it doesn't stay pinned at
             a fixed size on large/ultra-wide screens. */}
          <motion.div
            ref={heroVisualRef}
            className="relative w-full max-w-[420px] sm:max-w-[520px] md:max-w-[600px] lg:max-w-[620px] xl:max-w-[760px] 2xl:max-w-[860px] lg:flex-1 shrink-0 mx-auto lg:mx-0"
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[340px] lg:h-[340px] rounded-full bg-[radial-gradient(circle,var(--color-brand-orange)_0%,transparent_70%)] opacity-[0.22] blur-2xl" />
            </div>
            <motion.img
              src={homepageHero}
              alt="Solvexo storefront preview"
              width={633}
              height={394}
              className="relative z-[1] w-full h-auto"
              style={{ x: useTransform(px, v => v * -8), y: useTransform(py, v => v * -8) }}
            />

            {/* Floating proof chips — independent parallax depth, hidden on
               the smallest screens where there's no room for them to breathe. */}
            <FloatingChip px={px} py={py} depth={16} delay={0.5} className="hidden sm:flex top-[8%] -left-2 sm:left-2">
              <span className="w-7 h-7 rounded-lg bg-success-bg flex items-center justify-center shrink-0">
                <PackageCheck size={14} className="text-success" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10.5px] font-bold text-carbon">New order</span>
                <span className="block text-[9.5px] text-slate">Rs 4,200</span>
              </span>
            </FloatingChip>

            <FloatingChip px={px} py={py} depth={-14} delay={0.62} className="hidden sm:flex top-[2%] right-0 sm:right-4">
              <span className="w-7 h-7 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
                <Star size={13} className="text-brand-orange fill-brand-orange" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10.5px] font-bold text-carbon">4.9 rating</span>
                <span className="block text-[9.5px] text-slate">214 reviews</span>
              </span>
            </FloatingChip>

            <FloatingChip px={px} py={py} depth={20} delay={0.74} className="hidden md:flex bottom-[6%] right-[6%]">
              <span className="w-7 h-7 rounded-lg bg-accent-violet-bg flex items-center justify-center shrink-0">
                <Sparkles size={13} className="text-accent-violet" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10.5px] font-bold text-carbon">AI Suggestion</span>
                <span className="block text-[9.5px] text-slate">Feature this product</span>
              </span>
            </FloatingChip>
          </motion.div>
        </div>
      </section>

      {/* ── Industries strip — real navigation into /solutions, not a fake logo wall ── */}
      <section className="bg-white border-b border-bone">
        <div className="px-4 sm:px-6 lg:px-12 py-5">
          <Reveal className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            <span className="text-[11.5px] text-slate mr-2">Built for every kind of business:</span>
            {SOLUTIONS.map(s => (
              <button
                key={s.slug}
                onClick={() => navigate(`/solutions/${s.slug}`)}
                className="text-[11.5px] font-medium text-charcoal bg-cream hover:bg-brand-pale-orange hover:text-brand-deep-orange border border-bone hover:border-brand-orange/30 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
              >
                {s.name}
              </button>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Product Ecosystem — "One platform. Every way you sell." ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-cream">
        <div className="max-w-[1100px] mx-auto">
          <SectionHeading kicker="One platform" title="One platform. Every way you sell." align="center" size="lg" className="mb-10" />
          <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" step={0.07} y={20}>
            {PLATFORM_PRODUCTS.map(p => {
              const Icon = PRODUCT_ICONS[p.slug] ?? Store;
              return (
                <PremiumCard key={p.slug} onClick={() => navigate(`/products/${p.slug}`)} className="p-6">
                  <span className="w-11 h-11 rounded-xl bg-brand-pale-orange flex items-center justify-center mb-4">
                    <Icon size={20} className="text-brand-orange" />
                  </span>
                  <p className="text-[15px] font-bold text-carbon mb-1.5">{p.name}</p>
                  <p className="text-[12.5px] text-slate leading-[1.6] mb-4">{p.tagline}</p>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-orange">
                    Explore {p.name} <ArrowRight size={12} />
                  </span>
                </PremiumCard>
              );
            })}
          </RevealStagger>
        </div>
      </section>

      {/* ── Store Builder ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-3">Store Builder</p>
            <h2 className="text-[24px] sm:text-[32px] font-bold text-carbon leading-[1.2] mb-4" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Build a store that feels like your brand.
            </h2>
            <p className="text-[14px] text-slate leading-[1.7] mb-5">
              A real drag-and-drop storefront editor — themes, sections, header and footer — with a live preview, not a template you're stuck with.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {['Curated theme library', 'Section-by-section page editing', 'Live desktop & mobile preview', 'Your own store subdomain'].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={14} className="text-success shrink-0" />
                  <span className="text-[13px] text-charcoal">{f}</span>
                </div>
              ))}
            </div>
            <MagneticButton>
              <Button onClick={() => navigate('/products/store-builder')}>
                Explore Store Builder <ArrowRight size={14} className="inline align-middle ml-1" />
              </Button>
            </MagneticButton>
          </Reveal>
          <Reveal delay={0.1}>
            <StorefrontPreview />
          </Reveal>
        </div>
      </section>

      {/* ── POS ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-cream">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal className="lg:order-2">
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-3">Point of Sale</p>
            <h2 className="text-[24px] sm:text-[32px] font-bold text-carbon leading-[1.2] mb-4" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Sell in-store. Sell online. One connected system.
            </h2>
            <p className="text-[14px] text-slate leading-[1.7] mb-5">
              A real point-of-sale terminal that shares the exact same inventory and order records as your online store — no separate system to reconcile.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {['PIN-based employee login', 'Real-time inventory sync', 'Works standalone, with no storefront needed', 'Register session tracking'].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={14} className="text-success shrink-0" />
                  <span className="text-[13px] text-charcoal">{f}</span>
                </div>
              ))}
            </div>
            <MagneticButton>
              <Button onClick={() => navigate('/products/pos')}>
                Explore POS <ArrowRight size={14} className="inline align-middle ml-1" />
              </Button>
            </MagneticButton>
          </Reveal>
          <Reveal delay={0.1} className="lg:order-1">
            <POSPreview />
          </Reveal>
        </div>
      </section>

      {/* ── AI Commerce ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-carbon relative overflow-hidden">
        <div className="absolute w-[300px] h-[300px] rounded-full bg-accent-violet/15 blur-3xl -top-20 -left-16 pointer-events-none" />
        <div className="relative z-[1] max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <p className="text-[11px] font-semibold text-accent-violet uppercase tracking-[0.1em] mb-3">AI Commerce</p>
            <h2 className="text-[24px] sm:text-[32px] font-bold text-white leading-[1.2] mb-4" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              AI that helps you sell smarter.
            </h2>
            <p className="text-[14px] text-[#b0aea8] leading-[1.7] mb-5">
              Real AI tools built into your workspace — for the writing and analysis work that normally eats the most time. A productivity tool, not a sales guarantee.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {['AI-assisted product descriptions', 'Metered through an AI credits wallet', 'Built into the seller dashboard'].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={14} className="text-accent-violet shrink-0" />
                  <span className="text-[13px] text-[#d8d6d0]">{f}</span>
                </div>
              ))}
            </div>
            <MagneticButton>
              <Button variant="dark" onClick={() => navigate('/products/ai-commerce')}>
                Explore AI Commerce <ArrowRight size={14} className="inline align-middle ml-1" />
              </Button>
            </MagneticButton>
          </Reveal>
          <Reveal delay={0.1}>
            <AICommercePreview />
          </Reveal>
        </div>
      </section>

      {/* ── Seller Dashboard preview ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <SectionHeading title="Everything your business needs, in one dashboard." subtitle="Revenue, orders, customers and top products — computed from your real data, not a simulated preview." align="center" size="lg" className="mb-10" />
          <Reveal delay={0.1}>
            <SellerDashboardPreview className="max-w-[720px] mx-auto" />
          </Reveal>
        </div>
      </section>

      {/* ── Feature Explorer — interactive tabs for the rest of the workspace ── */}
      <section
        className="bg-carbon relative overflow-hidden py-14 sm:py-16 lg:py-20"
        onMouseEnter={() => { explorerPausedRef.current = true; }}
        onMouseLeave={() => { explorerPausedRef.current = false; }}
      >
        <div className="absolute w-[260px] h-[260px] rounded-full bg-brand-orange/15 blur-3xl -bottom-24 right-[10%] pointer-events-none" />
        <div className="relative z-[1] px-4 sm:px-6 lg:px-12">
          <SectionHeading kicker="Keep exploring" title="More of what's inside the workspace" tone="dark" align="center" className="mb-10 sm:mb-12" />

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 lg:gap-10 items-center max-w-[900px] mx-auto">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:pb-0 scrollbar-hide">
              {EXPLORER_SLUGS.map((slug, i) => {
                const product = getPlatformProduct(slug)!;
                const Icon = PRODUCT_ICONS[slug] ?? Store;
                return (
                  <button
                    key={slug}
                    onClick={() => setExplorerTab(i)}
                    className={clsx(
                      'shrink-0 lg:shrink text-left rounded-xl px-4 py-3.5 border transition-all duration-300 cursor-pointer w-[200px] lg:w-auto',
                      i === explorerTab ? 'bg-white/[0.08] border-brand-orange/40' : 'bg-transparent border-white/10 hover:border-white/20',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300', i === explorerTab ? 'bg-brand-orange text-white' : 'bg-white/10 text-white/60')}>
                        <Icon size={16} />
                      </span>
                      <span className="block text-[13.5px] font-bold text-white">{product.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-h-[300px] flex flex-col sm:flex-row items-center gap-6 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/12 overflow-hidden p-5 sm:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeExplorerProduct.slug}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col sm:flex-row items-center gap-6 w-full"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white mb-2">{activeExplorerProduct.name}</p>
                    <p className="text-[12px] text-white/60 leading-[1.6] mb-3">{activeExplorerProduct.heroSubtext}</p>
                    <div className="flex flex-col gap-1.5">
                      {activeExplorerProduct.features.slice(0, 3).map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <Check size={12} className="text-success shrink-0" />
                          <span className="text-[11.5px] text-white/75">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full sm:w-[300px] shrink-0">
                    {explorerPreview(activeExplorerProduct.slug)}
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
          <SectionHeading title="How Solvexo works" align="center" size="lg" className="mb-10" />
          <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" step={0.08} y={20}>
            {HOW_IT_WORKS.map(({ Icon, step, desc }, i) => (
              <div key={step} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-pale-orange flex items-center justify-center mx-auto mb-4">
                  <Icon size={24} className="text-brand-orange" />
                </div>
                <p className="text-[15px] font-bold text-carbon mb-1.5">{i + 1}. {step}</p>
                <p className="text-[12.5px] text-slate leading-[1.6]">{desc}</p>
              </div>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ── Industries, with real imagery ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-12 bg-cream">
        <div className="max-w-[1100px] mx-auto">
          <SectionHeading kicker="Built for the way you sell" title="Whatever you sell, we've got you covered." align="center" size="lg" className="mb-10" />
          <RevealStagger className="grid grid-cols-2 sm:grid-cols-3 gap-4" step={0.06} y={18}>
            {SOLUTIONS.map(s => (
              <PremiumCard key={s.slug} onClick={() => navigate(`/solutions/${s.slug}`)} className="group overflow-hidden p-0">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={unsplashUrl(s.image, 320)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-3">
                  <p className="text-[12.5px] font-semibold text-carbon">{s.name}</p>
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
                    {s.value === null
                      ? <p className="block text-[32px] font-bold text-brand-orange">—</p>
                      : <AnimatedCounter value={s.value} format={s.format} className="block text-[32px] font-bold text-brand-orange" />}
                    <p className="text-[13px] text-slate">{s.label}</p>
                  </div>
                ))}
          </RevealStagger>
        </section>
      )}

      <ClosingCtaBanner />

      {/* ── Social Proof — real reviews only; section hides itself until there's enough real content ── */}
      {(testimonialsLoading || testimonials.length > 0) && (
        <section className="bg-cream border-t border-bone py-10 sm:py-12 lg:py-14">
          <div className="px-4 sm:px-6 lg:px-12">
            <SectionHeading kicker="Trusted by creators worldwide" title="Real stories from real sellers" align="center" className="mb-10" />
            {/* flex-wrap + centered, not a fixed 3-column grid — real
               testimonial count varies, and a rigid grid left fewer-than-3
               cards stranded on the left with a lopsided empty gap instead of
               sitting centered as a deliberate row. */}
            <RevealStagger className="flex flex-wrap justify-center gap-4" step={0.1} y={16}>
              {testimonialsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
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
                  ))
                : testimonials.map(t => (
                    <Card key={t.id} padding="none" hover className="group relative overflow-hidden w-full sm:w-[340px]">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-orange to-[#f0a57a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-[2px]">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={12} className={i <= Math.round(t.rating) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'} />
                            ))}
                          </div>
                          <Quote size={20} className="text-brand-orange/20 fill-brand-orange/20 shrink-0" />
                        </div>
                        <p className="text-[13px] text-charcoal leading-[1.75] mb-4 italic">
                          "{t.text}"
                        </p>
                        <div className="flex items-center gap-[10px] pt-3 border-t border-bone">
                          <Avatar name={t.name} size={30} />
                          <div>
                            <div className="flex items-center gap-[6px]">
                              <p className="text-[13px] font-semibold text-carbon">{t.name}</p>
                              {t.isVerifiedSeller && <BadgeCheck size={13} className="text-info fill-info/15 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate">{t.storeName ? `Owner, ${t.storeName}` : 'Verified Seller'}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
            </RevealStagger>
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="bg-carbon px-4 sm:px-6 lg:px-12 py-14 sm:py-16 text-center">
        <SectionHeading title="Ready to build, sell and grow?" tone="dark" align="center" size="lg" className="mb-8" />
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <MagneticButton>
              <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading} icon={<UserPlus size={14} />}>
                Start Selling Free
              </Button>
            </MagneticButton>
            <Button variant="outline" size="lg" onClick={() => navigate('/products')}>
              Explore the Platform
            </Button>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
