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
    <div className="bg-cream border-y border-bone py-4">
      <div className="px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-3 lg:divide-x lg:divide-bone">
          {ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-[10px] justify-center sm:justify-start lg:pl-4 lg:first:pl-0">
              <span className="flex size-9 items-center justify-center rounded-full bg-white border border-bone shrink-0">
                <Icon size={16} className="text-brand-orange" strokeWidth={2} />
              </span>
              <p className="text-[12.5px] font-semibold text-charcoal leading-tight whitespace-nowrap">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
