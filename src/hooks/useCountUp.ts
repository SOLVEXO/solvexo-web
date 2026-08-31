import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

// Matches an optional leading symbol/text (e.g. "$"), the numeric body
// (commas + optional decimals), and an optional trailing symbol/text (e.g.
// "%", " orders"). Anything that doesn't match this shape (a date, "N/A",
// a raw id) is left completely alone — this hook only ever animates a real
// countable number, never guesses at one.
const NUMERIC_PATTERN = /^([^\d.-]*)(-?[\d,]*\.?\d+)([^\d]*)$/;

interface ParsedMetric {
  prefix:    string;
  suffix:    string;
  value:     number;
  decimals:  number;
  hasCommas: boolean;
}

function parseFormattedNumber(raw: string): ParsedMetric | null {
  const match = raw.match(NUMERIC_PATTERN);
  if (!match) return null;
  const [, prefix, numPart, suffix] = match;
  const value = parseFloat(numPart.replace(/,/g, ''));
  if (Number.isNaN(value)) return null;
  const decimalMatch = numPart.match(/\.(\d+)$/);
  return { prefix, suffix, value, decimals: decimalMatch ? decimalMatch[1].length : 0, hasCommas: numPart.includes(',') };
}

function formatNumber(value: number, decimals: number, hasCommas: boolean): string {
  const fixed = value.toFixed(decimals);
  if (!hasCommas) return fixed;
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a formatted metric string ("$128,420", "18.4%", "3,204") counting
 * up from its previous value once the element first scrolls into view, and
 * again (from the old value, not from zero) whenever `target` changes —
 * e.g. a dashboard filter changing the underlying number. Falls back to
 * rendering the raw value with no animation for anything unparseable, and
 * skips the animation entirely under prefers-reduced-motion.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  target: string | number,
  duration = 900,
): { display: string; ref: RefObject<T | null> } {
  const [display, setDisplay] = useState(() => String(target));
  const ref          = useRef<T | null>(null);
  const inViewRef    = useRef(false);
  const frameRef     = useRef<number | undefined>(undefined);
  const prevValueRef = useRef<number | null>(null);

  const animateTo = useCallback((raw: string) => {
    const parsed = parseFormattedNumber(raw);
    if (!parsed || prefersReducedMotion()) {
      setDisplay(raw);
      prevValueRef.current = parsed?.value ?? null;
      return;
    }
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);

    const from = prevValueRef.current ?? 0;
    const { prefix, suffix, value: to, decimals, hasCommas } = parsed;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(`${prefix}${formatNumber(from + (to - from) * eased, decimals, hasCommas)}${suffix}`);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [duration]);

  useEffect(() => {
    const raw = String(target);

    if (inViewRef.current) { animateTo(raw); return; }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      inViewRef.current = true;
      animateTo(raw);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        inViewRef.current = true;
        animateTo(raw);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, animateTo]);

  useEffect(() => () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
  }, []);

  return { display, ref };
}
