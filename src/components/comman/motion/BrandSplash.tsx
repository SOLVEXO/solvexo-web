import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';

const FLAG = 'solvexo:splash-shown';
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// One-time brand splash for a visitor's first hit of the public site this
// tab session — mounted independently by `PublicLayout` and `AuthSplitLayout`
// (whichever the visitor actually lands on first) so it plays exactly once no
// matter the entry route, never again on internal navigation between public
// pages. The page underneath renders and fetches immediately; this is a
// fixed overlay on top of already-live content, not a blocking gate, so it
// never delays anything real — it just gets out of the way quickly.
export function BrandSplash() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return sessionStorage.getItem(FLAG) !== '1';
  });

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem(FLAG, '1');
    const t = setTimeout(() => setVisible(false), 650);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[999] bg-carbon flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <SolvexoIcon size={52} />
            <motion.div
              className="h-[2px] w-10 rounded-full bg-brand-orange origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
