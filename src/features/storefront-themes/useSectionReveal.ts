import { useEffect } from 'react';

/** Fades / slides sections in the first time they scroll into view (sections with an "Entrance animation").
 *  Never runs in the editor (`enabled` false) and does nothing for people who asked for reduced motion (CSS). */
export function useSectionReveal(enabled: boolean, depKey: string): void {
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.sx-anim:not([data-sx-seen])'));
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).removeAttribute('data-sx-pre');
        io.unobserve(e.target);
      }
    }, { threshold: 0.12 });
    for (const el of els) {
      el.setAttribute('data-sx-seen', '1');
      el.setAttribute('data-sx-pre', '1');
      io.observe(el);
    }
    return () => {
      io.disconnect();
      // never leave a section hidden when the list re-renders
      for (const el of els) { el.removeAttribute('data-sx-pre'); el.removeAttribute('data-sx-seen'); }
    };
  }, [enabled, depKey]);
}
