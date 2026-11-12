import { type CSSProperties, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Lock, Rocket, type LucideIcon } from 'lucide-react';
import { SolvexoLogo, SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import { Reveal, RevealStagger } from '@/components/comman/motion/Reveal';
import { BrandSplash } from '@/components/comman/motion/BrandSplash';
import { useAuthVisual } from '@/hooks/auth/useAuthVisual';
import type { AuthPageContext, AuthVisualTopic } from '@/api/services/auth';
import { motion, useReducedMotion } from 'motion/react';
import { useSiteText } from '@/i18n/site/useSiteText';
import { AUTH_LAYOUT_TEXT } from './AuthSplitLayout.text';

interface AuthHighlight {
  Icon: LucideIcon;
  text: string;
}

interface AuthSplitLayoutProps {
  panelGradient?:  string;
  brandingHeader?: ReactNode;
  heading:         ReactNode;
  subtext:         string;
  highlights?:     AuthHighlight[];
  accentIconClass?: string;
  maxWidth?:       string;
  /** Skips the centered maxWidth wrapper (and the S mark / "safe" pill) — for
   *  screens (like the seller onboarding wizard) that need the whole form
   *  card and manage their own inner layout/scroll. */
  bare?:           boolean;
  /** Which of the region's curated background photos to show. */
  pageContext?:    AuthPageContext;
  /** Seller kind chosen earlier in onboarding (used by `onboarding_products`). */
  visualTopic?:    AuthVisualTopic;
  children:        ReactNode;
}

// Shared auth shell. Desktop: soft peach page with orange waves, a big photo
// card on the left (pill, sans heading with an underlined accent word,
// highlights) and a form card on the right that is only as tall as its form
// and sits in the vertical middle. Flat on purpose: no shadows, no 3D shapes,
// no top navbar / bottom bar. Vivid orange, input and button styling for this
// shell lives in index.css under `.auth-shell` / `.auth-hero-heading`.
// Mobile: photo strip on top with the form sheet pulled up over it.
//
// `fixed inset-x-0 top-0 bottom-0` pins the shell to the viewport so it can
// never add a page-level scrollbar; only the form card scrolls internally if
// a form is ever taller than the screen.
export function AuthSplitLayout({
  panelGradient = 'from-carbon via-[#241f1b] to-brand-deep-orange',
  brandingHeader,
  heading,
  subtext,
  highlights = [],
  accentIconClass = 'text-brand-orange',
  maxWidth = 'max-w-[400px]',
  bare = false,
  pageContext = 'register',
  visualTopic,
  children,
}: AuthSplitLayoutProps) {
  const reduceMotion = useReducedMotion();
  const t = useSiteText(AUTH_LAYOUT_TEXT);
  // Real, region-appropriate photo; stays null until resolved so a slow or
  // failed lookup just shows the card's own gradient.
  const { imageUrl: visualImageUrl } = useAuthVisual(pageContext, visualTopic);
  return (
    <div
      className="auth-shell fixed inset-x-0 top-0 bottom-0 w-full overflow-hidden bg-gradient-to-br from-[#fffaf7] via-[#fbece4] to-[#f4d2c3] flex flex-col lg:flex-row"
      style={{ '--auth-card-w': bare ? '680px' : '500px' } as CSSProperties}
    >
      <BrandSplash />

      {/* Flat decorative waves (desktop only). */}
      <svg aria-hidden className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path d="M0 740 C 220 680 420 830 700 790 C 980 750 1180 630 1440 690 L1440 900 L0 900 Z" fill="#D97757" fillOpacity="0.12" />
        <path d="M0 820 C 300 770 520 885 820 845 C 1100 808 1260 750 1440 795 L1440 900 L0 900 Z" fill="#D97757" fillOpacity="0.18" />
        <path d="M1440 0 L1440 260 C 1320 220 1210 130 1150 0 Z" fill="#D97757" fillOpacity="0.16" />
        <path d="M1440 640 C 1360 700 1330 800 1300 900 L1440 900 Z" fill="#D97757" fillOpacity="0.30" />
        <path d="M0 0 L0 160 C 70 130 130 70 150 0 Z" fill="#D97757" fillOpacity="0.14" />
      </svg>

      {/* ── Mobile branding strip (below lg only). Sized with vh-based clamp()s
         so it shrinks on short phone screens instead of pushing the form into
         its own internal scroll. The sheet below is pulled up over its bottom
         edge for the curved hero→sheet transition. */}
      <div className={clsx('lg:hidden shrink-0 relative overflow-hidden bg-gradient-to-br px-5 text-center pt-[clamp(10px,2.5vh,20px)] pb-[clamp(14px,4vh,32px)]', panelGradient)}>
        {visualImageUrl && (
          <>
            <img src={visualImageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
            <div className={clsx('absolute inset-0 bg-gradient-to-br opacity-45', panelGradient)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </>
        )}

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-[clamp(6px,1.5vh,12px)]">
            {brandingHeader ?? <SolvexoLogo size={40} variant="light" />}
          </div>

          <h2 className="font-sans font-extrabold text-[clamp(18px,3.2vh,24px)] text-white leading-[1.2] max-w-[300px] mb-[clamp(3px,1vh,8px)]">
            {heading}
          </h2>
          <p className="text-[clamp(10px,1.8vh,12px)] text-white/70 leading-[1.4] max-w-[300px]">
            {subtext}
          </p>
        </div>
      </div>

      {/* ── Branding column (desktop only): logo on the peach page, photo card
         below it. A custom `brandingHeader` (e.g. AdminLoginPage's Shield
         badge) keeps its original slot inside the card. ───────────────── */}
      <div className="hidden lg:flex lg:w-[calc(100%_-_var(--auth-card-w)_+_96px)] h-full min-w-0 flex-col p-6 pe-0 gap-4 relative z-10">
        {!brandingHeader && (
          <div className="shrink-0 ps-2">
            <SolvexoLogo size={48} variant="dark" />
          </div>
        )}

        <div className={clsx('relative flex-1 min-h-0 overflow-hidden rounded-s-[44px] bg-gradient-to-br', panelGradient)}>
          {visualImageUrl && (
            <>
              <img src={visualImageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
              {/* Darker on the text side (left) so white copy always reads. */}
              <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-black/70 via-black/35 to-black/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <div className="absolute inset-y-0 end-0 w-[24%] bg-gradient-to-l rtl:bg-gradient-to-r from-[#FBECE4] via-[#FBECE4]/35 to-transparent" />
            </>
          )}

          {/* Content must always fit, never scroll: every gap/font-size is
             viewport-height relative. */}
          <div className="relative z-10 flex flex-col justify-center h-full w-full overflow-hidden px-[clamp(28px,5vw,72px)] pt-[clamp(24px,4vh,48px)] pb-[clamp(90px,17vh,170px)]">
            {brandingHeader && <div className="mb-6">{brandingHeader}</div>}

            <div className="min-h-0 overflow-hidden">
              <Reveal delay={0}>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange bg-black/25 px-5 py-2 text-[14px] font-semibold text-white mb-[clamp(14px,2.6vh,26px)]">
                  {t.pill} <Rocket size={15} className="text-brand-orange" />
                </span>
              </Reveal>
              <Reveal delay={0.03}>
                <h2 className="auth-hero-heading font-sans font-extrabold text-[clamp(36px,7vh,76px)] text-white leading-[1.04] tracking-tight mb-[clamp(14px,2.4vh,24px)] max-w-[620px]">
                  {heading}
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="text-[clamp(14px,1.9vh,18px)] text-white/90 leading-[1.55] max-w-[460px] mb-[clamp(20px,3.4vh,36px)]">
                  {subtext}
                </p>
              </Reveal>
              {highlights.length > 0 && (
                <RevealStagger className="flex flex-col gap-[clamp(10px,1.8vh,18px)] mb-2" step={0.06} y={8}>
                  {highlights.map(({ Icon, text }) => (
                    <div key={text} className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-black/35 ring-1 ring-white/15 flex items-center justify-center shrink-0">
                        <Icon size={22} className={accentIconClass} />
                      </div>
                      <span className="text-[16px] font-medium text-white leading-[1.4]">{text}</span>
                    </div>
                  ))}
                </RevealStagger>
              )}
            </div>
          </div>

          {/* Soft wave sweeping over the bottom of the photo (peach + orange),
             same language as the page background, so the card flows into it. */}
          <svg aria-hidden className="absolute inset-x-0 bottom-0 w-full h-[22%] pointer-events-none z-[5]" viewBox="0 0 1000 220" preserveAspectRatio="none">
            <defs>
              <linearGradient id="auth-wave-orange" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#D97757" stopOpacity="0.85" />
                <stop offset="1" stopColor="#E8A58C" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path d="M0 120 C 180 60 340 170 560 130 C 760 95 880 40 1000 80 L1000 220 L0 220 Z" fill="url(#auth-wave-orange)" />
            <path d="M0 165 C 200 120 380 205 600 170 C 800 140 910 110 1000 135 L1000 220 L0 220 Z" fill="#FBECE4" fillOpacity="0.96" />
          </svg>
        </div>
      </div>

      {/* ── Form side. Mobile: bottom sheet over the photo strip. Desktop: a
         rounded white card that is only as tall as its form (centered), or the
         full height for the onboarding wizard (`bare`). Scrollbar hidden. */}
      <div className={clsx('flex-1 min-w-0 min-h-0 flex flex-col relative z-20 lg:flex-none lg:w-[calc(var(--auth-card-w)_+_24px)] lg:-ms-[120px] lg:pe-6 lg:pb-6', brandingHeader ? 'lg:pt-6' : 'lg:pt-[88px]')}>
        <div data-lenis-prevent className={clsx(
          'flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col',
          'rounded-t-[28px] -mt-6 bg-cream',
          'lg:mt-0 lg:rounded-[44px] lg:bg-white/70 lg:backdrop-blur-xl lg:border lg:border-white lg:outline lg:outline-[6px] lg:outline-white/40',
          'lg:h-full lg:w-full',
          bare
            ? ''
            : 'items-center px-4 py-[clamp(12px,3vh,32px)] lg:px-10 lg:py-9',
        )}>
          {bare ? children : (
            <motion.div
              className={clsx(
                'w-full my-auto',
                maxWidth,
                'lg:[&_h1]:text-[30px] lg:[&_h1]:leading-[1.1] lg:[&_h1]:font-extrabold lg:[&_h1]:mb-2',
                'lg:[&_h1+p]:text-[15px] lg:[&_h1+p]:text-carbon lg:[&_h1+p]:font-medium lg:[&_h1+p]:mb-4',
                'lg:[&_label]:text-[13px] lg:[&_label]:font-semibold',
              )}
              initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="hidden lg:block mb-5">
                <SolvexoIcon size={46} />
              </div>
              {children}
              <p className="mt-6 pt-5 border-t border-[#EDE3DB] flex items-center justify-center gap-2 text-[12px] text-slate">
                <Lock size={13} className="shrink-0" /> {t.secure}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
