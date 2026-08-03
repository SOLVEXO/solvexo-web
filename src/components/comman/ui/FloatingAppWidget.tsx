import { useState, useRef, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';
import { clsx } from 'clsx';
import { QrGlyph, StoreBadgeChip, RatingRow } from './AppPromoParts';

// Small floating "Get the App" launcher that expands in place into a glass
// download panel — anchored to the button rather than a full-screen modal, so
// it reads as part of the page instead of an interruption.
// Wire this in only on marketing/shopping pages (Home, Marketplace, Product
// Detail, Seller Storefront); never on auth, checkout, account or admin pages.
export function FloatingAppWidget({ mobileBottomClass = 'bottom-[84px]' }: { mobileBottomClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={clsx('fixed z-40 right-4 md:bottom-6 md:right-6', mobileBottomClass)}>
      {open && (
        <div
          role="dialog"
          aria-label="Get the Solvexo app"
          className="dropdown-enter absolute bottom-[calc(100%+12px)] right-0 w-[280px] rounded-2xl border border-white/15 bg-carbon/90 backdrop-blur-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 pt-4">
            <div className="w-9 h-9 rounded-xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center">
              <Smartphone size={16} className="text-brand-orange" />
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white border-none cursor-pointer hover:bg-white/20 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          <div className="px-4 pt-3 pb-4">
            <p className="text-[14px] font-bold text-white leading-tight">Take Solvexo with you</p>
            <p className="text-[11.5px] text-white/55 mt-[4px] leading-relaxed">
              The Solvexo app is on its way — check back soon.
            </p>

            <div className="flex items-center gap-3 mt-3.5 mb-3.5">
              <QrGlyph size={64} />
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <RatingRow />
                <StoreBadgeChip platform="ios" compact />
                <StoreBadgeChip platform="android" compact />
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(p => !p)}
        aria-label="Get the Solvexo app"
        aria-expanded={open}
        className={clsx(
          'flex items-center gap-2 pl-[6px] pr-4 py-[6px] rounded-full bg-carbon text-white',
          'border border-white/10 cursor-pointer',
          'hover:-translate-y-[2px] hover:border-white/25 active:translate-y-0 transition-all duration-200',
        )}
      >
        <span className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center shrink-0">
          <Smartphone size={16} className="text-white" />
        </span>
        <span className="text-[12.5px] font-semibold hidden sm:inline pr-1">Get the App</span>
      </button>
    </div>
  );
}
