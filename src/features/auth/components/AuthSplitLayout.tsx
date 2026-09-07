import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { SolvexoLogo, SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import { Reveal, RevealStagger } from '@/components/comman/motion/Reveal';
import { BrandSplash } from '@/components/comman/motion/BrandSplash';
import { useAuthVisual } from '@/hooks/auth/useAuthVisual';
import type { AuthPageContext } from '@/api/services/auth';
import { motion, useReducedMotion } from 'motion/react';

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
  /** @deprecated No longer rendered — the branding panel's own real
   *  background photo (region-detected, see `useAuthVisual`) replaced the
   *  per-screen abstract mockup illustration this used to show. Kept in the
   *  prop type only so existing callers (`visual={<DashboardMockup/>}` etc.)
   *  don't need touching; the value is now simply ignored. */
  visual?:         ReactNode;
  /** Skips the centered maxWidth/white-card wrapper — for screens (like the seller
   *  onboarding wizard) that need the full 65% panel and manage their own inner
   *  layout/scroll (e.g. a sticky sub-header above scrolling step content). */
  bare?:           boolean;
  /** Which of the region's 3 curated background photos to show — a real,
   *  distinct (but same-region) photo per screen instead of one identical
   *  image everywhere. Defaults to `'register'` for any caller that hasn't
   *  been updated to pass this explicitly yet. */
  pageContext?:    AuthPageContext;
  children:        ReactNode;
}

// Shared two-pane shell for auth screens: a fixed 35% branding panel on the
// left (desktop only) and a 65% form panel on the right. The outer shell is
// locked to the viewport height (no page-level scrollbar, on any screen size);
// if a form's content is ever taller than the viewport, only the form panel
// scrolls internally — the branding panel never causes page-level scroll either.
//
// `fixed inset-x-0 top-0 bottom-0` (not `h-full`/`h-screen`/a `calc(100vh)`
// height) so this shell is pinned directly to the viewport, independent of
// any ancestor's computed height. A height-based approach (even one meant
// to be pixel-exact) can still drift by a pixel at some zoom levels or
// when a mobile browser's chrome shows/hides, which overflows RootLayout's
// wrapper and puts a scrollbar on the whole page; being taken out of flow
// via `fixed` makes that structurally impossible. (ReferenceNav, the
// dev-only bar this used to sit below, is disabled.)
export function AuthSplitLayout({
  panelGradient = 'from-carbon via-[#241f1b] to-brand-deep-orange',
  brandingHeader,
  heading,
  subtext,
  highlights = [],
  accentIconClass = 'text-white',
  maxWidth = 'max-w-[420px]',
  bare = false,
  pageContext = 'register',
  children,
}: AuthSplitLayoutProps) {
  const reduceMotion = useReducedMotion();
  // Real, region-appropriate background photo (IP-detected country → one of
  // a handful of curated regions, then `pageContext` picks which of that
  // region's 3 photos) — starts `null` (renders nothing extra until
  // resolved), so a slow/failed lookup never shows a broken image, just the
  // panel's existing gradient as before this feature existed.
  const visualImageUrl = useAuthVisual(pageContext);
  return (
    <div className="fixed inset-x-0 top-0 bottom-0 w-full overflow-hidden bg-cream flex flex-col lg:flex-row">
      <BrandSplash />

      {/* ── Mobile branding strip (below lg only) — centered icon, headline,
         subtext, on the same gradient/dot-grid/glow language as the desktop
         panel. Sized with vh-based clamp()s (same technique as the desktop
         panel) so it shrinks on short phone screens instead of pushing the
         form into its own internal scroll — the whole point is that no
         screen, of any height, ever needs to scroll to see the form. The
         sheet below is pulled up over its bottom edge (rounded-t + negative
         margin) for the curved hero→sheet transition, not a flat seam. */}
      <div className={clsx('lg:hidden shrink-0 relative overflow-hidden bg-gradient-to-br px-5 text-center pt-[clamp(10px,2.5vh,20px)] pb-[clamp(14px,4vh,32px)]', panelGradient)}>
        {visualImageUrl && (
          <>
            <img src={visualImageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
            <div className={clsx('absolute inset-0 bg-gradient-to-br opacity-45', panelGradient)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </>
        )}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }} />
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full bg-brand-orange/25 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-[clamp(6px,1.5vh,12px)]">
            {brandingHeader ?? <SolvexoIcon size={44} />}
          </div>

          <h2 className="font-serif text-[clamp(16px,3.2vh,22px)] font-bold text-white leading-[1.2] max-w-[300px] mb-[clamp(3px,1vh,8px)]">
            {heading}
          </h2>
          <p className="text-[clamp(10px,1.8vh,12px)] text-white/70 leading-[1.4] max-w-[300px]">
            {subtext}
          </p>
        </div>
      </div>

      {/* ── Branding column (desktop only, 60%) — Alibaba-style: the photo
         is a rounded, padded CARD floating on the page's own cream
         background, not a full-bleed panel — logo sits in that plain cream
         space above the card (dark-on-light), never overlaid on the photo.
         A custom `brandingHeader` (e.g. AdminLoginPage's Shield badge,
         styled white for a dark background) is the one exception — it
         keeps its original slot INSIDE the card, unchanged, since it isn't
         designed to sit on a light background. ───────────────────────── */}
      <div className="hidden lg:flex lg:w-[60%] h-full min-w-0 flex-col p-6 gap-3">
        {!brandingHeader && (
          <div className="shrink-0">
            <SolvexoLogo size={40} variant="dark" />
          </div>
        )}

        <div className={clsx('relative flex-1 min-h-0 overflow-hidden rounded-3xl bg-gradient-to-br', panelGradient)}>
          {/* Real, region-appropriate background photo — sits below
             everything else in this card. `mix-blend-soft-light` at low
             opacity nudges the photo's color mood toward Solvexo's own
             brand gradient WITHOUT crushing dark photos to near-black the
             way a strong `multiply` blend does (a real, visually-confirmed
             regression from an earlier pass — several of the curated
             region photos are already moody/night shots, and multiplying a
             dark gradient onto an already-dark photo compounds toward pure
             black, making the photo unrecognizable). A light bottom-only
             vignette (normal blend) sits on top purely for text legibility
             where the headline/highlights/copyright actually are — every
             photo, bright or dark, must stay genuinely visible. */}
          {visualImageUrl && (
            <>
              <img src={visualImageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
              <div className={clsx('absolute inset-0 bg-gradient-to-br opacity-30 mix-blend-soft-light', panelGradient)} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            </>
          )}
          {/* Dot-grid texture */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }} />
          {/* Ambient glow — subtle enterprise polish, consistent across every auth screen */}
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand-orange/20 blur-3xl auth-glow-pulse pointer-events-none" />
          <div className="absolute -top-20 -right-10 w-56 h-56 rounded-full bg-white/[0.06] blur-3xl pointer-events-none" />

          {/* `overflow-hidden` (not `overflow-y-auto`) + clamp()-based, viewport-height-
             relative sizing below — this content must always fit, never scroll, on any
             screen height, so every gap/font-size (and each mockup's own padding, see
             AuthMockups.tsx) shrinks together as the panel shrinks rather than
             overflowing and needing a scrollbar. */}
          <div className="relative z-10 flex flex-col justify-between h-full w-full overflow-hidden p-[clamp(16px,3vh,40px)]">
            {brandingHeader ?? <div />}

            <div className="min-h-0 overflow-hidden">
              <Reveal delay={0}>
                <div className="w-10 h-[3px] rounded-full bg-brand-orange mb-[clamp(12px,2vh,18px)]" />
              </Reveal>
              <Reveal delay={0.03}>
                <h2 className="font-serif text-[clamp(24px,3.6vh,40px)] font-bold text-white leading-[1.1] tracking-tight mb-[clamp(12px,1.8vh,18px)]" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
                  {heading}
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="text-[clamp(12px,1.5vh,14.5px)] text-white/80 leading-[1.65] max-w-[380px] mb-[clamp(18px,2.6vh,28px)]">
                  {subtext}
                </p>
              </Reveal>
              {highlights.length > 0 && (
                <RevealStagger className="flex flex-col gap-[clamp(12px,1.8vh,18px)] mb-2" step={0.06} y={8}>
                  {highlights.map(({ Icon, text }) => (
                    <div key={text} className="group flex items-center gap-3.5 transition-transform duration-200 hover:translate-x-1">
                      <div className="size-[30px] rounded-full ring-1 ring-white/25 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:ring-brand-orange/60 group-hover:bg-brand-orange/15">
                        <Icon size={14} className={clsx(accentIconClass, 'transition-colors duration-200')} />
                      </div>
                      <span className="text-[13px] font-medium text-white/90 leading-[1.4]">{text}</span>
                    </div>
                  ))}
                </RevealStagger>
              )}

            </div>

            <p className="text-[11px] text-white/40 shrink-0">© {new Date().getFullYear()} Solvexo. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* ── Form panel (65%) — scrollbar always hidden; fluid padding keeps
         typical form content fitting without needing to scroll on short
         screens, and on the rare oversized form only the invisible-scrollbar
         internal scroll (never a visible bar, never the page) kicks in. ── */}
      {bare ? (
        <div data-lenis-prevent className={clsx(
          'flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col',
          'rounded-t-[28px] -mt-6 relative z-10 bg-cream shadow-[0_-6px_20px_rgba(0,0,0,0.06)]',
          'lg:rounded-none lg:mt-0 lg:shadow-none',
        )}>
          {children}
        </div>
      ) : (
        <div data-lenis-prevent className={clsx(
          'flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col items-center px-4 py-[clamp(12px,3vh,32px)]',
          'rounded-t-[28px] -mt-6 relative z-10 bg-cream shadow-[0_-6px_20px_rgba(0,0,0,0.06)]',
          'lg:rounded-none lg:mt-0 lg:shadow-none',
        )}>
          <motion.div
            className={clsx('w-full my-auto', maxWidth)}
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </div>
  );
}
