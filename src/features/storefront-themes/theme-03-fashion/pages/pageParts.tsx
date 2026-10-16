import type { ReactNode } from 'react';
import { fashionTheme as t } from '../theme.config';

export function PageBox({ children, narrow, padY = true }: { children: ReactNode; narrow?: boolean; padY?: boolean }) {
  return (
    <div className="mx-auto" style={{ maxWidth: narrow ? 860 : t.layout.maxWidth, padding: `${padY ? 'clamp(32px, 4vw, 56px)' : '0'} ${t.layout.containerPadX}` }}>{children}</div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="grid place-items-center gap-4 px-6 py-20 text-center">
      <p className="m-0 text-base" style={{ color: t.colors.inkMuted }}>{message}</p>
      <button type="button" onClick={onRetry} className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, border: 'none', borderRadius: t.buttonRadiusPx }}>Try again</button>
    </div>
  );
}

export function PageSkeleton({ hero }: { hero?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `16px ${t.layout.containerPadX}` }}>
        {hero && <div className="animate-pulse" style={{ height: 'clamp(320px, 56vh, 560px)', background: t.colors.bgAlt, borderRadius: 28 }} />}
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse" style={{ aspectRatio: '4 / 5', background: t.colors.bgAlt, borderRadius: 16 }} />)}
        </div>
      </div>
    </div>
  );
}
