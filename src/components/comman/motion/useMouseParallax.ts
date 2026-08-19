import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useReducedMotion } from 'motion/react';

// Tracks normalized pointer position (-0.5..0.5 on each axis) within the
// element the returned `ref` is attached to — desktop-only (checks for a
// fine pointer + hover support, same gate `MagneticButton` uses) and a
// no-op under prefers-reduced-motion, so callers building a parallax
// composition don't need to re-derive either guard themselves. Callers
// scale `px`/`py` per element (via `useTransform`) for independent
// parallax depth instead of every layer moving at the same rate.
export function useMouseParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 60, damping: 16, mass: 0.5 });
  const py = useSpring(rawY, { stiffness: 60, damping: 16, mass: 0.5 });

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      rawX.set((e.clientX - rect.left) / rect.width - 0.5);
      rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    }
    function handleLeave() {
      rawX.set(0);
      rawY.set(0);
    }
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [reduceMotion, rawX, rawY]);

  return { ref, px, py };
}
