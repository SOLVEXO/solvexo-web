import { Truck, ShieldCheck, RefreshCcw, BadgeCheck, Headset, Tag } from 'lucide-react';

const ITEMS = [
  { Icon: Truck,       label: 'Free Shipping'    },
  { Icon: ShieldCheck, label: 'Secure Payments'  },
  { Icon: RefreshCcw,  label: 'Easy Returns'     },
  { Icon: BadgeCheck,  label: 'Verified Sellers' },
  { Icon: Headset,     label: '24/7 Support'     },
  { Icon: Tag,         label: 'Daily Deals'      },
];

export function TrustServiceStrip() {
  return (
    <div className="bg-cream border-y border-bone py-2.5">
      <div className="px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-2 gap-x-2">
          {ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center justify-center sm:justify-start gap-[7px]">
              <Icon size={13} className="text-brand-orange shrink-0" strokeWidth={2} />
              <p className="text-[11px] font-medium text-slate leading-tight whitespace-nowrap">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
