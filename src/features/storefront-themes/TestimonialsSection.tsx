import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { Block } from '@/api/services/storefrontTypes';
import { PreviewBlock } from './previewInspector';

/** Generic colour/font tokens a theme hands to <TestimonialsSection>, so the
 *  section looks native in every theme without this file knowing any theme. */
export interface TestimonialTokens {
  ink: string;
  inkMuted: string;
  bg: string;
  bgAlt: string;
  accent: string;
  displayFont?: string;
  bodyFont?: string;
  /** Card surface. Defaults to `bgAlt` (what all three themes used before). */
  cardBackground?: string;
  cardRadius?: number;
  cardShadow?: string;
  cardPadding?: number;
  /** Optional translator (the theme's `ts`) for the star aria-label. */
  t?: (key: string, fallback: string, vars?: Record<string, unknown>) => string;
}

type ImagePosition = 'top' | 'left' | 'right' | 'bottom' | 'none';
const IMAGE_POSITIONS: readonly string[] = ['top', 'left', 'right', 'bottom', 'none'];

/** Static class strings (Tailwind can't see a computed `lg:grid-cols-${n}`). */
const COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  7: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7',
  8: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8',
};

const clampColumns = (value: unknown): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 3;
  return Math.min(8, Math.max(1, n));
};

const clampSeconds = (value: unknown): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 5;
  return Math.min(10, Math.max(3, n));
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Stars({ rating, color, label }: { rating: unknown; color: string; label: string }) {
  const r = Math.min(5, Math.max(0, Number(rating) || 0));
  if (r === 0) return null;
  return (
    <div className="flex gap-0.5" aria-label={label}>
      {Array.from({ length: 5 }).map((_, k) => (
        <Star key={k} size={15} fill={k < r ? color : 'none'} stroke={color} aria-hidden />
      ))}
    </div>
  );
}

/** One testimonial card. `as` keeps the markup valid: `li` inside the grid's
 *  `ul`, `div` inside the carousel track. */
function TestimonialCard({ block, index, settings, tokens, as = 'li' }: {
  block: Block;
  index: number;
  settings: Record<string, unknown>;
  tokens: TestimonialTokens;
  as?: 'li' | 'div';
}) {
  const s = block.settings;
  const raw = settings.imagePosition;
  const imagePosition: ImagePosition = IMAGE_POSITIONS.includes(String(raw)) ? (raw as ImagePosition) : 'top';
  const textAlign = settings.textAlign === 'left' || settings.textAlign === 'right' ? settings.textAlign : 'center';
  const hasAvatar = !!s.avatarUrl && imagePosition !== 'none';
  const Wrapper = as as ElementType;

  const avatar = hasAvatar ? (
    <img
      src={s.avatarUrl}
      alt=""
      loading="lazy"
      className="rounded-full object-cover"
      style={{ width: 56, height: 56, flexShrink: 0 }}
    />
  ) : null;

  const name = (
    <div style={{ textAlign }}>
      <div className="text-[13px] font-semibold" style={{ color: tokens.ink, fontFamily: tokens.bodyFont }}>
        {s.authorName}{(s.authorRole || s.role) ? ` · ${s.authorRole || s.role}` : ''}
      </div>
      {s.subtitle && <div className="text-[12px]" style={{ color: tokens.inkMuted }}>{s.subtitle}</div>}
    </div>
  );

  const figcaption = (
    <figcaption
      className="flex items-center gap-3"
      style={{ justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start' }}
    >
      {(imagePosition === 'left' || imagePosition === 'right') && avatar}
      {name}
    </figcaption>
  );

  const stars = (
    <Stars
      rating={s.rating}
      color={tokens.accent}
      label={tokens.t
        ? tokens.t('reviews.outOf5', '{{value}} out of 5 stars', { value: Math.min(5, Math.max(0, Number(s.rating) || 0)) })
        : `${Math.min(5, Math.max(0, Number(s.rating) || 0))} out of 5 stars`}
    />
  );

  const title = s.title ? (
    <h4 className="m-0 text-[16px] font-semibold" style={{ color: tokens.ink, fontFamily: tokens.displayFont }}>{s.title}</h4>
  ) : null;
  const quote = s.quote ? (
    <blockquote className="m-0 text-[16px] leading-[1.6]" style={{ color: tokens.ink, fontFamily: tokens.displayFont }}>“{s.quote}”</blockquote>
  ) : null;
  const description = s.description ? (
    <p className="m-0 text-[14px] leading-[1.6]" style={{ color: tokens.inkMuted }}>{s.description}</p>
  ) : null;

  const stacked = imagePosition === 'top' || imagePosition === 'bottom' || imagePosition === 'none';
  const align: CSSProperties['alignItems'] = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start';
  const style: CSSProperties = {
    background: tokens.cardBackground ?? tokens.bgAlt,
    borderRadius: tokens.cardRadius,
    boxShadow: tokens.cardShadow,
    padding: tokens.cardPadding ?? 28,
    display: 'flex',
    flexDirection: stacked ? 'column' : imagePosition === 'right' ? 'row-reverse' : 'row',
    alignItems: stacked ? align : 'flex-start',
    gap: 16,
    textAlign,
    height: '100%',
  };

  const body = (
    <>
      {imagePosition === 'top' && avatar}
      {stars}
      {title}
      {quote}
      {description}
      {figcaption}
      {imagePosition === 'bottom' && avatar}
    </>
  );

  return (
    <Wrapper style={{ height: '100%' }}>
      <PreviewBlock blockId={block._id ?? String(index)}>
        <figure className="m-0" style={style}>
          {stacked ? body : (
            <>
              {imagePosition === 'left' && avatar}
              <div className="flex flex-col gap-3" style={{ minWidth: 0 }}>
                {stars}
                {title}
                {quote}
                {description}
                {figcaption}
              </div>
            </>
          )}
        </figure>
      </PreviewBlock>
    </Wrapper>
  );
}

/** Auto-rotating carousel: arrows + dots, slide or fade, pauses on hover/focus. */
function TestimonialCarousel({ items, settings, tokens }: {
  items: Block[];
  settings: Record<string, unknown>;
  tokens: TestimonialTokens;
}) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(prefersReducedMotion);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A block removed in the editor must never leave the index past the end.
  const current = count ? active % count : 0;

  const autoplay = settings.autoplay !== false && !reduced;
  const seconds = clampSeconds(settings.autoplaySeconds);
  const showArrows = settings.showArrows !== false;
  const showDots = settings.pagination !== 'none';
  const fade = settings.transition === 'fade';

  useEffect(() => {
    if (!autoplay || paused || count <= 1) return;
    timer.current = setTimeout(() => setActive(a => (a + 1) % count), seconds * 1000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [autoplay, paused, count, seconds, active]);

  const go = (index: number) => setActive(((index % count) + count) % count);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        {fade ? (
          // Every slide sits in the same grid cell, so the box is as tall as
          // the tallest slide and nothing collapses (no absolute positioning).
          <div className="grid">
            {items.map((b, i) => (
              <div
                key={b._id ?? i}
                style={{
                  gridArea: '1 / 1',
                  opacity: i === current ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                  pointerEvents: i === current ? 'auto' : 'none',
                }}
                aria-hidden={i !== current}
              >
                <TestimonialCard block={b} index={i} settings={settings} tokens={tokens} as="div" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="m-0 flex list-none p-0" style={{ transition: 'transform 0.5s ease', transform: `translateX(-${current * 100}%)` }}>
            {items.map((b, i) => (
              <TestimonialCard key={b._id ?? i} block={b} index={i} settings={settings} tokens={tokens} />
            ))}
          </ul>
        )}
      </div>

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => go(current - 1)}
            className="absolute top-1/2 -translate-y-1/2 rounded-full p-2"
            style={{ left: -8, background: tokens.bg, color: tokens.ink, border: `1px solid ${tokens.inkMuted}` }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => go(current + 1)}
            className="absolute top-1/2 -translate-y-1/2 rounded-full p-2"
            style={{ right: -8, background: tokens.bg, color: tokens.ink, border: `1px solid ${tokens.inkMuted}` }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {items.map((b, i) => (
            <button
              key={b._id ?? i}
              type="button"
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === current}
              onClick={() => setActive(i)}
              style={{
                width: 8, height: 8, borderRadius: '50%', border: 'none', padding: 0,
                background: i === current ? tokens.accent : tokens.inkMuted, cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Theme-agnostic testimonials renderer: grid or carousel, photo position,
 *  text alignment and the optional title / description / subtitle fields. */
export function TestimonialsSection({ section, blocks, tokens }: {
  section: { settings: Record<string, unknown> };
  blocks: Block[];
  tokens: TestimonialTokens;
}) {
  const items = blocks.filter(b => b.type === 'testimonial');
  if (items.length === 0) return null;
  const settings = section.settings;

  if (settings.layout === 'carousel') {
    return <TestimonialCarousel items={items} settings={settings} tokens={tokens} />;
  }

  const columns = clampColumns(settings.columns);
  return (
    <ul className={`m-0 grid list-none gap-6 p-0 ${COLS_CLASS[columns] ?? COLS_CLASS[3]}`}>
      {items.map((b, i) => (
        <TestimonialCard key={b._id ?? i} block={b} index={i} settings={settings} tokens={tokens} />
      ))}
    </ul>
  );
}