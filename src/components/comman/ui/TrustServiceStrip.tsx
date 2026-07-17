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
    <div className="bg-cream border-y border-bone py-5">
      <div className="px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-[10px]">
              <div className="w-9 h-9 rounded-full bg-white border border-bone flex items-center justify-center shrink-0">
                <Icon size={16} className="text-brand-orange" />
              </div>
              <p className="text-[12px] font-medium text-charcoal leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
