import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';

const FLAG = 'solvexo:splash-shown';
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// A minimal brand splash — just the Solvexo mark, once, centered. No staged
// word sequence (that was tried and explicitly asked to be removed). Fades
// and scales in, holds briefly, then exits with a smooth curtain slide.
// Mounted independently by `PublicLayout` and `AuthSplitLayout` (whichever
// the visitor lands on first) so it plays exactly once per tab session in
// production — in dev it replays on every refresh (import.meta.env.DEV) so
// it can be iterated on without clearing sessionStorage by hand.
const ENTER_MS = 450;
const HOLD_MS = 350;
const EXIT_MS = 550;

export function BrandSplash() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (import.meta.env.DEV) return true;
    return sessionStorage.getItem(FLAG) !== '1';
  });

  useEffect(() => {
    if (!visible) return;
    if (!import.meta.env.DEV) sessionStorage.setItem(FLAG, '1');
    const t = setTimeout(() => setVisible(false), ENTER_MS + HOLD_MS);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[999] bg-carbon flex items-center justify-center"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: EXIT_MS / 1000, ease: EASE_OUT }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: ENTER_MS / 1000, ease: EASE_OUT }}
          >
            <SolvexoLogo size={40} variant="light" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
