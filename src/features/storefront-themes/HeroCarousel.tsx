import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { usePreviewInspector } from './previewInspector';

/** Section-level settings of the `hero` (Slideshow) section — mirrors Shopify's
 *  Slideshow: autoplay + speed, arrows, pagination style, slide/fade transition. */
export interface HeroCarouselSettings {
  heightPreset?: 'small' | 'medium' | 'large' | 'adapt';
  mobileHeightPreset?: 'same' | 'small' | 'medium' | 'large' | 'adapt';
  mobileTextLayout?: 'overlay' | 'below';
  autoplay?: boolean;
  autoplaySeconds?: number;
  /** Off unless the seller turns it on. */
  showArrows?: boolean;
  /** Off unless the seller turns it on (only meaningful with autoplay). */
  showPauseButton?: boolean;
  pagination?: 'dots' | 'counter' | 'none';
  transition?: 'slide' | 'fade';
}

export interface HeroCarouselColors {
  /** Active pagination dot / counter text. */
  active: string;
  inactive: string;
  /** Round arrow / pause button background and icon colour. */
  controlBg: string;
  controlFg: string;
}

const MIN_SECONDS = 3;
const MAX_SECONDS = 10;
const SWIPE_PX = 50;

function clampSeconds(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 5;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, n));
}

/** Shopify-style slideshow shell shared by both themes: each theme renders its own
 *  slides and passes them in. Autoplay (on unless the seller turns it off), pause on
 *  hover/focus/touch + an explicit pause button, prev/next arrows, swipe, keyboard
 *  arrows, dots/counter pagination, slide or fade transition. Autoplay is skipped for
 *  `prefers-reduced-motion` users and inside the theme-editor preview (where the
 *  selected block's slide is shown instead). */
export function HeroCarousel({ slides, blockIds, settings, colors }: {
  slides: ReactNode[];
  /** Same order as `slides` — lets the editor preview jump to the block being edited. */
  blockIds: string[];
  settings: HeroCarouselSettings;
  colors: HeroCarouselColors;
}) {
  const inspector = usePreviewInspector();
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const autoplay = settings.autoplay !== false && !inspector;
  const seconds = clampSeconds(settings.autoplaySeconds);
  const showArrows = settings.showArrows === true;
  const showPause = settings.showPauseButton === true && settings.autoplay !== false && !inspector;
  const pagination = settings.pagination ?? 'dots';
  const fade = settings.transition === 'fade';
  // Editor preview: show the slide whose block is selected in the sidebar.
  const selectedIndex = inspector?.selectedBlockId ? blockIds.indexOf(inspector.selectedBlockId) : -1;
  const current = selectedIndex >= 0 ? selectedIndex : Math.min(active, count - 1);

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);

  const running = autoplay && count > 1 && !hovered && !userPaused;
  useEffect(() => {
    if (!running) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Restarts whenever the slide changes, so a manual click gets a full interval.
    const id = window.setTimeout(() => setActive(a => (a + 1) % count), seconds * 1000);
    return () => window.clearTimeout(id);
  }, [running, seconds, count, current]);

  if (count === 0) return null;

  const controlStyle = {
    width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: colors.controlBg, color: colors.controlFg,
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
  } as const;

  return (
    // Standard carousel pattern (WAI-ARIA APG): the region itself takes arrow-key / hover / swipe
    // input, so the two a11y lint rules about non-interactive elements don't apply here.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="relative overflow-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Slideshow"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft') go(current - 1);
        else if (e.key === 'ArrowRight') go(current + 1);
      }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; setHovered(true); }}
      onTouchEnd={e => {
        const start = touchX.current;
        touchX.current = null;
        setHovered(false);
        if (start == null || count < 2) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) >= SWIPE_PX) go(current + (dx < 0 ? 1 : -1));
      }}
      style={{ outline: 'none', touchAction: 'pan-y' }}
    >
      {fade ? (
        <div style={{ display: 'grid' }} aria-live={running ? 'off' : 'polite'}>
          {slides.map((slide, i) => (
            <div
              key={blockIds[i] ?? i}
              aria-hidden={i !== current}
              style={{
                gridArea: '1 / 1', opacity: i === current ? 1 : 0, visibility: i === current ? 'visible' : 'hidden',
                transition: 'opacity 600ms ease, visibility 600ms',
              }}
            >{slide}</div>
          ))}
        </div>
      ) : (
        <div
          style={{ display: 'flex', transform: `translateX(-${current * 100}%)`, transition: 'transform 500ms ease' }}
          aria-live={running ? 'off' : 'polite'}
        >
          {slides.map((slide, i) => (
            <div key={blockIds[i] ?? i} aria-hidden={i !== current} style={{ flex: '0 0 100%', minWidth: 0 }}>{slide}</div>
          ))}
        </div>
      )}

      {count > 1 && showArrows && (
        <>
          <button type="button" aria-label="Previous slide" onClick={() => go(current - 1)}
            className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-5" style={controlStyle}><ChevronLeft size={20} /></button>
          <button type="button" aria-label="Next slide" onClick={() => go(current + 1)}
            className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-5" style={controlStyle}><ChevronRight size={20} /></button>
        </>
      )}

      {count > 1 && (pagination !== 'none' || showPause) && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {showPause && (
            <button type="button" aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}
              onClick={() => setUserPaused(p => !p)} style={{ ...controlStyle, width: 28, height: 28 }}>
              {userPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          )}
          {pagination === 'dots' && (
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button key={blockIds[i] ?? i} type="button" aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === current} onClick={() => go(i)}
                  className="cursor-pointer border-0 p-0"
                  style={{ width: i === current ? 22 : 8, height: 8, borderRadius: 9999, transition: 'width 200ms',
                    background: i === current ? colors.active : colors.inactive }} />
              ))}
            </div>
          )}
          {pagination === 'counter' && (
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.controlFg, background: colors.controlBg, padding: '3px 10px', borderRadius: 9999 }}>
              {current + 1} / {count}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
