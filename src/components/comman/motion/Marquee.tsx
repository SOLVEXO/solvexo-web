import type { ReactNode } from 'react';
import { clsx } from 'clsx';

// Continuous horizontal marquee — the content is rendered twice back-to-
// back and the whole track translates by exactly -50% via the `marquee-x`
// keyframe (index.css), so the loop point is seamless. Pauses on hover.
// Respects prefers-reduced-motion through the app-wide CSS rule (which
// zeroes every animation-duration), so under that setting the track just
// sits still rather than needing a separate JS guard.
export function Marquee({ children, duration = 32, className }: {
  children: ReactNode;
  duration?: number;
  className?: string;
}) {
  const row = <span className="flex shrink-0 items-center">{children}</span>;
  return (
    <div className={clsx('group relative flex overflow-hidden', className)}>
      <div
        className="flex w-max will-change-transform group-hover:[animation-play-state:paused]"
        style={{ animation: `marquee-x ${duration}s linear infinite` }}
      >
        {row}
        {row}
      </div>
    </div>
  );
}
