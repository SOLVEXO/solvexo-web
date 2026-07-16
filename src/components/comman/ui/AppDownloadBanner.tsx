import { Zap, PackageCheck, Bell, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { QrGlyph, StoreBadgeChip, RatingRow, PhoneMockup } from './AppPromoParts';

const FEATURES = [
  { Icon: Zap,          text: 'Faster, one-tap checkout' },
  { Icon: PackageCheck, text: 'Real-time order tracking' },
  { Icon: Bell,         text: 'Instant deal & price-drop alerts' },
];

export function AppDownloadBanner({ className }: { className?: string }) {
  return (
    <section className={clsx('relative overflow-hidden rounded-2xl bg-gradient-to-br from-carbon to-charcoal', className)}>
      <div className="absolute w-[280px] h-[280px] rounded-full bg-[#3A3633] -top-20 -right-16 pointer-events-none" />
      <div className="absolute w-[160px] h-[160px] rounded-full bg-brand-orange/[0.08] -bottom-10 left-[20%] pointer-events-none" />

      <div className="relative z-[1] px-6 sm:px-8 lg:px-10 py-9 sm:py-10 grid grid-cols-1 lg:grid-cols-[1.1fr_auto_auto] items-center gap-8 lg:gap-10">

        {/* Copy + features */}
        <div className="text-center lg:text-left min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 bg-[rgba(217,119,87,0.15)] border border-[rgba(217,119,87,0.3)]">
            <ShoppingBag size={12} className="text-brand-orange shrink-0" />
            <span className="text-[11px] font-medium text-brand-orange">Solvexo Mobile</span>
          </div>
          <h3 className="text-[21px] sm:text-[24px] font-bold text-white mb-2 leading-tight">
            Shop faster with the Solvexo app
          </h3>
          <p className="text-[12.5px] sm:text-[13px] text-[#B0AEA8] max-w-[420px] mx-auto lg:mx-0 leading-relaxed mb-4">
            One-tap checkout, live order tracking, and app-only deals — right in your pocket.
          </p>

          <div className="flex justify-center lg:justify-start mb-5">
            <RatingRow />
          </div>

          {/* Feature highlights */}
          <ul className="flex flex-col gap-[9px] mb-6 items-center lg:items-start">
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-[12px] text-white/90">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={11} className="text-brand-orange" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          {/* Store badges */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <StoreBadgeChip platform="ios" />
            <StoreBadgeChip platform="android" />
          </div>
        </div>

        {/* QR code */}
        <div className="hidden lg:flex flex-col items-center gap-2 shrink-0">
          <QrGlyph />
          <p className="text-[10.5px] text-[#B0AEA8] text-center leading-tight max-w-[90px]">Scan to<br />download</p>
        </div>

        {/* Phone mockups */}
        <div className="hidden lg:flex items-center shrink-0 pl-2">
          <PhoneMockup primary={false} className="-mr-9 rotate-[-6deg] translate-y-2" />
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
