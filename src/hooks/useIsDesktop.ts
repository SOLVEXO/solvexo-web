import { useEffect, useState } from 'react';

// Mirrors Tailwind's `md:` breakpoint (768px) so a component can pick between
// two genuinely different inline-styled layouts (not just CSS classes) —
// needed wherever a value comes from a JS theme token (e.g. `t.colors.border`)
// rather than a static Tailwind class Tailwind's own responsive variants could
// otherwise handle.
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}
