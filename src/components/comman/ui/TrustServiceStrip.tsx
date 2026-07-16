import { Truck, ShieldCheck, RefreshCcw, BadgeCheck, Headset, Tag } from 'lucide-react';

const ITEMS = [
  { Icon: Truck,       label: 'Free Shipping',    desc: 'On eligible orders'       },
  { Icon: ShieldCheck, label: 'Secure Payments',  desc: '100% protected checkout'  },
  { Icon: RefreshCcw,  label: 'Easy Returns',     desc: '7-day return window'      },
  { Icon: BadgeCheck,  label: 'Verified Sellers', desc: 'Quality you can trust'    },
  { Icon: Headset,     label: '24/7 Support',     desc: "We're always here"       },
  { Icon: Tag,         label: 'Daily Deals',      desc: 'New offers every day'     },
];

export function TrustServiceStrip() {
  return (
    <div className="bg-cream py-8 sm:py-10 lg:py-12">
      <div className="px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-[10.5px] font-bold text-brand-orange uppercase tracking-[0.14em] mb-[6px]">Why Solvexo</p>
          <h2 className="font-serif text-[19px] sm:text-[22px] font-bold text-carbon">Shopping you can trust</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {ITEMS.map(({ Icon, label, desc }) => (
            <div
              key={label}
              className={[
                'group relative bg-white rounded-2xl border border-bone p-4 sm:p-5 flex flex-col items-center text-center gap-2.5',
                'transition-all duration-300 ease-out cursor-default',
                'hover:-translate-y-[3px] hover:border-brand-orange/30 hover:shadow-[0_16px_32px_rgba(184,90,54,0.12)]',
              ].join(' ')}
            >
              <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-brand-pale-orange flex items-center justify-center shrink-0 transition-all duration-300 ease-out group-hover:bg-brand-orange group-hover:-rotate-6 group-hover:scale-110">
                <Icon size={20} className="text-brand-orange transition-colors duration-300 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] sm:text-[13px] font-bold text-charcoal leading-tight">{label}</p>
                <p className="text-[10.5px] sm:text-[11px] text-slate mt-[3px] leading-snug hidden sm:block">{desc}</p>
              </div>
              <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-brand-orange scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
