import { Truck, ShieldCheck, RefreshCcw, BadgeCheck, Headset, Tag, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

const DEFAULT_ITEMS: { Icon: LucideIcon; label: string; sub?: string }[] = [
  { Icon: Truck,       label: 'Free Shipping'    },
  { Icon: ShieldCheck, label: 'Secure Payments'  },
  { Icon: RefreshCcw,  label: 'Easy Returns'     },
  { Icon: BadgeCheck,  label: 'Verified Sellers' },
  { Icon: Headset,     label: '24/7 Support'     },
  { Icon: Tag,         label: 'Daily Deals'      },
];

interface TrustServiceStripProps {
  /** 'light' (default, unchanged) — the cream strip already used on Marketplace/
   *  EducationMarketplace. 'dark' — carbon bg, for placement inside a dark section
   *  (e.g. right under a dark hero/Flash Sale band). */
  variant?: 'light' | 'dark';
  /** Override the default 6-item list — e.g. a denser 4-item set with subtext. */
  items?: { Icon: LucideIcon; label: string; sub?: string }[];
}

export function TrustServiceStrip({ variant = 'light', items = DEFAULT_ITEMS }: TrustServiceStripProps) {
  const dark = variant === 'dark';
  return (
    <div className={clsx(dark ? 'bg-carbon' : 'bg-cream border-y border-bone', 'py-4')}>
      <div className="px-4 sm:px-6 lg:px-10">
        <div className={clsx(
          'grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3',
          items.length <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-6',
          !dark && 'lg:divide-x lg:divide-bone',
        )}>
          {items.map(({ Icon, label, sub }) => (
            <div key={label} className={clsx('flex items-center gap-[10px] justify-center sm:justify-start', !dark && 'lg:pl-4 lg:first:pl-0')}>
              <span className={clsx('flex size-9 items-center justify-center rounded-full border shrink-0', dark ? 'bg-white/[0.06] border-white/10' : 'bg-white border-bone')}>
                <Icon size={16} className="text-brand-orange" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <p className={clsx('text-[12.5px] font-semibold leading-tight whitespace-nowrap', dark ? 'text-white' : 'text-charcoal')}>{label}</p>
                {sub && <p className={clsx('text-[10.5px] leading-tight mt-[1px]', dark ? 'text-white/50' : 'text-slate')}>{sub}</p>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
