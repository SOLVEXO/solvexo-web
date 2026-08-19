import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { Avatar } from '@/components/comman/ui/Avatar';
import { Footer, SkeletonBox, ClosingCtaBanner } from '@/components/comman/ui';
import {
  ArrowRight, Store, Sparkles,
  Star, BadgeCheck, Quote, CreditCard, TrendingUp, Wallet, Package, Users,
  Gift, BarChart3, ShieldCheck, Globe, Rocket, Headphones, Loader2,
  MonitorSmartphone, PackageCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiGetTestimonials, type Testimonial } from '@/api/services/testimonials';
import homepageHero from '@/assets/homepage-hero.webp';

// Compact platform-capability strip directly under the hero — what a seller
// actually gets today (own storefront, in-person POS, physical/digital
// products, AI tools, secure payments, loyalty), not a marketplace pitch —
// bg values reference existing theme tokens via CSS var (rendered through an
// inline style) instead of repeating hex values as untracked magic numbers.
const PLATFORM_HIGHLIGHTS: { Icon: LucideIcon; title: string; sub: string; bg: string }[] = [
  { Icon: Store,            title: 'Your Own Storefront', sub: 'Live in minutes',       bg: 'var(--color-brand-pale-orange)' },
  { Icon: MonitorSmartphone, title: 'Point of Sale',       sub: 'Sell in person too',    bg: 'var(--color-info-bg)' },
  { Icon: PackageCheck,     title: 'Physical & Digital',  sub: 'Any product you sell',  bg: 'var(--color-success-bg)' },
  { Icon: Sparkles,         title: 'AI Commerce Tools',   sub: 'Smart tools to grow',   bg: 'var(--color-accent-violet-bg)' },
  { Icon: ShieldCheck,      title: 'Secure Payments',     sub: 'Built-in protection',   bg: 'var(--color-warning-bg)' },
  { Icon: Gift,             title: 'Loyalty Rewards',     sub: 'Earn points & perks',   bg: 'var(--color-brand-pale-orange)' },
];

const HERO_TRUST_ROW: { Icon: LucideIcon; label: string }[] = [
  { Icon: Rocket,      label: 'Easy to Start' },
  { Icon: ShieldCheck, label: 'Secure Payments' },
  { Icon: Globe,       label: 'Global Reach' },
  { Icon: Headphones,  label: '24/7 Support' },
];

// ── "See Solvexo in action" showcase — three real product surfaces as small
// glass-panel mockups (same visual language as the auth pages' hero
// mockups), not another icon-and-label grid. This replaces the old
// standalone trust-bar band, which just restated "Secure Payments"/"24/7
// Support" a third and fourth time in a row. ──
function ShowcaseGlow({ className }: { className?: string }) {
  return <div className={clsx('absolute rounded-full blur-3xl pointer-events-none', className)} />;
}
function ShowcaseCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="relative rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/12 p-4 mb-4 min-h-[220px] flex items-center justify-center overflow-hidden">
        {children}
      </div>
      <p className="text-[14px] font-bold text-white mb-1">{title}</p>
      <p className="text-[12px] text-white/55 leading-snug">{desc}</p>
    </div>
  );
}

export function Homepage() {
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  usePageTitle('Home');

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetTestimonials(5)
      .then(res => { if (!cancelled) setTestimonials(res.data ?? []); })
      .catch(() => { /* non-critical — section just stays hidden */ })
      .finally(() => { if (!cancelled) setTestimonialsLoading(false); });
    return () => { cancelled = true; };
  }, []);

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
            <div className="inline-flex items-center gap-2 rounded-full px-[14px] py-[5px] mb-5 border border-[rgba(217,119,87,0.35)] bg-[rgba(217,119,87,0.12)]">
              <Sparkles size={12} className="text-brand-orange shrink-0" />
              <span className="text-[12px] font-medium text-brand-orange">
                Built for Sellers, Creators &amp; Educators
              </span>
            </div>

            <h1 className="font-serif text-[30px] sm:text-[40px] lg:text-[48px] leading-[1.18] tracking-[-0.01em] font-semibold text-white mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-brand-orange to-[#f0a57a] bg-clip-text text-transparent">
                start selling, today.
              </span>
            </h1>

            <p className="text-[13px] sm:text-sm text-[#b0aea8] leading-[1.75] mb-6 max-w-[440px]">
              Launch your own storefront, take payments in person with POS, and sell physical or digital products — all from one dashboard built for sellers, creators and educators.
            </p>

            {/* Trust row — quick-scan reasons to stay, ahead of the CTAs */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
              {HERO_TRUST_ROW.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-[6px]">
                  <Icon size={14} className="text-brand-orange shrink-0" />
                  <span className="text-[12px] text-[#c7c5bf] whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>

            {/* CTAs — "Start for Free" is the one job of this page */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <button
                onClick={sellEntry.go}
                disabled={sellEntry.loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-[11px] rounded-lg text-[13.5px] font-semibold text-white bg-gradient-to-r from-brand-orange to-brand-deep-orange hover:brightness-105 transition-[filter] cursor-pointer disabled:opacity-60"
              >
                {sellEntry.loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Start for Free <ArrowRight size={13} className="inline align-middle" />
              </button>
              <button
                onClick={() => navigate('/sellers')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Hero visual — single pre-composed graphic (devices + real
             product cutouts). Scales with the viewport: capped/centered
             on mobile & tablet (stacked below the text), grows with the
             available row space from lg up so it doesn't stay pinned at
             a fixed size on large/ultra-wide screens. */}
          <div className="relative w-full max-w-[420px] sm:max-w-[520px] md:max-w-[600px] lg:max-w-[620px] xl:max-w-[760px] 2xl:max-w-[860px] lg:flex-1 shrink-0 mx-auto lg:mx-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[340px] lg:h-[340px] rounded-full bg-[radial-gradient(circle,var(--color-brand-orange)_0%,transparent_70%)] opacity-[0.22] blur-2xl" />
            </div>
            <img
              src={homepageHero}
              alt="Solvexo storefront preview"
              width={633}
              height={394}
              className="relative z-[1] w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* ── Platform highlights strip — directly under the hero, no gap ──────────── */}
      <section className="bg-white border-b border-bone">
        <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-7">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-5 gap-x-4">
            {PLATFORM_HIGHLIGHTS.map((f, i) => (
              <div key={f.title} className={clsx('flex items-center gap-3', i > 0 && 'lg:border-l lg:border-bone lg:pl-4')}>
                <span className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: f.bg }}>
                  <f.Icon size={18} className="text-brand-orange" />
                </span>
                <span className="min-w-0">
                  <p className="text-[12.5px] font-bold text-carbon leading-tight">{f.title}</p>
                  <p className="text-[10.5px] text-slate leading-tight mt-[1px]">{f.sub}</p>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── "See Solvexo in action" — three real product surfaces, not another
         icon-and-label strip. Same dark/glass visual language as the auth
         pages' hero mockups. ── */}
      <section className="bg-carbon relative overflow-hidden py-14 sm:py-16 lg:py-20">
        <ShowcaseGlow className="w-[300px] h-[300px] -top-20 -left-16 bg-brand-orange/15" />
        <ShowcaseGlow className="w-[260px] h-[260px] -bottom-24 right-[10%] bg-accent-violet/15" />

        <div className="relative z-[1] px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-2">
              One dashboard, everything connected
            </p>
            <h2 className="font-serif text-[24px] sm:text-[30px] font-bold text-white leading-[1.2]">
              See Solvexo in action
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Storefront preview — mini browser chrome + banner + product grid */}
            <ShowcaseCard title="Your Storefront" desc="A beautiful, mobile-ready store — live in minutes, no code needed.">
              <div className="w-full rounded-xl bg-white overflow-hidden shadow-xl">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-cream border-b border-bone">
                  <span className="size-[6px] rounded-full bg-[#e5675b]" />
                  <span className="size-[6px] rounded-full bg-[#e8b74e]" />
                  <span className="size-[6px] rounded-full bg-[#59c26a]" />
                </div>
                <div className="h-[52px] bg-gradient-to-br from-brand-orange to-brand-deep-orange" />
                <div className="grid grid-cols-2 gap-[6px] p-[8px]">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-[6px] bg-cream p-[6px]">
                      <div className="h-[26px] rounded-[4px] bg-white mb-[5px]" />
                      <div className="h-[5px] w-[70%] rounded-full bg-bone" />
                    </div>
                  ))}
                </div>
              </div>
            </ShowcaseCard>

            {/* POS — cart line items + charge button */}
            <ShowcaseCard title="Point of Sale" desc="Sell in person with POS, synced with your online store in real time.">
              <div className="w-full rounded-xl bg-white overflow-hidden shadow-xl p-[10px]">
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <span className="size-6 rounded-[6px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                    <CreditCard size={12} className="text-brand-orange" />
                  </span>
                  <p className="text-[10.5px] font-bold text-carbon">Current Sale</p>
                </div>
                <div className="flex flex-col gap-[6px] mb-[8px]">
                  {[['Wireless Earbuds', 'Rs 4,200'], ['Phone Case', 'Rs 900']].map(([name, price]) => (
                    <div key={name} className="flex items-center justify-between text-[9.5px]">
                      <span className="text-charcoal truncate">{name}</span>
                      <span className="font-semibold text-carbon shrink-0">{price}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-[7px] border-t border-bone mb-[8px]">
                  <span className="text-[10px] font-bold text-carbon">Total</span>
                  <span className="text-[12px] font-bold text-brand-orange">Rs 5,100</span>
                </div>
                <div className="rounded-[8px] bg-gradient-to-r from-brand-orange to-brand-deep-orange text-white text-[10.5px] font-bold text-center py-[8px]">
                  Charge Rs 5,100
                </div>
              </div>
            </ShowcaseCard>

            {/* Analytics — revenue bars + stat chips, echoes SellerDashboardMockup */}
            <ShowcaseCard title="Real-Time Analytics" desc="Track revenue, orders and customers the moment they happen.">
              <div className="w-full rounded-xl bg-white overflow-hidden shadow-xl p-[12px]">
                <div className="flex items-center justify-between mb-[8px]">
                  <p className="text-[10.5px] font-bold text-carbon">Store Revenue</p>
                  <span className="flex items-center gap-[3px] text-[9.5px] font-semibold text-success">
                    <TrendingUp size={10} /> 24%
                  </span>
                </div>
                <div className="flex items-end gap-[4px] h-[46px] mb-[10px]">
                  {[35, 55, 42, 70, 50, 85, 62, 78].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-[3px] bg-gradient-to-t from-brand-orange to-brand-deep-orange/70" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-[6px]">
                  {[
                    { Icon: Wallet, label: 'Revenue', value: '$4.2k' },
                    { Icon: Package, label: 'Orders', value: '128' },
                    { Icon: Users, label: 'Buyers', value: '86' },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="rounded-[7px] bg-cream px-[6px] py-[6px]">
                      <Icon size={11} className="text-slate mb-[3px]" />
                      <p className="text-[10.5px] font-bold text-carbon leading-tight">{value}</p>
                      <p className="text-[8px] text-slate leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ShowcaseCard>
          </div>
        </div>
      </section>

      {/* ── 3-up promo row — Sell / AI tools / Loyalty, each a real platform feature ── */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-orange to-brand-deep-orange p-5 flex items-center gap-4 min-h-[150px]">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute right-3 -top-9 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative z-[1] min-w-0 flex-1">
              <p className="text-[15px] font-bold text-white mb-1">Become a Seller</p>
              <p className="text-[12px] text-white/85 leading-snug mb-4">Start your business in minutes.</p>
              <Button variant="dark" size="sm" onClick={sellEntry.go} loading={sellEntry.loading} className="w-fit">
                Start Selling <ArrowRight size={12} className="inline align-middle ml-1" />
              </Button>
            </div>
            <div className="relative z-[1] shrink-0 w-[72px] h-[72px] rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center">
              <Store size={32} className="text-white" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-carbon p-5 flex items-center gap-4 min-h-[150px]">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-accent-violet/15" />
            <div className="absolute right-3 -top-9 w-20 h-20 rounded-full bg-accent-violet/10" />
            <div className="relative z-[1] min-w-0 flex-1">
              <p className="text-[15px] font-bold text-white mb-1">AI Commerce Tools</p>
              <p className="text-[12px] text-white/60 leading-snug mb-4">Smart features to boost your sales.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/sellers')} className="w-fit">
                Explore Tools <ArrowRight size={12} className="inline align-middle ml-1" />
              </Button>
            </div>
            <div className="relative z-[1] shrink-0 w-[72px] h-[72px] rounded-full bg-accent-violet/20 border border-accent-violet/30 flex items-center justify-center">
              <BarChart3 size={32} className="text-accent-violet" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-brand-pale-orange p-5 flex items-center gap-4 min-h-[150px]">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/40" />
            <div className="absolute right-3 -top-9 w-20 h-20 rounded-full bg-white/30" />
            <div className="relative z-[1] min-w-0 flex-1">
              <p className="text-[15px] font-bold text-carbon mb-1">Earn Rewards</p>
              <p className="text-[12px] text-charcoal/70 leading-snug mb-4">Give buyers points, tiers &amp; perks.</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/sellers')} className="w-fit">
                Explore Tools <ArrowRight size={12} className="inline align-middle ml-1" />
              </Button>
            </div>
            <div className="relative z-[1] shrink-0 w-[72px] h-[72px] rounded-full bg-white border border-white flex items-center justify-center shadow-md">
              <Gift size={32} className="text-brand-orange" />
            </div>
          </div>
        </div>
      </section>

      <ClosingCtaBanner />

      {/* ── Social Proof — real reviews only; section hides itself until there's enough real content ── */}
      {(testimonialsLoading || testimonials.length > 0) && (
        <section className="bg-cream border-t border-bone py-10 sm:py-12 lg:py-14">
          <div className="px-4 sm:px-6 lg:px-12">
            <p className="text-[11px] font-semibold text-brand-orange text-center uppercase tracking-[0.1em] mb-2">
              Trusted by creators worldwide
            </p>
            <h2 className="font-serif text-[24px] sm:text-[28px] font-bold text-carbon text-center mb-10 max-w-md mx-auto leading-[1.2]">
              Real stories from real sellers
            </h2>
            {/* flex-wrap + centered, not a fixed 3-column grid — real
               testimonial count varies, and a rigid grid left fewer-than-3
               cards stranded on the left with a lopsided empty gap instead of
               sitting centered as a deliberate row. */}
            <div className="flex flex-wrap justify-center gap-4">
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
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
