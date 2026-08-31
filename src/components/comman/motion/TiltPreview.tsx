import type { ReactNode } from 'react';
import { motion, useTransform } from 'motion/react';
import { useMouseParallax } from './useMouseParallax';

// A few degrees of cursor-driven 3D tilt for a hero product preview / image —
// the shared depth mechanic behind AboutPage's story-row images and any
// marketing-hero mockup, so every page that wants "this preview responds to
// you" gets the identical feel instead of a bespoke per-page reimplementation.
// Desktop-only / reduced-motion-safe via `useMouseParallax` itself.
export function TiltPreview({ children, className, maxDegrees = 6 }: {
  children: ReactNode;
  className?: string;
  maxDegrees?: number;
}) {
  const { ref, px, py } = useMouseParallax<HTMLDivElement>();
  const rotateY = useTransform(px, v => v * maxDegrees);
  const rotateX = useTransform(py, v => v * -maxDegrees);

  return (
    <div ref={ref} className={className} style={{ perspective: 900 }}>
      <motion.div style={{ rotateX, rotateY }}>
        {children}
      </motion.div>
    </div>
  );
}
