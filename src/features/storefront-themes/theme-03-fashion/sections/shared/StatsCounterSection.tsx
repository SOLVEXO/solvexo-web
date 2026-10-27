import { useEffect, useRef, useState } from 'react';
import { PreviewBlock } from '../../../previewInspector';
import { fashionTheme as t } from '../../theme.config';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';
import { formatStat, parseStatValue } from './statValue';

/** Counts from 0 up to the number once it scrolls into view; shows the final value at once for reduced-motion visitors or when IntersectionObserver is missing. */
function CountUp({ value }: { value: string }) {
  const parsed = parseStatValue(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (!parsed) return;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = ref.current;
    if (reduce || !el || typeof IntersectionObserver === 'undefined') { setShown(parsed.target); return; }
    let raf = 0;
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const k = Math.min((now - start) / 1400, 1);
        setShown(parsed.target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `parsed` is derived from `value`
  }, [value]);

  if (!parsed) return <bdi>{value}</bdi>;
  // The final value is the accessible text; the animated number is decoration.
  return (
    <span ref={ref} dir="ltr" aria-label={value}>
      <span aria-hidden>{parsed.prefix}{formatStat(shown ?? 0, parsed)}{parsed.suffix}</span>
    </span>
  );
}

/** "Stats counter": big numbers with a label under each (customers, orders, years). */
export function StatsCounterSection({ section, blocks, colors }: SharedSectionProps) {
  const stats = blocks.filter(b => b.settings.value);
  if (stats.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={section.settings.heading} align="center">
      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 200px), 1fr))` }}>
        {stats.map((b, i) => (
          <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
            <div className="flex h-full flex-col items-center gap-2 p-6 text-center" style={{ background: colors.bgAlt, borderRadius: 24 }}>
              <p className="m-0 text-[clamp(36px,5vw,56px)] font-semibold leading-none tracking-tight" style={{ fontFamily: t.fonts.display, color: colors.ink }}><CountUp value={String(b.settings.value)} /></p>
              {b.settings.label && <p className="m-0 text-sm font-medium" style={{ fontFamily: t.fonts.body, color: colors.inkMuted }}>{b.settings.label}</p>}
            </div>
          </PreviewBlock>
        ))}
      </div>
    </SectionShell>
  );
}
