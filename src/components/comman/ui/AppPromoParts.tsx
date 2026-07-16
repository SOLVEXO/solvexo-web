import { Apple, Play, Star } from 'lucide-react';
import { clsx } from 'clsx';

// Shared, unbranded building blocks for the app-promotion surfaces
// (hero corners, auth branding panel, floating widget). Nothing here renders
// a solid standalone card — callers are responsible for integrating these
// into whatever glassy/transparent surface fits their context.

export function QrGlyph({ size = 74 }: { size?: number }) {
  const finder = 'border-[2.5px] border-carbon rounded-[2px] flex items-center justify-center';
  const noise = [
    1, 0, 1, 0, 1, 0, 1,
    0, 1, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 0, 1,
    0, 0, 1, 0, 1, 0, 1,
    1, 1, 0, 1, 0, 1, 0,
  ];
  const dot = Math.max(3, Math.round(size / 18));
  return (
    <div className="bg-white rounded-[14px] p-[10px] shrink-0 grid grid-rows-[1fr_2fr_1fr] gap-[4px]" style={{ width: size, height: size }}>
      <div className="flex items-center justify-between">
        <div className={clsx(finder, 'w-1/4 h-full')}><span className="rounded-[1px] bg-carbon" style={{ width: dot, height: dot }} /></div>
        <div className={clsx(finder, 'w-1/4 h-full')}><span className="rounded-[1px] bg-carbon" style={{ width: dot, height: dot }} /></div>
      </div>
      <div className="grid grid-cols-7 gap-[3px] px-[3px]">
        {noise.map((v, i) => <div key={i} className={v ? 'bg-carbon rounded-[0.5px]' : ''} />)}
      </div>
      <div className="flex items-center">
        <div className={clsx(finder, 'w-1/4 h-full')}><span className="rounded-[1px] bg-carbon" style={{ width: dot, height: dot }} /></div>
      </div>
    </div>
  );
}

export function StoreBadgeChip({ platform, compact = false }: { platform: 'ios' | 'android'; compact?: boolean }) {
  const isIos = platform === 'ios';
  return (
    <div
      role="img"
      aria-label={isIos ? 'Download on the App Store' : 'Get it on Google Play'}
      className={clsx(
        'flex items-center gap-[7px] rounded-[9px] border border-white/20 bg-white/10 backdrop-blur-sm select-none transition-colors hover:bg-white/[0.16]',
        compact ? 'px-2.5 py-[6px]' : 'px-3.5 py-[9px]',
      )}
    >
      {isIos
        ? <Apple size={compact ? 13 : 17} className="text-white shrink-0" />
        : <Play size={compact ? 11 : 15} className="text-white shrink-0 fill-white" />}
      {compact ? (
        <p className="text-[10.5px] font-semibold text-white leading-none">{isIos ? 'App Store' : 'Google Play'}</p>
      ) : (
        <div className="text-left leading-none">
          <p className="text-[7.5px] text-white/60 mb-[2px]">{isIos ? 'Download on the' : 'GET IT ON'}</p>
          <p className="text-[12.5px] font-bold text-white leading-none">{isIos ? 'App Store' : 'Google Play'}</p>
        </div>
      )}
    </div>
  );
}

export function RatingRow({ label = '4.8 · 500K+ downloads' }: { label?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-[1px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={11} className="text-brand-orange fill-brand-orange" />
        ))}
      </div>
      <span className="text-[10.5px] text-white/60">{label}</span>
    </div>
  );
}

// Phone silhouette built from the app's own UI language — no external assets.
export function PhoneMockup({ className, primary = true, size = 'md' }: { className?: string; primary?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const width = size === 'lg' ? 'w-[168px] sm:w-[190px]' : size === 'sm' ? 'w-[110px]' : 'w-[126px] sm:w-[142px]';
  return (
    <div
      className={clsx(
        width,
        'aspect-[9/19] rounded-[24px] bg-carbon p-[5px]',
        primary ? 'shadow-[0_24px_50px_rgba(0,0,0,0.45)] z-[1]' : 'shadow-[0_16px_36px_rgba(0,0,0,0.35)] opacity-90',
        className,
      )}
    >
      <div className="relative w-full h-full rounded-[19px] bg-cream overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-11 h-3 bg-carbon rounded-b-lg z-10" />
        <div className="h-8 bg-white flex items-center px-2.5 pt-2">
          <div className="w-10 h-[6px] rounded-full bg-brand-pale-orange" />
        </div>
        <div className="mx-[7px] mt-[6px] h-11 rounded-[9px] bg-gradient-to-br from-brand-orange to-brand-deep-orange" />
        <div className="grid grid-cols-2 gap-[5px] px-[7px] mt-[6px]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-[7px] bg-white border border-bone aspect-square flex items-end p-[4px]">
              <div className="w-full h-[4px] rounded-full bg-bone" />
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-7 bg-white border-t border-bone flex items-center justify-around px-2">
          {[0, 1, 2, 3].map(i => <div key={i} className="w-[10px] h-[10px] rounded-full bg-bone" />)}
        </div>
      </div>
    </div>
  );
}

// Small decorative card that "floats" beside the phone mockup — order
// confirmation, a review, etc. Purely illustrative chrome, no invented stats.
export function FloatingMiniCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx(
      'absolute flex items-center gap-2 px-3 py-2 rounded-[12px] border border-white/15 bg-white/10 backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.25)]',
      className,
    )}>
      {children}
    </div>
  );
}
