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
// locked to the viewport height (no page-level scrollbar); if a form's
// content is ever taller than the viewport, only the form panel scrolls
// internally — the branding panel never causes page-level scroll either.
//
// `h-full` (not `h-screen` or a manual `calc(100vh - 44px)`) so this
// shell exactly fills RootLayout's content wrapper — that wrapper already
// reserves the 44px fixed ReferenceNav bar via its own height, so this
// stays pixel-exact instead of drifting by 1px at some browser zoom levels.
export function AuthSplitLayout({
  panelGradient = 'from-carbon via-[#241F1B] to-brand-deep-orange',
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
    <div className="h-full w-full overflow-hidden bg-cream flex">

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

        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-10 w-full h-full overflow-y-auto">
          {brandingHeader ?? <SolvexoLogo size={30} variant="light" />}

          <div>
            <h2 className="font-serif text-[24px] xl:text-[28px] font-bold text-white leading-[1.15] mb-3.5">
              {heading}
            </h2>
            <p className="text-[13px] text-white/70 leading-[1.6] max-w-[360px] mb-6">
              {subtext}
            </p>
            {highlights.length > 0 && (
              <div className="flex flex-col gap-3.5 mb-2">
                {highlights.map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 transition-transform duration-200 ease-out hover:translate-x-0.5">
                    <div className="size-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon size={14} className={accentIconClass} />
                    </div>
                    <span className="text-[12.5px] text-white/85 leading-[1.4]">{text}</span>
                  </div>
                ))}
              </div>
            )}

            {visual && <div className="mt-6">{visual}</div>}
          </div>

          <p className="text-[11px] text-white/40">© {new Date().getFullYear()} Solvexo. All rights reserved.</p>
        </div>
      </div>

      {/* ── Form panel (65%) — internal scroll only, never the page ───────── */}
      {bare ? (
        <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden flex flex-col">
          {children}
        </div>
      ) : (
        <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden flex flex-col items-center px-4 py-6 sm:py-8">
          <div className={clsx('w-full my-auto', maxWidth)}>
            <div className="bg-white rounded-2xl shadow-card border border-bone/60 p-5 sm:p-7 lg:p-8">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
