import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { AuthAppPromo } from '@/components/comman/ui/AppPromoCard';

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
  /** Shows the compact app-download card on the branding panel — Login/Register only. */
  showAppPromo?:   boolean;
  children:        ReactNode;
}

// Shared two-pane shell for auth screens: a branded panel on the left
// (desktop only) and a scrollable, vertically-centered form panel on the
// right. The outer shell is locked to the viewport height (no page-level
// scrollbar); if a form's content is ever taller than the viewport, only
// the form panel scrolls internally.
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
  showAppPromo = false,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="h-full w-full overflow-hidden bg-cream flex">

      {/* ── Branding panel (desktop only) ─────────────────────────────────── */}
      <div className={clsx('hidden lg:flex lg:w-[42%] xl:w-[38%] h-full min-w-0 relative overflow-hidden bg-gradient-to-br', panelGradient)}>
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full h-full overflow-y-auto">
          {brandingHeader ?? <SolvexoLogo size={30} variant="light" />}

          <div>
            <h2 className="font-serif text-[26px] xl:text-[32px] font-bold text-white leading-[1.15] mb-4">
              {heading}
            </h2>
            <p className="text-[13px] text-white/70 leading-[1.6] max-w-[380px] mb-8">
              {subtext}
            </p>
            {highlights.length > 0 && (
              <div className="flex flex-col gap-4">
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

            {showAppPromo && (
              <div className="mt-8">
                <AuthAppPromo />
              </div>
            )}
          </div>

          <p className="text-[11px] text-white/40">© {new Date().getFullYear()} Solvexo. All rights reserved.</p>
        </div>
      </div>

      {/* ── Form panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden flex flex-col items-center px-4 py-6 sm:py-8">
        <div className={clsx('w-full my-auto', maxWidth)}>
          {children}
        </div>
      </div>
    </div>
  );
}
