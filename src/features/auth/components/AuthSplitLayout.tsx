import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';

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
  /** Unique per-screen branding illustration (marketplace grid, dashboard preview, security badge, etc). */
  visual?:         ReactNode;
  /** Skips the centered maxWidth/white-card wrapper — for screens (like the seller
   *  onboarding wizard) that need the full 65% panel and manage their own inner
   *  layout/scroll (e.g. a sticky sub-header above scrolling step content). */
  bare?:           boolean;
  children:        ReactNode;
}

// Shared two-pane shell for auth screens: a fixed 35% branding panel on the
// left (desktop only) and a 65% form panel on the right. The outer shell is
// locked to the viewport height (no page-level scrollbar, on any screen size);
// if a form's content is ever taller than the viewport, only the form panel
// scrolls internally — the branding panel never causes page-level scroll either.
//
// `fixed inset-x-0 top-[44px] bottom-0` (not `h-full`/`h-screen`/a `calc(100vh - 44px)`
// height) so this shell is pinned directly to the viewport below the 44px
// ReferenceNav bar, independent of any ancestor's computed height. A height-based
// approach (even one meant to be pixel-exact) can still drift by a pixel at some
// zoom levels or when a mobile browser's chrome shows/hides, which overflows
// RootLayout's wrapper and puts a scrollbar on the whole page; being taken out
// of flow via `fixed` makes that structurally impossible.
export function AuthSplitLayout({
  panelGradient = 'from-carbon via-[#241f1b] to-brand-deep-orange',
  brandingHeader,
  heading,
  subtext,
  highlights = [],
  accentIconClass = 'text-white',
  maxWidth = 'max-w-[420px]',
  visual,
  bare = false,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className={clsx('fixed inset-x-0 bottom-0 w-full overflow-hidden bg-cream flex', import.meta.env.DEV ? 'top-[44px]' : 'top-0')}>

      {/* ── Branding panel (desktop only, fixed 35%) ───────────────────────── */}
      <div className={clsx('hidden lg:flex lg:w-[35%] h-full min-w-0 relative overflow-hidden bg-gradient-to-br', panelGradient)}>
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
          {brandingHeader ?? <SolvexoLogo size={38} variant="light" />}

          <div className="min-h-0 overflow-hidden">
            <h2 className="font-serif text-[clamp(20px,3vh,34px)] font-bold text-white leading-[1.15] mb-[clamp(10px,1.4vh,14px)]">
              {heading}
            </h2>
            <p className="text-[clamp(11px,1.4vh,13px)] text-white/70 leading-[1.6] max-w-[360px] mb-[clamp(14px,2.2vh,24px)]">
              {subtext}
            </p>
            {highlights.length > 0 && (
              <div className="flex flex-col gap-[clamp(8px,1.4vh,14px)] mb-2">
                {highlights.map(({ Icon, text }) => (
                  <div key={text} className="group flex items-center gap-3 transition-transform duration-200 ease-out hover:translate-x-0.5">
                    <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-brand-orange/20">
                      <Icon size={16} className={clsx(accentIconClass, 'transition-colors duration-200 group-hover:text-brand-orange')} />
                    </div>
                    <span className="text-[12.5px] text-white/85 leading-[1.4]">{text}</span>
                  </div>
                ))}
              </div>
            )}

            {visual && (
              <div className="mt-[clamp(8px,2vh,24px)]">
                {visual}
              </div>
            )}
          </div>

          <p className="text-[11px] text-white/40 shrink-0">© {new Date().getFullYear()} Solvexo. All rights reserved.</p>
        </div>
      </div>

      {/* ── Form panel (65%) — scrollbar always hidden; fluid padding keeps
         typical form content fitting without needing to scroll on short
         screens, and on the rare oversized form only the invisible-scrollbar
         internal scroll (never a visible bar, never the page) kicks in. ── */}
      {bare ? (
        <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col">
          {children}
        </div>
      ) : (
        <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col items-center px-4 py-[clamp(12px,3vh,32px)]">
          <div className={clsx('w-full my-auto', maxWidth)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
