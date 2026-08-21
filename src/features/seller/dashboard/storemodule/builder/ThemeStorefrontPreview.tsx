import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import type { ThemeDefinition } from '@/api/services/themeCatalog';
import { ThemeDemoStorefront } from './ThemeDemoStorefront';

// The design-space canvas every gallery card is rendered at (real component
// tree, real pixel sizes) then scaled down to fit whatever the card's actual
// rendered width is — this is what makes the card an actual miniature
// storefront rather than a hand-drawn abstraction of one. 16:10 matches the
// card's own aspect ratio at this width.
const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 800;

/** Measures the container's real rendered width (it changes with the
 *  responsive column count — 3/2/1 per row) and returns the scale factor
 *  needed to fit `DESIGN_WIDTH` of real content into it. */
function useContainerScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DESIGN_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

/** The Theme Gallery card's preview — a real, scaled-down render of
 *  `ThemeDemoStorefront` (header + hero + a peek of the product grid; see
 *  that file for the full-size version used by `ThemePreviewPage`). Replaces
 *  the old `ThemeMockup` (abstract rectangles/lines) entirely: what's on
 *  screen here is the real component tree at real pixel sizes, just
 *  visually shrunk via `ResizeObserver`-driven `transform: scale()`. */
export function ThemeStorefrontPreview({ theme, className }: { theme: ThemeDefinition; className?: string }) {
  const { ref, scale } = useContainerScale();

  return (
    <div ref={ref} className={clsx('relative w-full overflow-hidden bg-white', className)} style={{ aspectRatio: '16 / 10' }}>
      {scale > 0 && (
        <div
          aria-hidden
          style={{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}
        >
          <ThemeDemoStorefront theme={theme} compact />
        </div>
      )}
    </div>
  );
}
