import { ArrowRight, Store, MonitorSmartphone, Sparkles, BarChart3, Unlock, Gauge, Boxes } from 'lucide-react';
import { motion, useTransform } from 'motion/react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button, Footer } from '@/components/comman/ui';
import { Reveal } from '@/components/comman/motion/Reveal';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { SplitText } from '@/components/comman/motion/SplitText';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { useMouseParallax } from '@/components/comman/motion/useMouseParallax';
import aboutImg1 from '@/assets/about/about-1.jfif';
import aboutImg2 from '@/assets/about/about-2.jfif';

const SERIF = "'Lora', Georgia, serif";

const PILLARS = [
  { Icon: Store, title: 'One workspace', desc: 'A store, POS, orders, inventory and analytics that all read from the same real data — not five separate tools stitched together.' },
  { Icon: MonitorSmartphone, title: 'Sell anywhere', desc: 'The same catalog and stock, whether a sale happens online or at an in-person counter.' },
  { Icon: Sparkles, title: 'AI where it helps', desc: 'Real, metered AI tools for the writing and analysis work that eats a seller\'s time — not a decorative label.' },
  { Icon: BarChart3, title: 'Numbers you can trust', desc: 'Every figure a seller sees is computed from their actual orders and payments, never a simulated placeholder.' },
] as const;

// Principles reflected in real, already-shipped product decisions — not
// invented company history. Deliberately kept as 3 items so the "one large
// + two stacked" asymmetric layout below has a real emphasis choice to make
// (the first value — self-serve access — is the one the rest of the page's
// story already leads into) rather than three interchangeable boxes.
const VALUES = [
  { Icon: Unlock, title: 'Access over gatekeeping', desc: 'A seller who sets up payment can start selling immediately — no manual review queue standing between signing up and going live.' },
  { Icon: Gauge, title: 'Real numbers, always', desc: 'If a dashboard shows a figure, it was computed from an actual order or payment — never a simulated or placeholder value.' },
  { Icon: Boxes, title: 'One system, not five', desc: 'Every part of the platform is built to share the same underlying data, so a seller never has to reconcile numbers between tools.' },
] as const;

// A floating stat chip that drifts a few px against the cursor inside its
// parent section — the "one deliberate surprise" for the hero, not applied
// anywhere else on the page. Desktop-only / reduced-motion-safe by way of
// `useMouseParallax` itself.
function HeroFloatingChip() {
  const { ref, px, py } = useMouseParallax<HTMLDivElement>();
  const x = useTransform(px, v => v * 24);
  const y = useTransform(py, v => v * 24);
  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none hidden lg:block" aria-hidden>
      <motion.div
        style={{ x, y }}
        className="absolute top-2 right-0 w-[190px] rounded-2xl border border-bone bg-white shadow-raised px-4 py-3.5 pointer-events-auto"
      >
        <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-1.5">One data model</p>
        <p className="text-[12px] text-carbon leading-[1.5]">Store, POS and analytics read the same real numbers.</p>
      </motion.div>
    </div>
  );
}

// Image + floating overlap chip + a few degrees of cursor-driven tilt — the
// layered/overlapping composition the two image rows share, replacing the
// old flat "image beside paragraph" symmetric grid half.
function TiltImage({ src, chip, reverseOverlap = false }: { src: string; chip: string; reverseOverlap?: boolean }) {
  const { ref, px, py } = useMouseParallax<HTMLDivElement>();
  const rotateY = useTransform(px, v => v * 6);
  const rotateX = useTransform(py, v => v * -6);
  return (
    <div ref={ref} className="relative" style={{ perspective: 800 }}>
      <motion.img
        src={src}
        alt=""
        loading="lazy"
        style={{ rotateX, rotateY }}
        className="rounded-2xl w-full object-cover aspect-[4/3] shadow-card-hover"
      />
      <div
        className={
          'absolute bg-carbon text-white rounded-xl px-4 py-3 shadow-raised max-w-[200px] hidden sm:block ' +
          (reverseOverlap ? '-bottom-5 -left-5' : '-bottom-5 -right-5')
        }
      >
        <p className="text-[11.5px] leading-[1.5] font-medium">{chip}</p>
      </div>
    </div>
  );
}

export function AboutPage() {
  usePageTitle('About');
  const sellEntry = useSellEntry();
  const FeaturedValueIcon = VALUES[0].Icon;

  return (
    <div className="bg-white min-h-full overflow-hidden">

      {/* ── Hero — asymmetric editorial spread, not a centered marketing
         block: oversized masked headline on the left, a border-quote lede
         on the right, and a cursor-parallax stat chip floating over the
         whole thing rather than sitting inside the text column. ── */}
      <section className="relative bg-cream px-4 md:px-8 lg:px-14 pt-16 md:pt-24 pb-14 md:pb-20">
        <HeroFloatingChip />
        <div className="relative max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-16 items-end">
          <div>
            <Reveal>
              <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.12em] mb-4">About Solvexo</p>
            </Reveal>
            <h1 className="text-[36px] sm:text-[52px] lg:text-[66px] font-bold text-carbon" style={{ fontFamily: SERIF, lineHeight: 1.04 }}>
              <SplitText
                text={'Commerce shouldn’t\nneed five different\nlogins.'}
                as="span"
                animateOnMount
                className="block"
              />
            </h1>
          </div>
          <div className="lg:pb-2">
            <Reveal delay={0.35}>
              <p className="text-[14.5px] sm:text-[16px] text-slate leading-[1.75] border-l-2 border-brand-orange pl-5">
                Solvexo exists because running a business online and in person usually means juggling a store builder, a POS system, an inventory tracker and an analytics tool that don&apos;t talk to each other. We built one platform where they all share the same real data instead.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Pillars — an editorial numbered list instead of a 4-up card
         grid: each row gets a full-width beat, a large index numeral, and
         its own reveal, so the eye moves down the page as a sequence
         instead of scanning four boxes at once. ── */}
      <section className="px-4 md:px-8 lg:px-14 py-16 md:py-24">
        <div className="max-w-[900px] mx-auto">
          <SectionHeading kicker="How it's built" title="Four decisions behind every screen." />
          <div className="mt-10 divide-y divide-bone">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.07}>
                <div className="group flex items-start gap-5 sm:gap-9 py-7 sm:py-8">
                  <span className="text-[13px] font-semibold text-slate/40 pt-[3px] shrink-0 w-7 tabular-nums" style={{ fontFamily: SERIF }}>
                    0{i + 1}
                  </span>
                  <p.Icon
                    size={20}
                    className="hidden sm:block text-brand-orange shrink-0 mt-[3px] transition-transform duration-normal ease-spring group-hover:-translate-y-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] sm:text-[18px] font-bold text-carbon mb-1.5" style={{ fontFamily: SERIF }}>{p.title}</p>
                    <p className="text-[13px] sm:text-[13.5px] text-slate leading-[1.7] max-w-[560px]">{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we believe — one emphasized value in a larger panel beside
         two stacked smaller ones, instead of three identical cards. ── */}
      <div className="bg-carbon px-4 md:px-8 lg:px-14 py-16 md:py-20">
        <div className="max-w-[1100px] mx-auto">
          <SectionHeading kicker="Platform philosophy" title="What we believe." tone="dark" className="mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
            <Reveal>
              <div className="rounded-[28px] bg-white/[0.05] border border-white/10 p-8 lg:p-10 h-full flex flex-col justify-between min-h-[260px]">
                <span className="w-12 h-12 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-6">
                  <FeaturedValueIcon size={22} className="text-brand-orange" />
                </span>
                <div>
                  <p className="text-[20px] sm:text-[24px] font-bold text-white mb-3 leading-[1.3]" style={{ fontFamily: SERIF }}>
                    {VALUES[0].title}
                  </p>
                  <p className="text-[14px] text-white/65 leading-[1.7] max-w-[420px]">{VALUES[0].desc}</p>
                </div>
              </div>
            </Reveal>
            <div className="flex flex-col gap-5">
              {VALUES.slice(1).map((v, i) => (
                <Reveal key={v.title} delay={0.1 + i * 0.08}>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 flex-1">
                    <span className="w-9 h-9 rounded-lg bg-brand-orange/15 flex items-center justify-center mb-4">
                      <v.Icon size={17} className="text-brand-orange" />
                    </span>
                    <p className="text-[14px] font-bold text-white mb-1.5">{v.title}</p>
                    <p className="text-[12.5px] text-white/60 leading-[1.65]">{v.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Story rows — image now overlaps a floating context chip, and
         tilts a few degrees toward the cursor for depth, instead of sitting
         flat beside a paragraph. ── */}
      <div className="bg-cream px-4 md:px-8 lg:px-14 py-16 md:py-20">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          <Reveal>
            <TiltImage src={aboutImg1} chip="No review queue — a seller with a payment method is live immediately." />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-3">Our approach</p>
            <h2 className="text-[24px] sm:text-[30px] font-bold text-carbon leading-[1.25] mb-4" style={{ fontFamily: SERIF }}>
              Self-serve, from day one.
            </h2>
            <p className="text-[14px] text-slate leading-[1.75]">
              A seller who completes onboarding and adds a payment method is live immediately — no manual approval queue standing between signing up and actually selling. We&apos;d rather earn trust through a working product than gate it behind a review process.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-14 py-16 md:py-20">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          <Reveal className="lg:order-2">
            <TiltImage src={aboutImg2} chip="Own payment gateway, custom domains, and a native POS app — all on the roadmap." reverseOverlap />
          </Reveal>
          <Reveal delay={0.1} className="lg:order-1">
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-3">Where we&apos;re headed</p>
            <h2 className="text-[24px] sm:text-[30px] font-bold text-carbon leading-[1.25] mb-4" style={{ fontFamily: SERIF }}>
              More independence for every seller.
            </h2>
            <p className="text-[14px] text-slate leading-[1.75]">
              Sellers&apos; own payment gateways, custom domains per store, and a native POS app are all real items on our roadmap — the direction is always toward a seller owning more of their own business, not less.
            </p>
          </Reveal>
        </div>
      </div>

      {/* ── Closing CTA — reuses the existing ambient-float blobs (same
         `auth-float` keyframes already used on the auth pages) instead of a
         flat carbon panel, plus a masked headline reveal. ── */}
      <div className="relative bg-carbon px-4 md:px-8 lg:px-14 py-20 md:py-24 text-center overflow-hidden">
        <div className="auth-float absolute rounded-full w-[420px] h-[420px] bg-brand-orange opacity-[0.09] -top-[120px] -left-[100px]" aria-hidden />
        <div className="auth-float-slow absolute rounded-full w-[340px] h-[340px] bg-brand-deep-orange opacity-[0.07] -bottom-[100px] right-[6%]" aria-hidden />
        <div className="relative z-[1]">
          <h2 className="text-[28px] sm:text-[38px] font-bold text-white mb-8" style={{ fontFamily: SERIF, lineHeight: 1.15 }}>
            <SplitText text="Build your business on Solvexo." wordClassName="text-white" />
          </h2>
          <Reveal delay={0.3}>
            <MagneticButton className="inline-block">
              <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading}>
                Start Selling Free <ArrowRight size={14} className="inline align-middle ml-1" />
              </Button>
            </MagneticButton>
          </Reveal>
        </div>
      </div>

      <Footer />
    </div>
  );
}
