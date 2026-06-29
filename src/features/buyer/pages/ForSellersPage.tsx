import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Avatar } from '@/components/comman/ui/Avatar';
import { ArrowRight, GraduationCap, Palette, Store, Gem, Briefcase, Building2, ShoppingBag, Hammer, Download, Sparkles, BarChart2, Monitor, CreditCard, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const SERIF = "'Lora', Georgia, serif";

const SELLER_TYPES: { Icon: LucideIcon; title: string; desc: string; cta: string }[] = [
  { Icon: GraduationCap, title: 'Educators',            desc: 'Sell lesson plans, worksheets, bundles, and courses to teachers and students worldwide.',    cta: 'Sell as Educator'   },
  { Icon: Palette,       title: 'Creators & Designers', desc: 'Digital downloads, templates, fonts, and design assets with instant delivery.',               cta: 'Start Creating'     },
  { Icon: Store,         title: 'Retailers',             desc: 'Launch your online store and sell physical products to customers everywhere.',                 cta: 'Open Your Store'    },
  { Icon: Gem,           title: 'Handmade Sellers',      desc: 'Showcase your handcrafted goods on the Solvexo marketplace and your own store.',              cta: 'List Your Craft'    },
  { Icon: Briefcase,     title: 'Brands & Agencies',     desc: 'White-label storefronts, multi-seat management, and advanced analytics.',                     cta: 'Go Enterprise'      },
  { Icon: Building2,     title: 'Schools & Districts',   desc: 'Institutional accounts with volume pricing and centralized resource management.',              cta: 'Contact Us'         },
];

const FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: ShoppingBag, title: 'Marketplace Listings', desc: 'Reach buyers already shopping on Solvexo.'        },
  { Icon: Hammer,      title: 'Custom Storefront',    desc: 'Your brand, your domain, your store.'              },
  { Icon: Download,    title: 'Digital Delivery',     desc: 'Instant file delivery for digital products.'       },
  { Icon: Sparkles,    title: 'AI Tools',             desc: 'AI-powered listing optimization and pricing.'      },
  { Icon: BarChart2,   title: 'Analytics',            desc: 'Real-time sales data and customer insights.'       },
  { Icon: Monitor,     title: 'Point of Sale',        desc: 'Accept payments in person with our mobile POS.'   },
  { Icon: CreditCard,  title: 'Fast Payouts',         desc: 'Get paid within 2 business days, every time.'     },
  { Icon: Lock,        title: 'Seller Protection',    desc: 'Fraud protection and dispute resolution support.'  },
];

const STATS = [
  { value: '50,000+', label: 'Active Sellers' },
  { value: '$180M+',  label: 'GMV Processed'  },
  { value: '4.9 ★',  label: 'Average Rating'  },
  { value: '135+',    label: 'Countries'       },
];

const TESTIMONIALS = [
  { name: 'Maria Santos',   role: 'Educator & Seller',     text: 'Solvexo made it so easy to launch my teaching resource shop. Within 3 months I was earning enough to quit my second job.' },
  { name: 'James Kowalski', role: 'Physical Goods Seller', text: 'The AI tools alone are worth the price. My product descriptions convert so much better now and I spend half the time on admin.' },
  { name: 'Priya Nair',     role: 'Digital Creator',       text: "I've tried every platform out there. Solvexo is the only one that actually understands what digital creators need." },
];

export function ForSellersPage() {
  const navigate = useNavigate();
  usePageTitle('For Sellers');

  return (
    <div className="bg-white min-h-full">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="px-4 md:px-8 lg:px-12 pt-12 md:pt-20 pb-10 md:pb-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #141413 0%, #2C2A28 100%)' }}
      >
        <div className="absolute rounded-full w-[400px] h-[400px] bg-brand-orange opacity-[0.08] -top-[80px] -right-[80px]" />
        <div className="absolute rounded-full w-[300px] h-[300px] bg-[#B95A3A] opacity-[0.06] -bottom-[60px] left-[40%]" />

        <div className="max-w-[760px] mx-auto text-center relative z-[1]">
          <div className="inline-flex items-center gap-2 bg-[rgba(217,119,87,0.15)] border border-[rgba(217,119,87,0.3)] rounded-[20px] px-[14px] py-[5px] mb-6">
            <span className="text-[12px] text-brand-orange font-medium">Trusted by 50,000+ sellers worldwide</span>
          </div>

          <h1 className="block text-3xl md:text-5xl lg:text-[48px] font-bold text-white leading-[1.15] mb-5" style={{ fontFamily: SERIF }}>
            Sell more. Do less.<br />
            With Solvex<span className="text-brand-orange">o</span>.
          </h1>

          <p className="text-sm md:text-[17px] text-[#B0AEA8] leading-[1.7] max-w-[580px] mx-auto mb-9">
            The all-in-one commerce platform for educators, creators, and independent sellers.
            Get your store live in minutes. Start selling today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/onboarding')}>
              Start for Free <ArrowRight size={14} className="inline align-middle ml-1" />
            </Button>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
            >
              See Pricing
            </button>
          </div>
        </div>
      </div>

      {/* ── Seller Types ─────────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 lg:px-12 py-12 md:py-[72px] bg-cream">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-[13px] font-semibold text-brand-orange text-center uppercase tracking-[0.1em] mb-3">Built for you</p>
          <h2 className="text-2xl md:text-[32px] font-bold text-carbon text-center mb-12" style={{ fontFamily: SERIF }}>
            Whatever you sell, we've got you covered
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SELLER_TYPES.map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-7 border border-bone">
                <s.Icon size={36} className="block mb-4 text-brand-orange" />
                <p className="text-[17px] font-bold text-carbon mb-2">{s.title}</p>
                <p className="text-[13px] text-slate leading-[1.7] mb-5">{s.desc}</p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/onboarding')}>
                  {s.cta} <ArrowRight size={14} className="inline align-middle ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature Highlights ───────────────────────────────────────────── */}
      <div className="px-4 md:px-8 lg:px-12 py-12 md:py-[72px] bg-white">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-2xl md:text-[32px] font-bold text-carbon text-center mb-[10px]" style={{ fontFamily: SERIF }}>
            Everything you need to run your business
          </h2>
          <p className="text-[15px] text-slate text-center mb-12">One subscription. Every tool. Zero technical headaches.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-cream rounded-[12px] px-[18px] py-5">
                <f.Icon size={28} className="block mb-3 text-brand-orange" />
                <p className="text-[13px] font-bold text-carbon mb-[6px]">{f.title}</p>
                <p className="text-[12px] text-slate leading-[1.6]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Social Proof ─────────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 lg:px-12 py-12 md:py-[72px] bg-cream border-t border-bone">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center mb-12">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="block text-[32px] font-bold text-brand-orange">{s.value}</p>
                <p className="text-[13px] text-slate">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-bone">
                <p className="block text-[22px] text-brand-orange mb-3">★★★★★</p>
                <p className="text-[13px] text-charcoal leading-[1.8] mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-[10px]">
                  <Avatar name={t.name} size={36} />
                  <div>
                    <p className="block text-[13px] font-semibold text-carbon">{t.name}</p>
                    <p className="text-[11px] text-slate">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="bg-carbon px-4 md:px-8 lg:px-12 py-12 md:py-[72px] text-center">
        <h2 className="block text-2xl md:text-[36px] font-bold text-white mb-[14px]" style={{ fontFamily: SERIF }}>
          Start selling for free today
        </h2>
        <p className="block text-[15px] text-slate mb-9">
          No credit card required. Get your store live in minutes. Upgrade when you're ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => navigate('/onboarding')}>
            Create Free Account <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
          >
            See All Plans
          </button>
        </div>
      </div>
    </div>
  );
}
